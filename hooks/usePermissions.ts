'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { SystemModule, SUPERADMIN_EMAIL } from '@/lib/validations/user'

interface Permission {
  module: string
  canView: boolean
  canEdit: boolean
}

interface UsePermissionsReturn {
  permissions: Permission[]
  isLoading: boolean
  canView: (module: SystemModule) => boolean
  canEdit: (module: SystemModule) => boolean
  isSuperAdmin: boolean
  refetch: () => Promise<void>
}

export function usePermissions(): UsePermissionsReturn {
  const { data: session, status } = useSession()
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const isSuperAdmin = session?.user?.email === SUPERADMIN_EMAIL

  const fetchPermissions = useCallback(async () => {
    if (status === 'loading') return

    if (!session?.user) {
      setPermissions([])
      setIsLoading(false)
      return
    }

    // Superadmin tiene todos los permisos
    if (isSuperAdmin) {
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/profile')

      // Handle unauthorized/forbidden silently (user is logging out)
      if (response.status === 401 || response.status === 403) {
        setPermissions([])
        setIsLoading(false)
        return
      }

      if (response.ok) {
        const data = await response.json()
        setPermissions(data.permissions || [])
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
    } finally {
      setIsLoading(false)
    }
  }, [session, status, isSuperAdmin])

  useEffect(() => {
    fetchPermissions()
  }, [fetchPermissions])

  const canView = useCallback(
    (module: SystemModule): boolean => {
      // Superadmin tiene todos los permisos
      if (isSuperAdmin) return true

      const permission = permissions.find((p) => p.module === module)
      return permission?.canView || false
    },
    [permissions, isSuperAdmin]
  )

  const canEdit = useCallback(
    (module: SystemModule): boolean => {
      // Superadmin tiene todos los permisos
      if (isSuperAdmin) return true

      const permission = permissions.find((p) => p.module === module)
      return permission?.canEdit || false
    },
    [permissions, isSuperAdmin]
  )

  return {
    permissions,
    isLoading: status === 'loading' || isLoading,
    canView,
    canEdit,
    isSuperAdmin,
    refetch: fetchPermissions,
  }
}
