import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { projectSchema } from '@/lib/validations/project'
import { canViewModule, canEditModule } from '@/lib/auth/check-permission'
import { ZodError } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

// GET /api/projects/[id] - Get single project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permissionCheck = await canViewModule('proyectos')
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      )
    }

    const { id } = await params

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true,
            email: true,
            phone: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tasks: {
          include: {
            assignedUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        quotations: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Error al obtener proyecto' },
      { status: 500 }
    )
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permissionCheck = await canEditModule('proyectos')
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = projectSchema.parse(body)

    // Convert budget string to Decimal if provided
    const budget = validatedData.budget ? new Decimal(validatedData.budget) : null

    const tasks = validatedData.tasks || []

    const project = await prisma.$transaction(async (tx) => {
      // Delete existing tasks and recreate
      await tx.task.deleteMany({
        where: { projectId: id },
      })

      await tx.project.update({
        where: { id },
        data: {
          title: validatedData.title,
          description: validatedData.description,
          status: validatedData.status,
          clientId: validatedData.clientId,
          assignedTo: validatedData.assignedTo,
          priority: validatedData.priority,
          startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
          endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
          budget,
          tags: validatedData.tags || [],
          notes: validatedData.notes || null,
        },
      })

      if (tasks.length > 0) {
        await tx.task.createMany({
          data: tasks.map((task) => ({
            projectId: id,
            title: task.title,
            description: task.description || null,
            assignedTo: task.assignedTo || null,
            dueDate: task.dueDate ? new Date(task.dueDate) : null,
            priority: task.priority,
          })),
        })
      }

      return tx.project.findUnique({
        where: { id },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              company: true,
              email: true,
            },
          },
          assignedUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          tasks: true,
        },
      })
    })

    return NextResponse.json(project)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Datos invalidos', issues: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: 'Error al actualizar proyecto' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const permissionCheck = await canEditModule('proyectos')
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      )
    }

    const { id } = await params

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        _count: {
          select: { tasks: true, quotations: true },
        },
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      )
    }

    // Delete project (tasks and quotations will cascade)
    await prisma.project.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: 'Error al eliminar proyecto' },
      { status: 500 }
    )
  }
}
