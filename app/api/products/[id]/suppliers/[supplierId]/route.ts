import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { canEditModule } from '@/lib/auth/check-permission'

// DELETE /api/products/[id]/suppliers/[supplierId] - Remove supplier from product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; supplierId: string }> }
) {
  try {
    const permissionCheck = await canEditModule('productos')
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      )
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
