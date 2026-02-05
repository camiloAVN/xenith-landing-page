import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { itemGroupSchema } from '@/lib/validations/itemGroup'
import { canViewModule, canEditModule } from '@/lib/auth/check-permission'
import { ZodError } from 'zod'

// GET /api/item-groups/[id] - Get a single item group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permissionCheck = await canViewModule('grupos')
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      )
    }

    const { id } = await params

    const group = await prisma.itemGroup.findUnique({
      where: { id },
      include: {
        items: {
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
                    rentalPrice: true,
                    category: {
                      select: {
                        id: true,
                        name: true,
                        color: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Grupo no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(group)
  } catch (error) {
    console.error('Error fetching item group:', error)
    return NextResponse.json(
      { error: 'Error al obtener grupo' },
      { status: 500 }
    )
  }
}

// PUT /api/item-groups/[id] - Update an item group
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permissionCheck = await canEditModule('grupos')
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = itemGroupSchema.parse(body)

    // Verify group exists
    const existingGroup = await prisma.itemGroup.findUnique({
      where: { id },
    })

    if (!existingGroup) {
      return NextResponse.json(
        { error: 'Grupo no encontrado' },
        { status: 404 }
      )
    }

    const group = await prisma.itemGroup.update({
      where: { id },
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
      },
      include: {
        items: {
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
                    rentalPrice: true,
                    category: {
                      select: {
                        id: true,
                        name: true,
                        color: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
    })

    return NextResponse.json(group)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', issues: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating item group:', error)
    return NextResponse.json(
      { error: 'Error al actualizar grupo' },
      { status: 500 }
    )
  }
}

// DELETE /api/item-groups/[id] - Delete an item group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permissionCheck = await canEditModule('grupos')
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      )
    }

    const { id } = await params

    // Verify group exists
    const existingGroup = await prisma.itemGroup.findUnique({
      where: { id },
    })

    if (!existingGroup) {
      return NextResponse.json(
        { error: 'Grupo no encontrado' },
        { status: 404 }
      )
    }

    await prisma.itemGroup.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Grupo eliminado exitosamente' })
  } catch (error) {
    console.error('Error deleting item group:', error)
    return NextResponse.json(
      { error: 'Error al eliminar grupo' },
      { status: 500 }
    )
  }
}
