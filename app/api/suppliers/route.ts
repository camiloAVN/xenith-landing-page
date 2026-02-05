import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { supplierSchema } from '@/lib/validations/supplier'
import { canViewModule, canEditModule } from '@/lib/auth/check-permission'
import { ZodError } from 'zod'

// GET /api/suppliers - List all suppliers
export async function GET(request: NextRequest) {
  try {
    const permissionCheck = await canViewModule('contratistas')
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const suppliers = await prisma.supplier.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { contactName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {},
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(suppliers)
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json(
      { error: 'Error al obtener contratistas' },
      { status: 500 }
    )
  }
}

// POST /api/suppliers - Create new supplier
export async function POST(request: NextRequest) {
  try {
    const permissionCheck = await canEditModule('contratistas')
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      )
    }

    const body = await request.json()
    const validatedData = supplierSchema.parse(body)

    // Clean empty strings to null
    const data = {
      name: validatedData.name,
      contactName: validatedData.contactName || null,
      email: validatedData.email || null,
      phone: validatedData.phone || null,
      address: validatedData.address || null,
      city: validatedData.city || null,
      country: validatedData.country || null,
      website: validatedData.website || null,
      notes: validatedData.notes || null,
    }

    const supplier = await prisma.supplier.create({
      data,
      include: {
        _count: {
          select: { products: true },
        },
      },
    })

    return NextResponse.json(supplier, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Datos invalidos', issues: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating supplier:', error)
    return NextResponse.json(
      { error: 'Error al crear contratista' },
      { status: 500 }
    )
  }
}
