'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePermissions } from '@/hooks/usePermissions'
import { SystemModule } from '@/lib/validations/user'
import { ShieldX } from 'lucide-react'

interface PermissionGateProps {
  children: React.ReactNode
  module: SystemModule
  requireEdit?: boolean
  fallback?: React.ReactNode
}

export function PermissionGate({
  children,
  module,
  requireEdit = false,
  fallback,
}: PermissionGateProps) {
  const router = useRouter()
  const { canView, canEdit, isLoading, isSuperAdmin } = usePermissions()

  const hasPermission = requireEdit ? canEdit(module) : canView(module)

  useEffect(() => {
    if (!isLoading && !hasPermission && !isSuperAdmin) {
      // Redirigir al dashboard si no tiene permiso
      router.push('/dashboard')
    }
  }, [isLoading, hasPermission, isSuperAdmin, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!hasPermission && !isSuperAdmin) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <ShieldX className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-200 mb-2">
          Acceso Denegado
        </h2>
        <p className="text-gray-400 max-w-md">
          No tienes permisos para acceder a esta seccion.
          Contacta al administrador si necesitas acceso.
        </p>
      </div>
    )
  }

  return <>{children}</>
}

// Hook para verificar permisos de edición en botones/acciones
export function useCanEdit(module: SystemModule): boolean {
  const { canEdit, isSuperAdmin } = usePermissions()
  return isSuperAdmin || canEdit(module)
}
