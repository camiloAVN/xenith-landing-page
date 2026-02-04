import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'

// GET /api/inventory/movements - List all inventory movements
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || ''
    const inventoryItemId = searchParams.get('inventoryItemId') || ''
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Record<string, unknown> = {}

    // Type filter
    if (type && ['CHECK_IN', 'CHECK_OUT', 'ADJUSTMENT', 'ENROLLMENT', 'TRANSFER'].includes(type)) {
      where.type = type
    }

    // Item filter
    if (inventoryItemId) {
      where.inventoryItemId = inventoryItemId
    }

    const [movements, total] = await Promise.all([
      prisma.inventoryMovement.findMany({
        where,
        include: {
          inventoryItem: {
            select: {
              id: true,
              serialNumber: true,
              assetTag: true,
              product: {
                select: {
                  name: true,
                  sku: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.inventoryMovement.count({ where }),
    ])

    return NextResponse.json({
      movements,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching inventory movements:', error)
    return NextResponse.json(
      { error: 'Error al obtener movimientos de inventario' },
      { status: 500 }
    )
  }
}
