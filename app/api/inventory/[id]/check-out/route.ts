import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { checkInOutSchema } from '@/lib/validations/inventory'
import { canEditModule } from '@/lib/auth/check-permission'
import { ZodError } from 'zod'

// POST /api/inventory/[id]/check-out - Check out inventory item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permissionCheck = await canEditModule('items')
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = checkInOutSchema.parse(body)

    // Get current item
    const currentItem = await prisma.inventoryItem.findUnique({
      where: { id },
    })

    if (!currentItem) {
      return NextResponse.json(
        { error: 'Item de inventario no encontrado' },
        { status: 404 }
      )
    }

    if (currentItem.status === 'OUT') {
      return NextResponse.json(
        { error: 'El item ya está fuera' },
        { status: 400 }
      )
    }

    if (currentItem.status === 'LOST') {
      return NextResponse.json(
        { error: 'No se puede hacer check-out de un item perdido' },
        { status: 400 }
      )
    }

    // Update item status to OUT
    const item = await prisma.inventoryItem.update({
      where: { id },
      data: {
        status: 'OUT',
        location: validatedData.location || null,
      },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
          },
        },
      },
    })

    // Create movement record
    await prisma.inventoryMovement.create({
      data: {
        inventoryItemId: item.id,
        type: 'CHECK_OUT',
        fromStatus: currentItem.status,
        toStatus: 'OUT',
        fromLocation: currentItem.location,
        toLocation: validatedData.location,
        reason: validatedData.reason,
        reference: validatedData.reference,
        performedBy: permissionCheck.userId!,
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', issues: error.issues },
        { status: 400 }
      )
    }

    console.error('Error checking out inventory item:', error)
    return NextResponse.json(
      { error: 'Error al registrar salida del item' },
      { status: 500 }
    )
  }
}
