import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'

// DELETE /api/products/[id]/suppliers/[supplierId] - Remove supplier from product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; supplierId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: productId, supplierId } = await params

    // Check if relationship exists
    const productSupplier = await prisma.productSupplier.findUnique({
      where: {
        productId_supplierId: {
          productId,
          supplierId,
        },
      },
    })

    if (!productSupplier) {
      return NextResponse.json(
        { error: 'Relación producto-proveedor no encontrada' },
        { status: 404 }
      )
    }

    await prisma.productSupplier.delete({
      where: {
        productId_supplierId: {
          productId,
          supplierId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing supplier from product:', error)
    return NextResponse.json(
      { error: 'Error al eliminar proveedor del producto' },
      { status: 500 }
    )
  }
}
