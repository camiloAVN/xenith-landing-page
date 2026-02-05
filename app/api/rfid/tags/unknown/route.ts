import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { canViewModule } from '@/lib/auth/check-permission'

// GET /api/rfid/tags/unknown - List unknown RFID tags
export async function GET(request: NextRequest) {
  try {
    const permissionCheck = await canViewModule('rfid')
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      )
    }

    const tags = await prisma.rfidTag.findMany({
      where: {
        status: 'UNKNOWN',
      },
      include: {
        _count: {
          select: { detections: true },
        },
      },
      orderBy: { lastSeenAt: 'desc' },
    })

    return NextResponse.json(tags)
  } catch (error) {
    console.error('Error fetching unknown RFID tags:', error)
    return NextResponse.json(
      { error: 'Error al obtener tags RFID desconocidos' },
      { status: 500 }
    )
  }
}
