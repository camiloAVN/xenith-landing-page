import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { conceptSchema } from '@/lib/validations/concept'
import { canViewModule, canEditModule } from '@/lib/auth/check-permission'
import { ZodError } from 'zod'

// GET /api/concepts/[id] - Get single concept
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permissionCheck = await canViewModule('conceptos')
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      )
    }

    const { id } = await params

    const concept = await prisma.concept.findUnique({
      where: { id },
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

    if (!concept) {
      return NextResponse.json(
        { error: 'Concepto no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(concept)
  } catch (error) {
    console.error('Error fetching concept:', error)
    return NextResponse.json(
      { error: 'Error al obtener concepto' },
      { status: 500 }
    )
  }
}

// PUT /api/concepts/[id] - Update concept
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permissionCheck = await canEditModule('conceptos')
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = conceptSchema.parse(body)

    // Verify concept exists
    const existingConcept = await prisma.concept.findUnique({
      where: { id },
    })

    if (!existingConcept) {
      return NextResponse.json(
        { error: 'Concepto no encontrado' },
        { status: 404 }
      )
    }

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

    const concept = await prisma.concept.update({
      where: { id },
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

    return NextResponse.json(concept)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', issues: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating concept:', error)
    return NextResponse.json(
      { error: 'Error al actualizar concepto' },
      { status: 500 }
    )
  }
}

// DELETE /api/concepts/[id] - Delete concept
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permissionCheck = await canEditModule('conceptos')
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      )
    }

    const { id } = await params

    // Verify concept exists
    const existingConcept = await prisma.concept.findUnique({
      where: { id },
    })

    if (!existingConcept) {
      return NextResponse.json(
        { error: 'Concepto no encontrado' },
        { status: 404 }
      )
    }

    await prisma.concept.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Concepto eliminado exitosamente' })
  } catch (error) {
    console.error('Error deleting concept:', error)
    return NextResponse.json(
      { error: 'Error al eliminar concepto' },
      { status: 500 }
    )
  }
}
