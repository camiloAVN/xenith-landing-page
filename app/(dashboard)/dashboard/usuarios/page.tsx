'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Table } from '@/components/ui/Table'
import {
  Plus,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  X,
  Eye,
  Pencil,
  Briefcase,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import {
  User,
  UserRole,
  Permission,
  SystemModule,
  roleLabels,
  roleColors,
  systemModules,
  moduleLabels,
  moduleGroups,
  moduleGroupLabels,
  SUPERADMIN_EMAIL,
} from '@/lib/validations/user'
import { cn } from '@/lib/utils/cn'

type PermissionMap = Record<SystemModule, { canView: boolean; canEdit: boolean }>

const getDefaultPermissions = (): PermissionMap => {
  const permissions: Partial<PermissionMap> = {}
  systemModules.forEach((module) => {
    permissions[module] = { canView: false, canEdit: false }
  })
  return permissions as PermissionMap
}

export default function UsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER' as UserRole,
    position: '',
  })
  const [permissions, setPermissions] = useState<PermissionMap>(getDefaultPermissions())
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check if current user is superadmin
  const isSuperAdmin = session?.user?.email === SUPERADMIN_EMAIL
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user) {
      router.push('/dashboard')
      return
    }

    // Superadmin always has access
    if (session.user.email === SUPERADMIN_EMAIL) {
      setHasAccess(true)
      fetchUsers()
      return
    }

    // Check role from profile
    fetch('/api/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.role === 'ADMIN') {
          setHasAccess(true)
          fetchUsers()
        } else {
          router.push('/dashboard')
        }
      })
      .catch(() => router.push('/dashboard'))
  }, [session, status, router])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/users')

      if (!response.ok) {
        if (response.status === 403) {
          router.push('/dashboard')
          return
        }
        throw new Error('Error al cargar usuarios')
      }

      const data = await response.json()
      setUsers(data)
    } catch (error) {
      toast.error('Error al cargar usuarios')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = editingUser
        ? `/api/users/${editingUser.id}`
        : '/api/users'

      const method = editingUser ? 'PUT' : 'POST'

      // Convertir permisos a array
      const permissionsArray: Permission[] = Object.entries(permissions)
        .filter(([_, p]) => p.canView || p.canEdit)
        .map(([module, p]) => ({
          module: module as SystemModule,
          canView: p.canView,
          canEdit: p.canEdit,
        }))

      const body = editingUser
        ? {
            name: formData.name,
            email: formData.email,
            role: formData.role,
            position: formData.position || null,
            permissions: permissionsArray,
            ...(formData.password && { password: formData.password }),
          }
        : {
            ...formData,
            position: formData.position || null,
            permissions: permissionsArray,
          }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al guardar usuario')
      }

      toast.success(
        editingUser ? 'Usuario actualizado' : 'Usuario creado exitosamente'
      )
      setShowModal(false)
      resetForm()
      fetchUsers()
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar usuario')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (user: User) => {
    if (!confirm(`¿Deseas desactivar al usuario ${user.name || user.email}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al desactivar usuario')
      }

      toast.success('Usuario desactivado')
      fetchUsers()
    } catch (error: any) {
      toast.error(error.message || 'Error al desactivar usuario')
    }
  }

  const handleToggleActive = async (user: User) => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      })

      if (!response.ok) {
        throw new Error('Error al actualizar usuario')
      }

      toast.success(user.isActive ? 'Usuario desactivado' : 'Usuario activado')
      fetchUsers()
    } catch (error) {
      toast.error('Error al actualizar usuario')
    }
  }

  const openEditModal = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name || '',
      email: user.email,
      password: '',
      role: user.role,
      position: user.position || '',
    })

    // Cargar permisos del usuario
    const userPermissions = getDefaultPermissions()
    if (user.permissions) {
      user.permissions.forEach((p) => {
        if (userPermissions[p.module as SystemModule]) {
          userPermissions[p.module as SystemModule] = {
            canView: p.canView,
            canEdit: p.canEdit,
          }
        }
      })
    }
    setPermissions(userPermissions)
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'USER',
      position: '',
    })
    setPermissions(getDefaultPermissions())
    setEditingUser(null)
  }

  const handlePermissionChange = (
    module: SystemModule,
    type: 'canView' | 'canEdit',
    value: boolean
  ) => {
    setPermissions((prev) => {
      const updated = { ...prev }
      updated[module] = { ...updated[module], [type]: value }

      // Si se activa canEdit, también activar canView
      if (type === 'canEdit' && value) {
        updated[module].canView = true
      }

      // Si se desactiva canView, también desactivar canEdit
      if (type === 'canView' && !value) {
        updated[module].canEdit = false
      }

      return updated
    })
  }

  const handleSelectAllGroup = (group: keyof typeof moduleGroups, type: 'canView' | 'canEdit', value: boolean) => {
    setPermissions((prev) => {
      const updated = { ...prev }
      moduleGroups[group].forEach((module) => {
        updated[module as SystemModule] = { ...updated[module as SystemModule], [type]: value }

        if (type === 'canEdit' && value) {
          updated[module as SystemModule].canView = true
        }
        if (type === 'canView' && !value) {
          updated[module as SystemModule].canEdit = false
        }
      })
      return updated
    })
  }

  const roleOptions = [
    { value: 'USER', label: 'Usuario' },
    { value: 'ADMIN', label: 'Administrador' },
  ]

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!hasAccess) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Usuarios</h1>
          <p className="text-gray-400 mt-1">
            Gestiona los usuarios del sistema y sus permisos
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      <Card>
        <Card.Content>
          {users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No hay usuarios registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>Cargo</th>
                    <th>Rol</th>
                    <th>Permisos</th>
                    <th>Estado</th>
                    <th>Creado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="font-medium">
                        <div className="flex items-center gap-2">
                          {user.email === SUPERADMIN_EMAIL && (
                            <Shield className="w-4 h-4 text-red-400" />
                          )}
                          {user.name || 'Sin nombre'}
                        </div>
                      </td>
                      <td className="text-gray-400">{user.email}</td>
                      <td className="text-gray-400">
                        {user.position ? (
                          <span className="inline-flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            {user.position}
                          </span>
                        ) : (
                          <span className="text-gray-600">-</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            roleColors[user.role]
                          }`}
                        >
                          {roleLabels[user.role]}
                        </span>
                      </td>
                      <td>
                        {user.email === SUPERADMIN_EMAIL ? (
                          <span className="text-gray-500 text-sm">Todos</span>
                        ) : user.permissions && user.permissions.length > 0 ? (
                          <span className="text-gray-400 text-sm">
                            {user.permissions.filter(p => p.canView).length} modulos
                          </span>
                        ) : (
                          <span className="text-gray-600 text-sm">Sin permisos</span>
                        )}
                      </td>
                      <td>
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1 text-green-400">
                            <UserCheck className="w-4 h-4" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-gray-500">
                            <UserX className="w-4 h-4" />
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="text-gray-400">
                        {format(new Date(user.createdAt), 'dd MMM yyyy', {
                          locale: es,
                        })}
                      </td>
                      <td>
                        {user.email !== SUPERADMIN_EMAIL && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(user)}
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(user)}
                              title={user.isActive ? 'Desactivar' : 'Activar'}
                            >
                              {user.isActive ? (
                                <UserX className="w-4 h-4 text-amber-400" />
                              ) : (
                                <UserCheck className="w-4 h-4 text-green-400" />
                              )}
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold">
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Informacion basica */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-orange-400" />
                  Informacion del Usuario
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nombre *"
                    placeholder="Juan Perez"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />

                  <Input
                    label="Email *"
                    type="email"
                    placeholder="juan@ejemplo.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />

                  <Input
                    label={editingUser ? 'Nueva Contrasena (opcional)' : 'Contrasena *'}
                    type="password"
                    placeholder="********"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required={!editingUser}
                    helperText="Minimo 8 caracteres, mayuscula, minuscula y numero"
                  />

                  <Input
                    label="Cargo"
                    placeholder="Ej: Coordinador de Audio"
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({ ...formData, position: e.target.value })
                    }
                    leftIcon={<Briefcase className="w-4 h-4" />}
                  />

                  <Select
                    label="Rol *"
                    options={roleOptions}
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value as UserRole })
                    }
                  />
                </div>
              </div>

              {/* Permisos */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-orange-400" />
                  Permisos por Modulo
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Selecciona los modulos que este usuario puede ver y/o editar
                </p>

                <div className="space-y-6">
                  {(Object.keys(moduleGroups) as Array<keyof typeof moduleGroups>).map((groupKey) => (
                    <div key={groupKey} className="border border-gray-800 rounded-lg overflow-hidden">
                      <div className="bg-gray-800/50 px-4 py-3 flex items-center justify-between">
                        <h4 className="font-medium text-gray-200">
                          {moduleGroupLabels[groupKey]}
                        </h4>
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => handleSelectAllGroup(groupKey, 'canView', true)}
                            className="text-xs text-orange-400 hover:text-orange-300"
                          >
                            Ver todos
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectAllGroup(groupKey, 'canEdit', true)}
                            className="text-xs text-emerald-400 hover:text-emerald-300"
                          >
                            Editar todos
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleSelectAllGroup(groupKey, 'canView', false)
                            }}
                            className="text-xs text-gray-400 hover:text-gray-300"
                          >
                            Quitar todos
                          </button>
                        </div>
                      </div>
                      <div className="divide-y divide-gray-800">
                        {moduleGroups[groupKey].map((module) => (
                          <div
                            key={module}
                            className="px-4 py-3 flex items-center justify-between hover:bg-gray-800/30"
                          >
                            <span className="text-gray-300">
                              {moduleLabels[module as SystemModule]}
                            </span>
                            <div className="flex items-center gap-6">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={permissions[module as SystemModule]?.canView || false}
                                  onChange={(e) =>
                                    handlePermissionChange(
                                      module as SystemModule,
                                      'canView',
                                      e.target.checked
                                    )
                                  }
                                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-orange-500 focus:ring-orange-500 focus:ring-offset-gray-900"
                                />
                                <span className="text-sm text-gray-400 flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  Ver
                                </span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={permissions[module as SystemModule]?.canEdit || false}
                                  onChange={(e) =>
                                    handlePermissionChange(
                                      module as SystemModule,
                                      'canEdit',
                                      e.target.checked
                                    )
                                  }
                                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-gray-900"
                                />
                                <span className="text-sm text-gray-400 flex items-center gap-1">
                                  <Pencil className="w-3 h-3" />
                                  Editar
                                </span>
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                >
                  {editingUser ? 'Actualizar' : 'Crear Usuario'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
