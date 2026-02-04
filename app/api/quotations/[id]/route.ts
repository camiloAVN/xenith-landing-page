import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { quotationSchema } from '@/lib/validations/quotation'
import { ZodError } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

// GET /api/quotations/[id] - Get single quotation
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

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        client: true,
        project: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          orderBy: { order: 'asc' },
          include: {
            inventoryItem: {
              select: {
                id: true,
                serialNumber: true,
                assetTag: true,
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
          },
        },
      },
    })

    if (!quotation) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(quotation)
  } catch (error) {
    console.error('Error fetching quotation:', error)
    return NextResponse.json(
      { error: 'Error al obtener cotización' },
      { status: 500 }
    )
  }
}

// PUT /api/quotations/[id] - Update quotation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = quotationSchema.parse(body)

    // Calculate totals
    let subtotal = new Decimal(0)
    const items = validatedData.items.map((item, index) => {
      const itemTotal = new Decimal(item.quantity).times(new Decimal(item.unitPrice))
      subtotal = subtotal.plus(itemTotal)

      return {
        inventoryItemId: item.inventoryItemId || null,
        description: item.description,
        quantity: item.quantity,
        unitPrice: new Decimal(item.unitPrice),
        total: itemTotal,
        order: index,
      }
    })

    const discount = validatedData.discount ? new Decimal(validatedData.discount) : new Decimal(0)
    const taxRate = validatedData.tax ? new Decimal(validatedData.tax) : new Decimal(16)

    const subtotalAfterDiscount = subtotal.minus(discount)
    const tax = subtotalAfterDiscount.times(taxRate).dividedBy(100)
    const total = subtotalAfterDiscount.plus(tax)

    // Delete existing items and create new ones
    await prisma.quotationItem.deleteMany({
      where: { quotationId: id },
    })

    const quotation = await prisma.quotation.update({
      where: { id },
      data: {
        title: validatedData.title,
        description: validatedData.description || null,
        clientId: validatedData.clientId,
        projectId: validatedData.projectId || null,
        status: validatedData.status,
        validUntil: new Date(validatedData.validUntil),
        subtotal,
        tax,
        discount,
        total,
        notes: validatedData.notes || null,
        terms: validatedData.terms || null,
        items: {
          create: items,
        },
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          orderBy: { order: 'asc' },
          include: {
            inventoryItem: {
              select: {
                id: true,
                serialNumber: true,
                assetTag: true,
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
          },
        },
      },
    })

    return NextResponse.json(quotation)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', issues: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating quotation:', error)
    return NextResponse.json(
      { error: 'Error al actualizar cotización' },
      { status: 500 }
    )
  }
}

// DELETE /api/quotations/[id] - Delete quotation
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

    // Check if quotation exists
    const quotation = await prisma.quotation.findUnique({
      where: { id },
    })

    if (!quotation) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      )
    }

    // Delete quotation (items will cascade)
    await prisma.quotation.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting quotation:', error)
    return NextResponse.json(
      { error: 'Error al eliminar cotización' },
      { status: 500 }
    )
  }
}
