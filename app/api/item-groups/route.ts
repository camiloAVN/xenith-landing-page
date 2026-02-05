import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { itemGroupSchema } from '@/lib/validations/itemGroup'
import { canViewModule, canEditModule } from '@/lib/auth/check-permission'
import { ZodError } from 'zod'

// GET /api/item-groups - List all item groups
export async function GET(request: NextRequest) {
  try {
    const permissionCheck = await canViewModule('grupos')
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const groups = await prisma.itemGroup.findMany({
      where,
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
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(groups)
  } catch (error) {
    console.error('Error fetching item groups:', error)
    return NextResponse.json(
      { error: 'Error al obtener grupos' },
      { status: 500 }
    )
  }
}

// POST /api/item-groups - Create new item group
export async function POST(request: NextRequest) {
  try {
    const permissionCheck = await canEditModule('grupos')
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      )
    }

    const body = await request.json()
    const validatedData = itemGroupSchema.parse(body)

    const group = await prisma.itemGroup.create({
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
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
    })

    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', issues: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating item group:', error)
    return NextResponse.json(
      { error: 'Error al crear grupo' },
      { status: 500 }
    )
  }
}
