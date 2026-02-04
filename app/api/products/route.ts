import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { productSchema } from '@/lib/validations/product'
import { ZodError } from 'zod'

// GET /api/products - List all products
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const categoryId = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''
    const includeDeleted = searchParams.get('includeDeleted') === 'true'

    const where: Record<string, unknown> = {}

    // Filter by soft delete
    if (!includeDeleted) {
      where.deletedAt = null
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Category filter
    if (categoryId) {
      where.categoryId = categoryId
    }

    // Status filter
    if (status && (status === 'ACTIVE' || status === 'INACTIVE')) {
      where.status = status
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        _count: {
          select: { inventoryItems: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Error al obtener productos' },
      { status: 500 }
    )
  }
}

// POST /api/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = productSchema.parse(body)

    // Clean empty strings to null
    const data = {
      sku: validatedData.sku,
      name: validatedData.name,
      description: validatedData.description || null,
      categoryId: validatedData.categoryId,
      brand: validatedData.brand || null,
      model: validatedData.model || null,
      status: validatedData.status,
      unitPrice: validatedData.unitPrice ?? null,
      rentalPrice: validatedData.rentalPrice ?? null,
      imageUrl: validatedData.imageUrl || null,
      notes: validatedData.notes || null,
    }

    const product = await prisma.product.create({
      data,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        _count: {
          select: { inventoryItems: true },
        },
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', issues: error.issues },
        { status: 400 }
      )
    }

    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Ya existe un producto con ese SKU' },
        { status: 400 }
      )
    }

    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Error al crear producto' },
      { status: 500 }
    )
  }
}
