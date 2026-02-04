import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { checkInOutSchema } from '@/lib/validations/inventory'
import { ZodError } from 'zod'

// POST /api/inventory/[id]/check-in - Check in inventory item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    if (currentItem.status === 'IN') {
      return NextResponse.json(
        { error: 'El item ya está en bodega' },
        { status: 400 }
      )
    }

    // Update item status to IN
    const item = await prisma.inventoryItem.update({
      where: { id },
      data: {
        status: 'IN',
        location: validatedData.location || currentItem.location,
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
        type: 'CHECK_IN',
        fromStatus: currentItem.status,
        toStatus: 'IN',
        fromLocation: currentItem.location,
        toLocation: validatedData.location || currentItem.location,
        reason: validatedData.reason,
        reference: validatedData.reference,
        performedBy: session.user.id as string,
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

    console.error('Error checking in inventory item:', error)
    return NextResponse.json(
      { error: 'Error al registrar entrada del item' },
      { status: 500 }
    )
  }
}
