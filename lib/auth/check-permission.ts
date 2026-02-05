import { auth } from '@/auth'
import { prisma } from '@/lib/db/prisma'
import { SUPERADMIN_EMAIL, SystemModule } from '@/lib/validations/user'

interface PermissionCheck {
  hasPermission: boolean
  userId?: string
  error?: string
  status?: number
}

/**
 * Verifica si el usuario actual tiene permiso para ver un módulo
 */
export async function canViewModule(module: SystemModule): Promise<PermissionCheck> {
  const session = await auth()

  if (!session?.user?.id) {
    return { hasPermission: false, error: 'No autorizado', status: 401 }
  }

  // Superadmin tiene todos los permisos
  if (session.user.email === SUPERADMIN_EMAIL) {
    return { hasPermission: true, userId: session.user.id }
  }

  // Verificar permiso en la base de datos
  const permission = await prisma.userPermission.findUnique({
    where: {
      userId_module: {
        userId: session.user.id,
        module: module,
      },
    },
  })

  if (!permission?.canView) {
    return { hasPermission: false, error: 'No tienes permiso para ver este recurso', status: 403 }
  }

  return { hasPermission: true, userId: session.user.id }
}

/**
 * Verifica si el usuario actual tiene permiso para editar un módulo
 */
export async function canEditModule(module: SystemModule): Promise<PermissionCheck> {
  const session = await auth()

  if (!session?.user?.id) {
    return { hasPermission: false, error: 'No autorizado', status: 401 }
  }

  // Superadmin tiene todos los permisos
  if (session.user.email === SUPERADMIN_EMAIL) {
    return { hasPermission: true, userId: session.user.id }
  }

  // Verificar permiso en la base de datos
  const permission = await prisma.userPermission.findUnique({
    where: {
      userId_module: {
        userId: session.user.id,
        module: module,
      },
    },
  })

  if (!permission?.canEdit) {
    return { hasPermission: false, error: 'No tienes permiso para editar este recurso', status: 403 }
  }

  return { hasPermission: true, userId: session.user.id }
}

/**
 * Verifica autenticación básica (solo si está logueado)
 */
export async function checkAuth(): Promise<PermissionCheck> {
  const session = await auth()

  if (!session?.user?.id) {
    return { hasPermission: false, error: 'No autorizado', status: 401 }
  }

  return { hasPermission: true, userId: session.user.id }
}

/**
 * Verifica si es superadmin
 */
export async function isSuperAdmin(): Promise<boolean> {
  const session = await auth()
  return session?.user?.email === SUPERADMIN_EMAIL
}
