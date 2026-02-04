import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { rfidTagSchema } from '@/lib/validations/rfid'
import { ZodError } from 'zod'

// GET /api/rfid/tags - List all RFID tags
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    const where: Record<string, unknown> = {}

    // Search filter
    if (search) {
      where.OR = [
        { epc: { contains: search, mode: 'insensitive' } },
        { tid: { contains: search, mode: 'insensitive' } },
        { inventoryItem: { serialNumber: { contains: search, mode: 'insensitive' } } },
        { inventoryItem: { assetTag: { contains: search, mode: 'insensitive' } } },
      ]
    }

    // Status filter
    if (status && ['ENROLLED', 'UNASSIGNED', 'UNKNOWN'].includes(status)) {
      where.status = status
    }

    const tags = await prisma.rfidTag.findMany({
      where,
      include: {
        inventoryItem: {
          select: {
            id: true,
            serialNumber: true,
            assetTag: true,
            status: true,
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: { detections: true },
        },
      },
      orderBy: { lastSeenAt: 'desc' },
    })

    return NextResponse.json(tags)
  } catch (error) {
    console.error('Error fetching RFID tags:', error)
    return NextResponse.json(
      { error: 'Error al obtener tags RFID' },
      { status: 500 }
    )
  }
}

// POST /api/rfid/tags - Create new RFID tag manually
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = rfidTagSchema.parse(body)

    // Check if EPC already exists
    const existingTag = await prisma.rfidTag.findUnique({
      where: { epc: validatedData.epc },
    })

    if (existingTag) {
      return NextResponse.json(
        { error: 'Ya existe un tag con ese EPC' },
        { status: 400 }
      )
    }

    const tag = await prisma.rfidTag.create({
      data: {
        epc: validatedData.epc,
        tid: validatedData.tid || null,
        inventoryItemId: validatedData.inventoryItemId || null,
        status: validatedData.inventoryItemId ? 'ENROLLED' : validatedData.status,
      },
      include: {
        inventoryItem: {
          select: {
            id: true,
            serialNumber: true,
            assetTag: true,
            status: true,
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: { detections: true },
        },
      },
    })

    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', issues: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating RFID tag:', error)
    return NextResponse.json(
      { error: 'Error al crear tag RFID' },
      { status: 500 }
    )
  }
}
