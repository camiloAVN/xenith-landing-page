'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Table } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Search, RotateCw } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

type AuditLog = {
  id: string
  module: string
  action: string
  description: string
  entityType: string
  entityId: string | null
  ipAddress: string | null
  createdAt: string
  metadata?: {
    userEmail?: string
    changes?: string[]
  } | null
  user: {
    id: string
    name: string | null
    email: string
  }
}

const actionOptions = [
  { value: '', label: 'Todas las acciones' },
  { value: 'USER_CREATED', label: 'Usuario creado' },
  { value: 'USER_ROLE_CHANGED', label: 'Rol cambiado' },
  { value: 'USER_PERMISSIONS_CHANGED', label: 'Permisos cambiados' },
  { value: 'USER_STATUS_CHANGED', label: 'Estado cambiado' },
  { value: 'USER_DEACTIVATED', label: 'Usuario desactivado' },
]

const moduleLabels: Record<string, string> = {
  usuarios: 'Usuarios',
}

const actionLabels: Record<string, string> = {
  USER_CREATED: 'Usuario creado',
  USER_ROLE_CHANGED: 'Rol cambiado',
  USER_PERMISSIONS_CHANGED: 'Permisos cambiados',
  USER_STATUS_CHANGED: 'Estado cambiado',
  USER_DEACTIVATED: 'Usuario desactivado',
}

export default function HistorialPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [action, setAction] = useState('')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const fetchLogs = useCallback(async (searchValue: string, actionValue: string) => {
    setIsLoading(true)
    try {
      const url = new URL('/api/audit', window.location.origin)
      if (searchValue) {
        url.searchParams.set('search', searchValue)
      }
      if (actionValue) {
        url.searchParams.set('action', actionValue)
      }
      url.searchParams.set('limit', '150')

      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error('No se pudo cargar el historial')
      }

      const data = await response.json()
      setLogs(data)
    } catch (error) {
      toast.error('Error al cargar el historial')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs(query, action)
  }, [fetchLogs, query, action])

  const rows = useMemo(() => logs, [logs])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Historial</h1>
        <p className="text-gray-400 mt-1">
          Registro de acciones administrativas criticas
        </p>
      </div>

      <Card>
        <Card.Header>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                setQuery(search.trim())
              }}
              className="md:col-span-2"
            >
              <Input
                placeholder="Buscar por descripcion, usuario o accion..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </form>
            <div className="flex gap-2">
              <Select
                options={actionOptions}
                value={action}
                onChange={(e) => setAction(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={() => fetchLogs(query, action)}
                title="Actualizar"
              >
                <RotateCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card.Header>

        <Card.Content>
          {isLoading ? (
            <div className="text-center py-10">
              <div className="inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 mt-3">Cargando historial...</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              No hay eventos para mostrar
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Usuario</th>
                    <th>Modulo</th>
                    <th>Accion</th>
                    <th>Descripcion</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((log) => (
                    <tr key={log.id}>
                      <td className="whitespace-nowrap">
                        {format(new Date(log.createdAt), 'dd MMM yyyy HH:mm', { locale: es })}
                      </td>
                      <td className="whitespace-nowrap">
                        <div className="text-gray-200">{log.user.name || 'Sin nombre'}</div>
                        <div className="text-xs text-gray-500">{log.user.email}</div>
                      </td>
                      <td>{moduleLabels[log.module] || log.module}</td>
                      <td>{actionLabels[log.action] || log.action}</td>
                      <td className="max-w-md">
                        <p className="truncate" title={log.description}>
                          {log.description}
                        </p>
                        {log.action === 'USER_PERMISSIONS_CHANGED' &&
                          Array.isArray(log.metadata?.changes) &&
                          log.metadata.changes.length > 0 && (
                            <button
                              type="button"
                              className="mt-1 text-xs text-orange-400 hover:text-orange-300"
                              onClick={() => setSelectedLog(log)}
                            >
                              Ver detalle
                            </button>
                          )}
                      </td>
                      <td className="text-gray-400">{log.ipAddress || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Content>
      </Card>

      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Detalle de cambio de permisos"
        size="lg"
      >
        {!selectedLog ? null : (
          <div className="space-y-4">
            <div className="text-sm text-gray-300">
              <p>
                <span className="text-gray-500">Usuario:</span>{' '}
                {selectedLog.metadata?.userEmail || selectedLog.user.email}
              </p>
              <p>
                <span className="text-gray-500">Fecha:</span>{' '}
                {format(new Date(selectedLog.createdAt), 'dd MMM yyyy HH:mm:ss', { locale: es })}
              </p>
            </div>

            <div className="border border-gray-800 rounded-lg divide-y divide-gray-800">
              {(selectedLog.metadata?.changes || []).map((change, index) => (
                <div key={`${selectedLog.id}-${index}`} className="px-4 py-3 text-sm text-gray-200">
                  {change}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
