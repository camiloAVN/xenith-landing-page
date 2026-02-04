import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'

// GET /api/rfid/tags/unknown - List unknown RFID tags
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
