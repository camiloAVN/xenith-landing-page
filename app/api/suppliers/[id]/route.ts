import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { supplierSchema } from '@/lib/validations/supplier'
import { canViewModule, canEditModule } from '@/lib/auth/check-permission'
import { ZodError } from 'zod'

// GET /api/suppliers/[id] - Get single supplier
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permissionCheck = await canViewModule('contratistas')
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      )
    }

    const { id } = await params

    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
        products: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                brand: true,
              },
            },
          },
          take: 10,
        },
      },
    })

    if (!supplier) {
      return NextResponse.json(
        { error: 'Contratista no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(supplier)
  } catch (error) {
    console.error('Error fetching supplier:', error)
    return NextResponse.json(
      { error: 'Error al obtener contratista' },
      { status: 500 }
    )
  }
}

// PUT /api/suppliers/[id] - Update supplier
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permissionCheck = await canEditModule('contratistas')
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      )
    }

    const { id } = await params
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

    const supplier = await prisma.supplier.update({
      where: { id },
      data,
      include: {
        _count: {
          select: { products: true },
        },
      },
    })

    return NextResponse.json(supplier)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Datos invalidos', issues: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating supplier:', error)
    return NextResponse.json(
      { error: 'Error al actualizar contratista' },
      { status: 500 }
    )
  }
}

// DELETE /api/suppliers/[id] - Delete supplier
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permissionCheck = await canEditModule('contratistas')
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      )
    }

    const { id } = await params

    // Check if supplier has associated products
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    })

    if (!supplier) {
      return NextResponse.json(
        { error: 'Contratista no encontrado' },
        { status: 404 }
      )
    }

    if (supplier._count.products > 0) {
      return NextResponse.json(
        {
          error:
            'No se puede eliminar el contratista porque tiene productos asociados',
        },
        { status: 400 }
      )
    }

    await prisma.supplier.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting supplier:', error)
    return NextResponse.json(
      { error: 'Error al eliminar contratista' },
      { status: 500 }
    )
  }
}
