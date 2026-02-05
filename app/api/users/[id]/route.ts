import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { hash } from 'bcrypt'
import { updateUserSchema, SUPERADMIN_EMAIL } from '@/lib/validations/user'
import { ZodError } from 'zod'

// Helper to check if user is superadmin
async function isSuperAdmin(session: any): Promise<boolean> {
  if (!session?.user?.email) return false
  return session.user.email === SUPERADMIN_EMAIL
}

// GET /api/users/[id] - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!await isSuperAdmin(session)) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        position: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        permissions: {
          select: {
            id: true,
            module: true,
            canView: true,
            canEdit: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Error al obtener usuario' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!await isSuperAdmin(session)) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // No permitir modificar al superadmin
    if (existingUser.email === SUPERADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'No se puede modificar al superadmin' },
        { status: 400 }
      )
    }

    // No permitir cambiar rol a SUPERADMIN
    if (validatedData.role === 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'No se puede asignar rol de superadmin' },
        { status: 400 }
      )
    }

    // Si se actualiza email, verificar que no exista
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email.toLowerCase() },
      })
      if (emailExists) {
        return NextResponse.json(
          { error: 'Ya existe un usuario con este email' },
          { status: 400 }
        )
      }
    }

    // Preparar datos para actualizar
    const updateData: any = {
      ...(validatedData.name && { name: validatedData.name }),
      ...(validatedData.email && { email: validatedData.email.toLowerCase() }),
      ...(validatedData.role && { role: validatedData.role }),
      ...(validatedData.position !== undefined && { position: validatedData.position }),
      ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
    }

    // Si se actualiza password, hash it
    if (validatedData.password) {
      updateData.password = await hash(validatedData.password, 12)
    }

    // Si se proporcionan permisos, actualizar usando transacción
    if (validatedData.permissions) {
      await prisma.$transaction(async (tx) => {
        // Eliminar permisos existentes
        await tx.userPermission.deleteMany({
          where: { userId: id },
        })

        // Crear nuevos permisos
        if (validatedData.permissions && validatedData.permissions.length > 0) {
          await tx.userPermission.createMany({
            data: validatedData.permissions.map((p) => ({
              userId: id,
              module: p.module,
              canView: p.canView,
              canEdit: p.canEdit,
            })),
          })
        }
      })
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        position: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        permissions: {
          select: {
            id: true,
            module: true,
            canView: true,
            canEdit: true,
          },
        },
      },
    })

    console.info(`[ADMIN] User updated: ${user.email} by ${session.user.email}`)

    return NextResponse.json(user)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Datos invalidos', issues: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!await isSuperAdmin(session)) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const { id } = await params

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // No permitir eliminar al superadmin
    if (existingUser.email === SUPERADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'No se puede eliminar al superadmin' },
        { status: 400 }
      )
    }

    // En lugar de eliminar, desactivar el usuario
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    })

    console.info(`[ADMIN] User deactivated: ${existingUser.email} by ${session.user.email}`)

    return NextResponse.json({ message: 'Usuario desactivado exitosamente' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Error al eliminar usuario' },
      { status: 500 }
    )
  }
}
