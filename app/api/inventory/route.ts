import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { inventoryItemSchema } from '@/lib/validations/inventory'
import { canViewModule, canEditModule } from '@/lib/auth/check-permission'
import { ZodError } from 'zod'

// GET /api/inventory - List all inventory items
export async function GET(request: NextRequest) {
  try {
    const permissionCheck = await canViewModule('items')
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''
    const productId = searchParams.get('productId') || ''
    const containerId = searchParams.get('containerId') || ''

    const where: Record<string, unknown> = {}

    // Search filter
    if (search) {
      where.OR = [
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { assetTag: { contains: search, mode: 'insensitive' } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
        { product: { sku: { contains: search, mode: 'insensitive' } } },
      ]
    }

    // Status filter
    if (status && ['IN', 'OUT', 'MAINTENANCE', 'LOST'].includes(status)) {
      where.status = status
    }

    // Type filter
    if (type && ['UNIT', 'CONTAINER'].includes(type)) {
      where.type = type
    }

    // Product filter
    if (productId) {
      where.productId = productId
    }

    // Container filter
    if (containerId) {
      where.containerId = containerId
    }

    const items = await prisma.inventoryItem.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            brand: true,
            model: true,
            unitPrice: true,
            rentalPrice: true,
            category: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
        container: {
          select: {
            id: true,
            assetTag: true,
            serialNumber: true,
          },
        },
        rfidTag: {
          select: {
            id: true,
            epc: true,
            status: true,
            lastSeenAt: true,
          },
        },
        _count: {
          select: {
            movements: true,
            contents: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching inventory items:', error)
    return NextResponse.json(
      { error: 'Error al obtener items de inventario' },
      { status: 500 }
    )
  }
}

// POST /api/inventory - Create new inventory item
export async function POST(request: NextRequest) {
  try {
    const permissionCheck = await canEditModule('items')
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      )
    }

    const body = await request.json()
    const validatedData = inventoryItemSchema.parse(body)

    // Verify product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: validatedData.productId },
    })

    if (!product || product.deletedAt) {
      return NextResponse.json(
        { error: 'Producto no encontrado o inactivo' },
        { status: 404 }
      )
    }

    // Clean data
    const data = {
      productId: validatedData.productId,
      serialNumber: validatedData.serialNumber || null,
      assetTag: validatedData.assetTag || null,
      type: validatedData.type,
      status: validatedData.status,
      condition: validatedData.condition || null,
      location: validatedData.location || null,
      containerId: validatedData.containerId || null,
      purchaseDate: validatedData.purchaseDate ? new Date(validatedData.purchaseDate) : null,
      purchasePrice: validatedData.purchasePrice ?? null,
      warrantyExpiry: validatedData.warrantyExpiry ? new Date(validatedData.warrantyExpiry) : null,
      notes: validatedData.notes || null,
    }

    const item = await prisma.inventoryItem.create({
      data,
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
        _count: {
          select: {
            movements: true,
            contents: true,
          },
        },
      },
    })

    // Create enrollment movement
    await prisma.inventoryMovement.create({
      data: {
        inventoryItemId: item.id,
        type: 'ENROLLMENT',
        toStatus: item.status,
        toLocation: item.location,
        reason: 'Registro inicial',
        performedBy: permissionCheck.userId!,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Datos invalidos', issues: error.issues },
        { status: 400 }
      )
    }

    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      if (error.message.includes('serialNumber')) {
        return NextResponse.json(
          { error: 'Ya existe un item con ese numero de serie' },
          { status: 400 }
        )
      }
      if (error.message.includes('assetTag')) {
        return NextResponse.json(
          { error: 'Ya existe un item con esa etiqueta de activo' },
          { status: 400 }
        )
      }
    }

    console.error('Error creating inventory item:', error)
    return NextResponse.json(
      { error: 'Error al crear item de inventario' },
      { status: 500 }
    )
  }
}
