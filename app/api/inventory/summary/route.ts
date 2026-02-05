import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { canViewModule } from '@/lib/auth/check-permission'

// GET /api/inventory/summary - Get inventory summary
export async function GET(request: NextRequest) {
  try {
    const permissionCheck = await canViewModule('inventario')
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      )
    }

    // Get counts by status
    const byStatus = await prisma.inventoryItem.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    })

    // Get counts by type
    const byType = await prisma.inventoryItem.groupBy({
      by: ['type'],
      _count: {
        id: true,
      },
    })

    // Format response
    const statusCounts = {
      IN: 0,
      OUT: 0,
      MAINTENANCE: 0,
      LOST: 0,
    }

    byStatus.forEach((item) => {
      statusCounts[item.status as keyof typeof statusCounts] = item._count.id
    })

    const typeCounts = {
      UNIT: 0,
      CONTAINER: 0,
    }

    byType.forEach((item) => {
      if (item.type !== 'BULK') {
        typeCounts[item.type as keyof typeof typeCounts] = item._count.id
      }
    })

    const total = Object.values(statusCounts).reduce((a, b) => a + b, 0)

    // Get recent movements
    const recentMovements = await prisma.inventoryMovement.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        inventoryItem: {
          select: {
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
            name: true,
            email: true,
          },
        },
      },
    })

    // Get items by category
    const byCategory = await prisma.inventoryItem.groupBy({
      by: ['productId'],
      _count: {
        id: true,
      },
    })

    const productIds = byCategory.map((item) => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    })

    const categoryCounts: Record<string, { name: string; color: string | null; count: number }> = {}

    byCategory.forEach((item) => {
      const product = products.find((p) => p.id === item.productId)
      if (product?.category) {
        const catId = product.category.id
        if (!categoryCounts[catId]) {
          categoryCounts[catId] = {
            name: product.category.name,
            color: product.category.color,
            count: 0,
          }
        }
        categoryCounts[catId].count += item._count.id
      }
    })

    return NextResponse.json({
      total,
      byStatus: statusCounts,
      byType: typeCounts,
      byCategory: Object.values(categoryCounts),
      recentMovements,
    })
  } catch (error) {
    console.error('Error fetching inventory summary:', error)
    return NextResponse.json(
      { error: 'Error al obtener resumen de inventario' },
      { status: 500 }
    )
  }
}
