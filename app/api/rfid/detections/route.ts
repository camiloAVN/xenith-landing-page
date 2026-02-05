import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { canViewModule } from '@/lib/auth/check-permission'

// GET /api/rfid/detections - List RFID detections
export async function GET(request: NextRequest) {
  try {
    const permissionCheck = await canViewModule('rfid')
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      )
    }

    const { searchParams } = new URL(request.url)
    const rfidTagId = searchParams.get('rfidTagId') || ''
    const readerId = searchParams.get('readerId') || ''
    const direction = searchParams.get('direction') || ''
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Record<string, unknown> = {}

    if (rfidTagId) {
      where.rfidTagId = rfidTagId
    }

    if (readerId) {
      where.readerId = readerId
    }

    if (direction && ['IN', 'OUT'].includes(direction)) {
      where.direction = direction
    }

    const [detections, total] = await Promise.all([
      prisma.rfidDetection.findMany({
        where,
        include: {
          rfidTag: {
            select: {
              id: true,
              epc: true,
              status: true,
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
            },
          },
        },
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.rfidDetection.count({ where }),
    ])

    return NextResponse.json({
      detections,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching RFID detections:', error)
    return NextResponse.json(
      { error: 'Error al obtener detecciones RFID' },
      { status: 500 }
    )
  }
}
