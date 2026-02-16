import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { hash } from 'bcrypt'
import { moduleLabels, updateUserSchema, SUPERADMIN_EMAIL } from '@/lib/validations/user'
import { createAuditLog, getRequestClientInfo } from '@/lib/audit/log'
import { ZodError } from 'zod'

// Helper to check if user is superadmin or admin
async function isAdminOrAbove(session: any): Promise<boolean> {
  if (!session?.user?.id) return false
  if (session.user.email === SUPERADMIN_EMAIL) return true
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })
  return user?.role === 'ADMIN' || user?.role === 'SUPERADMIN'
}

function normalizePermissions(permissions: Array<{ module: string; canView: boolean; canEdit: boolean }>) {
  return permissions
    .map((p) => `${p.module}:${p.canView ? 1 : 0}:${p.canEdit ? 1 : 0}`)
    .sort()
}

function permissionLevel(permission: { canView: boolean; canEdit: boolean } | undefined) {
  if (!permission) return 'sin acceso'
  if (permission.canEdit) return 'editar'
  if (permission.canView) return 'ver'
  return 'sin acceso'
}

function buildPermissionChangesDescription(
  previousPermissions: Array<{ module: string; canView: boolean; canEdit: boolean }>,
  newPermissions: Array<{ module: string; canView: boolean; canEdit: boolean }>
) {
  const previousMap = new Map(
    previousPermissions.map((permission) => [permission.module, permission])
  )
  const newMap = new Map(
    newPermissions.map((permission) => [permission.module, permission])
  )

  const modules = Array.from(new Set([
    ...Array.from(previousMap.keys()),
    ...Array.from(newMap.keys()),
  ])).sort()

  const changes: string[] = []

  for (const module of modules) {
    const previous = previousMap.get(module)
    const next = newMap.get(module)

    const previousLevel = permissionLevel(previous)
    const nextLevel = permissionLevel(next)

    if (previousLevel !== nextLevel) {
      const label = moduleLabels[module as keyof typeof moduleLabels] || module
      changes.push(`${label}: ${previousLevel} -> ${nextLevel}`)
    }
  }

  return changes
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

    if (!await isAdminOrAbove(session)) {
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

    if (!await isAdminOrAbove(session)) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)
    const { ipAddress, userAgent } = getRequestClientInfo(request)

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        permissions: {
          select: {
            module: true,
            canView: true,
            canEdit: true,
          },
        },
      },
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

    const roleChanged =
      validatedData.role !== undefined && validatedData.role !== existingUser.role
    const statusChanged =
      validatedData.isActive !== undefined && validatedData.isActive !== existingUser.isActive
    const permissionsChanged =
      validatedData.permissions !== undefined &&
      JSON.stringify(normalizePermissions(existingUser.permissions)) !==
        JSON.stringify(normalizePermissions(validatedData.permissions))

    if (roleChanged) {
      await createAuditLog({
        module: 'usuarios',
        action: 'USER_ROLE_CHANGED',
        entityType: 'user',
        entityId: user.id,
        description: `Cambio de rol para ${user.email}: ${existingUser.role} -> ${user.role}`,
        metadata: {
          userId: user.id,
          userEmail: user.email,
          previousRole: existingUser.role,
          newRole: user.role,
        },
        performedBy: session.user.id!,
        ipAddress,
        userAgent,
      })
    }

    if (permissionsChanged) {
      const permissionChanges = buildPermissionChangesDescription(
        existingUser.permissions,
        validatedData.permissions || []
      )

      await createAuditLog({
        module: 'usuarios',
        action: 'USER_PERMISSIONS_CHANGED',
        entityType: 'user',
        entityId: user.id,
        description: `Permisos actualizados para ${user.email} (${permissionChanges.length} cambio${permissionChanges.length === 1 ? '' : 's'})`,
        metadata: {
          userId: user.id,
          userEmail: user.email,
          changes: permissionChanges,
          previousPermissions: existingUser.permissions,
          newPermissions: validatedData.permissions,
        },
        performedBy: session.user.id!,
        ipAddress,
        userAgent,
      })
    }

    if (statusChanged) {
      await createAuditLog({
        module: 'usuarios',
        action: 'USER_STATUS_CHANGED',
        entityType: 'user',
        entityId: user.id,
        description: `${user.email} fue ${user.isActive ? 'activado' : 'desactivado'}`,
        metadata: {
          userId: user.id,
          userEmail: user.email,
          previousIsActive: existingUser.isActive,
          newIsActive: user.isActive,
        },
        performedBy: session.user.id!,
        ipAddress,
        userAgent,
      })
    }

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

    if (!await isAdminOrAbove(session)) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const { id } = await params
    const { ipAddress, userAgent } = getRequestClientInfo(request)

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

    await createAuditLog({
      module: 'usuarios',
      action: 'USER_DEACTIVATED',
      entityType: 'user',
      entityId: existingUser.id,
      description: `Usuario desactivado: ${existingUser.email}`,
      metadata: {
        userId: existingUser.id,
        userEmail: existingUser.email,
      },
      performedBy: session.user.id!,
      ipAddress,
      userAgent,
    })

    return NextResponse.json({ message: 'Usuario desactivado exitosamente' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Error al eliminar usuario' },
      { status: 500 }
    )
  }
}
