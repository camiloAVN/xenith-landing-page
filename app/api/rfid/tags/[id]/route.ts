import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { rfidTagSchema } from '@/lib/validations/rfid'
import { ZodError } from 'zod'

// GET /api/rfid/tags/[id] - Get single RFID tag
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const tag = await prisma.rfidTag.findUnique({
      where: { id },
      include: {
        inventoryItem: {
          select: {
            id: true,
            serialNumber: true,
            assetTag: true,
            status: true,
            location: true,
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                brand: true,
                model: true,
              },
            },
          },
        },
        detections: {
          take: 50,
          orderBy: { timestamp: 'desc' },
        },
        _count: {
          select: { detections: true },
        },
      },
    })

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag RFID no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(tag)
  } catch (error) {
    console.error('Error fetching RFID tag:', error)
    return NextResponse.json(
      { error: 'Error al obtener tag RFID' },
      { status: 500 }
    )
  }
}

// PUT /api/rfid/tags/[id] - Update RFID tag
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = rfidTagSchema.parse(body)

    const tag = await prisma.rfidTag.update({
      where: { id },
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

    return NextResponse.json(tag)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', issues: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating RFID tag:', error)
    return NextResponse.json(
      { error: 'Error al actualizar tag RFID' },
      { status: 500 }
    )
  }
}

// DELETE /api/rfid/tags/[id] - Delete RFID tag
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const tag = await prisma.rfidTag.findUnique({
      where: { id },
    })

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag RFID no encontrado' },
        { status: 404 }
      )
    }

    await prisma.rfidTag.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting RFID tag:', error)
    return NextResponse.json(
      { error: 'Error al eliminar tag RFID' },
      { status: 500 }
    )
  }
}
