import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { projectSchema } from '@/lib/validations/project'
import { canViewModule, canEditModule } from '@/lib/auth/check-permission'
import { ZodError } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'
import { Resend } from 'resend'
import { render } from '@react-email/components'
import { TaskNotificationTemplate } from '@/components/email/task-notification-template'

const resend = new Resend(process.env.RESEND_API_KEY)

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

    // Fire-and-forget: send notification emails
    if (validatedData.notifyUsers && tasks.length > 0) {
      const assignedTasks = tasks.filter((t) => t.assignedTo)
      if (assignedTasks.length > 0) {
        const tasksByUser = new Map<string, typeof assignedTasks>()
        for (const task of assignedTasks) {
          const userId = task.assignedTo!
          if (!tasksByUser.has(userId)) tasksByUser.set(userId, [])
          tasksByUser.get(userId)!.push(task)
        }

        const userIds = Array.from(tasksByUser.keys())
        prisma.user
          .findMany({
            where: { id: { in: userIds }, isActive: true },
            select: { id: true, name: true, email: true },
          })
          .then(async (users) => {
            for (const user of users) {
              const userTasks = tasksByUser.get(user.id) || []
              const html = await render(
                TaskNotificationTemplate({
                  userName: user.name || user.email,
                  projectTitle: validatedData.title,
                  tasks: userTasks.map((t) => ({
                    title: t.title,
                    description: t.description,
                    priority: t.priority,
                    dueDate: t.dueDate || null,
                  })),
                })
              )
              await resend.emails.send({
                from: 'XENITH <onboarding@resend.dev>',
                to: [user.email],
                subject: `Tareas asignadas - ${validatedData.title}`,
                html,
              })
            }
            console.info(`[TASK-NOTIFY] Emails sent to ${users.length} user(s) for project "${validatedData.title}"`)
          })
          .catch((err) => console.error('[TASK-NOTIFY] Error sending emails:', err))
      }
    }

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
