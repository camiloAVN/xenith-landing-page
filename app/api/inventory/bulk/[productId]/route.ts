import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { bulkInventorySchema } from '@/lib/validations/bulkInventory'
import { canViewModule, canEditModule } from '@/lib/auth/check-permission'
import { ZodError } from 'zod'

// GET /api/inventory/bulk/[productId] - Get bulk inventory for product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const permissionCheck = await canViewModule('inventario')
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      )
    }

    const { productId } = await params

    const bulkInventory = await prisma.bulkInventory.findUnique({
      where: { productId },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            brand: true,
            model: true,
            category: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
        movements: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: { movements: true },
        },
      },
    })

    if (!bulkInventory) {
      return NextResponse.json(
        { error: 'Inventario bulk no encontrado para este producto' },
        { status: 404 }
      )
    }

    return NextResponse.json(bulkInventory)
  } catch (error) {
    console.error('Error fetching bulk inventory:', error)
    return NextResponse.json(
      { error: 'Error al obtener inventario bulk' },
      { status: 500 }
    )
  }
}

// PUT /api/inventory/bulk/[productId] - Update bulk inventory settings
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const permissionCheck = await canEditModule('inventario')
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      )
    }

    const { productId } = await params
    const body = await request.json()
    const validatedData = bulkInventorySchema.parse({ ...body, productId })

    // Upsert bulk inventory
    const bulkInventory = await prisma.bulkInventory.upsert({
      where: { productId },
      update: {
        minQuantity: validatedData.minQuantity ?? null,
        location: validatedData.location || null,
      },
      create: {
        productId,
        quantity: validatedData.quantity,
        minQuantity: validatedData.minQuantity ?? null,
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
        _count: {
          select: { movements: true },
        },
      },
    })

    return NextResponse.json(bulkInventory)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', issues: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating bulk inventory:', error)
    return NextResponse.json(
      { error: 'Error al actualizar inventario bulk' },
      { status: 500 }
    )
  }
}
