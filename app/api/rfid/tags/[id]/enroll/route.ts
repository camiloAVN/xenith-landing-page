import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { rfidEnrollmentSchema } from '@/lib/validations/rfid'
import { enrollTag, unenrollTag } from '@/lib/rfid/processor'
import { ZodError } from 'zod'

// POST /api/rfid/tags/[id]/enroll - Enroll tag to inventory item
export async function POST(
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
    const validatedData = rfidEnrollmentSchema.parse(body)

    await enrollTag(id, validatedData.inventoryItemId)

    // Get updated tag
    const tag = await prisma.rfidTag.findUnique({
      where: { id },
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

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    console.error('Error enrolling RFID tag:', error)
    return NextResponse.json(
      { error: 'Error al vincular tag RFID' },
      { status: 500 }
    )
  }
}

// DELETE /api/rfid/tags/[id]/enroll - Unenroll tag from inventory item
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

    await unenrollTag(id)

    // Get updated tag
    const tag = await prisma.rfidTag.findUnique({
      where: { id },
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
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    console.error('Error unenrolling RFID tag:', error)
    return NextResponse.json(
      { error: 'Error al desvincular tag RFID' },
      { status: 500 }
    )
  }
}
