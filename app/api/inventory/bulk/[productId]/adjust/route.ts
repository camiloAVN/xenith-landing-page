import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { bulkAdjustmentSchema } from '@/lib/validations/bulkInventory'
import { ZodError } from 'zod'

// POST /api/inventory/bulk/[productId]/adjust - Adjust bulk inventory quantity
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId } = await params
    const body = await request.json()
    const validatedData = bulkAdjustmentSchema.parse(body)

    // Get or create bulk inventory
    let bulkInventory = await prisma.bulkInventory.findUnique({
      where: { productId },
    })

    if (!bulkInventory) {
      // Verify product exists
      const product = await prisma.product.findUnique({
        where: { id: productId },
      })

      if (!product || product.deletedAt) {
        return NextResponse.json(
          { error: 'Producto no encontrado o inactivo' },
          { status: 404 }
        )
      }

      bulkInventory = await prisma.bulkInventory.create({
        data: {
          productId,
          quantity: 0,
        },
      })
    }

    const previousQty = bulkInventory.quantity
    const newQty = previousQty + validatedData.quantity

    if (newQty < 0) {
      return NextResponse.json(
        { error: 'No hay suficiente stock disponible' },
        { status: 400 }
      )
    }

    // Determine movement type
    const movementType = validatedData.quantity > 0 ? 'CHECK_IN' : 'CHECK_OUT'

    // Update quantity and create movement in transaction
    const [updatedBulk, movement] = await prisma.$transaction([
      prisma.bulkInventory.update({
        where: { productId },
        data: { quantity: newQty },
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
              category: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
            },
          },
          _count: {
            select: { movements: true },
          },
        },
      }),
      prisma.bulkMovement.create({
        data: {
          bulkInventoryId: bulkInventory.id,
          type: movementType,
          quantity: validatedData.quantity,
          previousQty,
          newQty,
          reason: validatedData.reason,
          reference: validatedData.reference || null,
          performedBy: session.user.id as string,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ])

    return NextResponse.json({
      bulkInventory: updatedBulk,
      movement,
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', issues: error.issues },
        { status: 400 }
      )
    }

    console.error('Error adjusting bulk inventory:', error)
    return NextResponse.json(
      { error: 'Error al ajustar inventario bulk' },
      { status: 500 }
    )
  }
}
