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

// GET /api/projects - List all projects with filters
export async function GET(request: NextRequest) {
  try {
    const permissionCheck = await canViewModule('proyectos')
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      )
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const clientId = searchParams.get('clientId')
    const assignedTo = searchParams.get('assignedTo')

    const where: any = {}

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Status filter
    if (status) {
      where.status = status
    }

    // Priority filter
    if (priority) {
      where.priority = priority
    }

    // Client filter
    if (clientId) {
      where.clientId = clientId
    }

    // Assigned user filter
    if (assignedTo) {
      where.assignedTo = assignedTo
    }

    const projects = await prisma.project.findMany({
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
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            completed: true,
            dueDate: true,
            assignedUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Error al obtener proyectos' },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const permissionCheck = await canEditModule('proyectos')
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: permissionCheck.status }
      )
    }

    const body = await request.json()
    const validatedData = projectSchema.parse(body)

    // Convert budget string to Decimal if provided
    const budget = validatedData.budget ? new Decimal(validatedData.budget) : null

    const tasks = validatedData.tasks || []

    const project = await prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
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
            projectId: created.id,
            title: task.title,
            description: task.description || null,
            assignedTo: task.assignedTo || null,
            dueDate: task.dueDate ? new Date(task.dueDate) : null,
            priority: task.priority,
          })),
        })
      }

      return tx.project.findUnique({
        where: { id: created.id },
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
        // Group tasks by userId
        const tasksByUser = new Map<string, typeof assignedTasks>()
        for (const task of assignedTasks) {
          const userId = task.assignedTo!
          if (!tasksByUser.has(userId)) tasksByUser.set(userId, [])
          tasksByUser.get(userId)!.push(task)
        }

        // Fetch user info and send emails
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

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Datos invalidos', issues: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Error al crear proyecto' },
      { status: 500 }
    )
  }
}
