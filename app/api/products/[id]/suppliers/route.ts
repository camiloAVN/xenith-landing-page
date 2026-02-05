import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { productSupplierSchema } from '@/lib/validations/product'
import { canViewModule, canEditModule } from '@/lib/auth/check-permission'
import { ZodError } from 'zod'

// POST /api/products/[id]/suppliers - Add supplier to product
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permissionCheck = await canEditModule('productos')
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      )
    }

    const { id: productId } = await params
    const body = await request.json()
    const validatedData = productSupplierSchema.parse(body)

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Verify supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: validatedData.supplierId },
    })

    if (!supplier) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      )
    }

    // Create or update relationship
    const productSupplier = await prisma.productSupplier.upsert({
      where: {
        productId_supplierId: {
          productId,
          supplierId: validatedData.supplierId,
        },
      },
      update: {
        supplierSku: validatedData.supplierSku || null,
        cost: validatedData.cost ?? null,
        isPreferred: validatedData.isPreferred,
      },
      create: {
        productId,
        supplierId: validatedData.supplierId,
        supplierSku: validatedData.supplierSku || null,
        cost: validatedData.cost ?? null,
        isPreferred: validatedData.isPreferred,
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(productSupplier, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', issues: error.issues },
        { status: 400 }
      )
    }

    console.error('Error adding supplier to product:', error)
    return NextResponse.json(
      { error: 'Error al agregar proveedor al producto' },
      { status: 500 }
    )
  }
}

// GET /api/products/[id]/suppliers - Get product suppliers
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permissionCheck = await canViewModule('productos')
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      )
    }

    const { id: productId } = await params

    const suppliers = await prisma.productSupplier.findMany({
      where: { productId },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: [
        { isPreferred: 'desc' },
        { supplier: { name: 'asc' } },
      ],
    })

    return NextResponse.json(suppliers)
  } catch (error) {
    console.error('Error fetching product suppliers:', error)
    return NextResponse.json(
      { error: 'Error al obtener proveedores del producto' },
      { status: 500 }
    )
  }
}
