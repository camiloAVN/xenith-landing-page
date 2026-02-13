'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { usePermissions } from '@/hooks/usePermissions'
import { SystemModule } from '@/lib/validations/user'
import { ShieldX } from 'lucide-react'

interface RouteGuardProps {
  children: React.ReactNode
}

// Mapeo de rutas a módulos
const routeToModule: Record<string, SystemModule> = {
  '/dashboard': 'dashboard',
  '/dashboard/proyectos': 'proyectos',
  '/dashboard/clientes': 'clientes',
  '/dashboard/cotizaciones': 'cotizaciones',
  '/dashboard/inventario': 'inventario',
  '/dashboard/inventario/productos': 'productos',
  '/dashboard/inventario/items': 'items',
  '/dashboard/inventario/grupos': 'grupos',
  '/dashboard/inventario/rfid': 'rfid',
  '/dashboard/inventario/movimientos': 'movimientos',
  '/dashboard/terceros/contratistas': 'contratistas',
  '/dashboard/terceros/conceptos': 'conceptos',
  '/dashboard/categorias': 'categorias',
  '/dashboard/historial': 'historial',
}

// Rutas que no requieren permisos específicos (accesibles para todos los usuarios autenticados)
const publicRoutes = ['/dashboard/perfil', '/dashboard/usuarios']

// Determinar el módulo basado en la ruta
function getModuleFromPath(pathname: string): SystemModule | null {
  // Rutas públicas no necesitan verificación de módulo
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return null
  }

  // Buscar coincidencia exacta primero
  if (routeToModule[pathname]) {
    return routeToModule[pathname]
  }

  // Buscar coincidencia por prefijo (para rutas dinámicas como /dashboard/proyectos/[id])
  const sortedRoutes = Object.keys(routeToModule).sort(
    (a, b) => b.length - a.length
  )

  for (const route of sortedRoutes) {
    if (pathname.startsWith(route)) {
      return routeToModule[route]
    }
  }

  return null
}

// Determinar si la ruta requiere permiso de edición
function requiresEditPermission(pathname: string): boolean {
  return (
    pathname.includes('/nuevo') ||
    pathname.includes('/editar') ||
    pathname.endsWith('/edit')
  )
}

export function RouteGuard({ children }: RouteGuardProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { canView, canEdit, isLoading, isSuperAdmin } = usePermissions()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    if (isLoading) {
      setIsAuthorized(null)
      return
    }

    // Superadmin tiene acceso a todo
    if (isSuperAdmin) {
      setIsAuthorized(true)
      return
    }

    const module = getModuleFromPath(pathname)

    // Si no hay módulo asociado (rutas públicas), permitir acceso
    if (module === null) {
      setIsAuthorized(true)
      return
    }

    // Verificar permisos
    const needsEdit = requiresEditPermission(pathname)
    const hasPermission = needsEdit ? canEdit(module) : canView(module)

    setIsAuthorized(hasPermission)

    // Si no tiene permiso y no está cargando, redirigir
    if (!hasPermission) {
      // Pequeño delay para mostrar el mensaje de acceso denegado
      const timer = setTimeout(() => {
        router.push('/dashboard')
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [pathname, isLoading, isSuperAdmin, canView, canEdit, router])

  // Estado de carga
  if (isLoading || isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Sin permiso
  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <ShieldX className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-200 mb-2">
          Acceso Denegado
        </h2>
        <p className="text-gray-400 max-w-md mb-4">
          No tienes permisos para acceder a esta seccion.
          Contacta al administrador si necesitas acceso.
        </p>
        <p className="text-sm text-gray-500">
          Redirigiendo al dashboard...
        </p>
      </div>
    )
  }

  // Tiene permiso, mostrar contenido
  return <>{children}</>
}
