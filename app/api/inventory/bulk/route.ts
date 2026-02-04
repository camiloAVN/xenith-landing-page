import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'

// GET /api/inventory/bulk - List all bulk inventory
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const lowStock = searchParams.get('lowStock') === 'true'

    const where: Record<string, unknown> = {}

    // Search filter
    if (search) {
      where.product = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      }
    }

    const bulkItems = await prisma.bulkInventory.findMany({
      where,
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
          select: { movements: true },
        },
      },
      orderBy: { product: { name: 'asc' } },
    })

    // Filter low stock if requested
    const result = lowStock
      ? bulkItems.filter((item) => item.minQuantity && item.quantity <= item.minQuantity)
      : bulkItems

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching bulk inventory:', error)
    return NextResponse.json(
      { error: 'Error al obtener inventario bulk' },
      { status: 500 }
    )
  }
}
