import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { quotationSchema } from '@/lib/validations/quotation'
import { ZodError } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

// Generate unique quotation number (format: QT-YYYY-0001)
async function generateQuotationNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `QT-${year}-`

  const lastQuotation = await prisma.quotation.findFirst({
    where: {
      quotationNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      quotationNumber: 'desc',
    },
  })

  if (!lastQuotation) {
    return `${prefix}0001`
  }

  const lastNumber = parseInt(lastQuotation.quotationNumber.split('-')[2])
  const newNumber = (lastNumber + 1).toString().padStart(4, '0')

  return `${prefix}${newNumber}`
}

// GET /api/quotations - List all quotations with filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')
    const projectId = searchParams.get('projectId')

    const where: any = {}

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { quotationNumber: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Status filter
    if (status) {
      where.status = status
    }

    // Client filter
    if (clientId) {
      where.clientId = clientId
    }

    // Project filter
    if (projectId) {
      where.projectId = projectId
    }

    const quotations = await prisma.quotation.findMany({
      where,
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
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(quotations)
  } catch (error) {
    console.error('Error fetching quotations:', error)
    return NextResponse.json(
      { error: 'Error al obtener cotizaciones' },
      { status: 500 }
    )
  }
}

// POST /api/quotations - Create new quotation
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = quotationSchema.parse(body)

    // Generate quotation number
    const quotationNumber = await generateQuotationNumber()

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
    const taxRate = validatedData.tax ? new Decimal(validatedData.tax) : new Decimal(16) // Default 16%

    const subtotalAfterDiscount = subtotal.minus(discount)
    const tax = subtotalAfterDiscount.times(taxRate).dividedBy(100)
    const total = subtotalAfterDiscount.plus(tax)

    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        title: validatedData.title,
        description: validatedData.description || null,
        clientId: validatedData.clientId,
        projectId: validatedData.projectId || null,
        createdBy: session.user.id,
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
        },
      },
    })

    return NextResponse.json(quotation, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', issues: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating quotation:', error)
    return NextResponse.json(
      { error: 'Error al crear cotización' },
      { status: 500 }
    )
  }
}
