import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { conceptSchema } from '@/lib/validations/concept'
import { canViewModule, canEditModule } from '@/lib/auth/check-permission'
import { ZodError } from 'zod'

// GET /api/concepts - List all concepts
export async function GET(request: NextRequest) {
  try {
    const permissionCheck = await canViewModule('conceptos')
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const supplierId = searchParams.get('supplierId') || ''
    const isActive = searchParams.get('isActive') || ''

    const where: Record<string, unknown> = {}

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    // Category filter
    if (category) {
      where.category = category
    }

    // Supplier filter
    if (supplierId) {
      where.supplierId = supplierId
    }

    // Active filter
    if (isActive === 'true') {
      where.isActive = true
    } else if (isActive === 'false') {
      where.isActive = false
    }

    const concepts = await prisma.concept.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            contactName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(concepts)
  } catch (error) {
    console.error('Error fetching concepts:', error)
    return NextResponse.json(
      { error: 'Error al obtener conceptos' },
      { status: 500 }
    )
  }
}

// POST /api/concepts - Create new concept
export async function POST(request: NextRequest) {
  try {
    const permissionCheck = await canEditModule('conceptos')
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      )
    }

    const body = await request.json()
    const validatedData = conceptSchema.parse(body)

    // Verify supplier exists if provided
    if (validatedData.supplierId) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: validatedData.supplierId },
      })
      if (!supplier) {
        return NextResponse.json(
          { error: 'Contratista no encontrado' },
          { status: 404 }
        )
      }
    }

    const concept = await prisma.concept.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        supplierId: validatedData.supplierId || null,
        unitPrice: validatedData.unitPrice ?? null,
        category: validatedData.category || null,
        notes: validatedData.notes || null,
        isActive: validatedData.isActive ?? true,
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            contactName: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    return NextResponse.json(concept, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', issues: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating concept:', error)
    return NextResponse.json(
      { error: 'Error al crear concepto' },
      { status: 500 }
    )
  }
}
