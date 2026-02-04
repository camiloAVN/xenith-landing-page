'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useRfidTags } from '@/hooks/useRfidTags'
import { useInventory } from '@/hooks/useInventory'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Table } from '@/components/ui/Table'
import { Input } from '@/components/ui/Input'
import {
  ArrowLeft,
  Radio,
  Link as LinkIcon,
  Unlink,
  Package,
  Clock,
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  Search,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const statusConfig = {
  ENROLLED: { label: 'Vinculado', className: 'bg-green-500/10 text-green-400' },
  UNASSIGNED: { label: 'Sin Vincular', className: 'bg-amber-500/10 text-amber-400' },
  UNKNOWN: { label: 'Desconocido', className: 'bg-red-500/10 text-red-400' },
}

interface Detection {
  id: string
  readerId: string
  readerName: string | null
  rssi: number | null
  direction: string | null
  timestamp: Date | string
}

export default function RfidTagDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { currentTag: tag, isLoading, fetchTag, enrollTag, unenrollTag } = useRfidTags()
  const { items, fetchItems } = useInventory()
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [enrollSearch, setEnrollSearch] = useState('')
  const [isEnrolling, setIsEnrolling] = useState(false)

  const tagId = params.id as string

  useEffect(() => {
    if (tagId) {
      fetchTag(tagId)
    }
  }, [tagId, fetchTag])

  useEffect(() => {
    if (showEnrollModal) {
      fetchItems({})
    }
  }, [showEnrollModal, fetchItems])

  const handleEnroll = async (inventoryItemId: string) => {
    setIsEnrolling(true)
    try {
      const result = await enrollTag(tagId, { inventoryItemId })
      if (result) {
        setShowEnrollModal(false)
        fetchTag(tagId)
      }
    } finally {
      setIsEnrolling(false)
    }
  }

  const handleUnenroll = async () => {
    if (!confirm('¿Estás seguro de que deseas desvincular este tag del item?')) return

    const result = await unenrollTag(tagId)
    if (result) {
      fetchTag(tagId)
    }
  }

  const formatDateTime = (date: Date | string | null) => {
    if (!date) return '-'
    return format(new Date(date), "dd MMM yyyy HH:mm:ss", { locale: es })
  }

  // Filter items without RFID tag for enrollment
  const availableItems = items.filter(item =>
    !item.rfidTag &&
    (enrollSearch === '' ||
      item.serialNumber?.toLowerCase().includes(enrollSearch.toLowerCase()) ||
      item.assetTag?.toLowerCase().includes(enrollSearch.toLowerCase()) ||
      item.product?.name.toLowerCase().includes(enrollSearch.toLowerCase()) ||
      item.product?.sku.toLowerCase().includes(enrollSearch.toLowerCase())
    )
  )

  if (isLoading && !tag) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 mt-4">Cargando tag...</p>
        </div>
      </div>
    )
  }

  if (!tag) {
    return (
      <div className="text-center py-12">
        <Radio className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">Tag no encontrado</p>
        <Link href="/dashboard/inventario/rfid">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a tags
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/inventario/rfid">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Radio className="w-8 h-8 text-violet-400" />
                Tag RFID
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig[tag.status].className}`}>
                  {statusConfig[tag.status].label}
                </span>
              </h1>
              <p className="text-gray-400 mt-1 font-mono">{tag.epc}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {tag.status === 'ENROLLED' && tag.inventoryItem ? (
              <Button variant="outline" onClick={handleUnenroll}>
                <Unlink className="w-4 h-4 mr-2" />
                Desvincular
              </Button>
            ) : (
              <Button variant="primary" onClick={() => setShowEnrollModal(true)}>
                <LinkIcon className="w-4 h-4 mr-2" />
                Vincular a Item
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tag Info */}
            <Card>
              <Card.Header>
                <div className="flex items-center gap-2">
                  <Radio className="w-5 h-5 text-violet-400" />
                  <h2 className="text-lg font-semibold">Información del Tag</h2>
                </div>
              </Card.Header>
              <Card.Content>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm text-gray-400">EPC</label>
                    <p className="mt-1 font-mono text-sm break-all">{tag.epc}</p>
                  </div>
                  {tag.tid && (
                    <div>
                      <label className="text-sm text-gray-400">TID</label>
                      <p className="mt-1 font-mono text-sm break-all">{tag.tid}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm text-gray-400">Primera Detección</label>
                    <p className="mt-1">{formatDateTime(tag.firstSeenAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Última Detección</label>
                    <p className="mt-1">{formatDateTime(tag.lastSeenAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Total Detecciones</label>
                    <p className="mt-1 font-semibold text-lg">{tag._count?.detections || 0}</p>
                  </div>
                </div>
              </Card.Content>
            </Card>

            {/* Linked Item */}
            {tag.inventoryItem && (
              <Card>
                <Card.Header>
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-violet-400" />
                    <h2 className="text-lg font-semibold">Item Vinculado</h2>
                  </div>
                </Card.Header>
                <Card.Content>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50">
                    <div>
                      <p className="font-medium">{tag.inventoryItem.product?.name}</p>
                      <p className="text-sm text-gray-400">
                        {tag.inventoryItem.assetTag || tag.inventoryItem.serialNumber}
                      </p>
                      <p className="text-xs text-gray-500 font-mono mt-1">
                        {tag.inventoryItem.product?.sku}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tag.inventoryItem.status === 'IN' ? 'bg-green-500/10 text-green-400' :
                        tag.inventoryItem.status === 'OUT' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-gray-500/10 text-gray-400'
                      }`}>
                        {tag.inventoryItem.status === 'IN' ? 'En Bodega' :
                         tag.inventoryItem.status === 'OUT' ? 'Afuera' :
                         tag.inventoryItem.status}
                      </span>
                      {tag.inventoryItem.location && (
                        <p className="text-xs text-gray-500 mt-2">{tag.inventoryItem.location}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link href={`/dashboard/inventario/items/${tag.inventoryItem.id}`}>
                      <Button variant="outline" size="sm">
                        Ver Item Completo
                      </Button>
                    </Link>
                  </div>
                </Card.Content>
              </Card>
            )}

            {/* Detection History */}
            <Card>
              <Card.Header>
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-violet-400" />
                  <h2 className="text-lg font-semibold">Historial de Detecciones</h2>
                  <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400">
                    Últimas 50
                  </span>
                </div>
              </Card.Header>
              <Card.Content>
                {tag.detections && (tag.detections as Detection[]).length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <thead>
                        <tr>
                          <th>Fecha/Hora</th>
                          <th>Lector</th>
                          <th>Dirección</th>
                          <th>RSSI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(tag.detections as Detection[]).map((detection) => (
                          <tr key={detection.id}>
                            <td className="text-sm">
                              {formatDateTime(detection.timestamp)}
                            </td>
                            <td>
                              <div>
                                <span className="font-mono text-sm">{detection.readerId}</span>
                                {detection.readerName && (
                                  <p className="text-xs text-gray-500">{detection.readerName}</p>
                                )}
                              </div>
                            </td>
                            <td>
                              {detection.direction ? (
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                  detection.direction === 'IN'
                                    ? 'bg-green-500/10 text-green-400'
                                    : 'bg-blue-500/10 text-blue-400'
                                }`}>
                                  {detection.direction === 'IN' ? (
                                    <><ArrowDownToLine className="w-3 h-3" /> Entrada</>
                                  ) : (
                                    <><ArrowUpFromLine className="w-3 h-3" /> Salida</>
                                  )}
                                </span>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </td>
                            <td className="text-gray-400">
                              {detection.rssi != null ? `${detection.rssi} dBm` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No hay detecciones registradas</p>
                  </div>
                )}
              </Card.Content>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <Card.Header>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-violet-400" />
                  <h2 className="text-lg font-semibold">Detalles</h2>
                </div>
              </Card.Header>
              <Card.Content>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Estado</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[tag.status].className}`}>
                      {statusConfig[tag.status].label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Creado</span>
                    <span>{format(new Date(tag.createdAt), 'dd/MM/yyyy', { locale: es })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Actualizado</span>
                    <span>{format(new Date(tag.updatedAt), 'dd/MM/yyyy', { locale: es })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">ID</span>
                    <span className="font-mono text-xs text-gray-500">{tag.id.slice(-8)}</span>
                  </div>
                </div>
              </Card.Content>
            </Card>

            {/* Actions */}
            <Card>
              <Card.Header>
                <h2 className="text-lg font-semibold">Acciones</h2>
              </Card.Header>
              <Card.Content className="space-y-3">
                {tag.status !== 'ENROLLED' && (
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => setShowEnrollModal(true)}
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Vincular a Item
                  </Button>
                )}
                {tag.status === 'ENROLLED' && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleUnenroll}
                  >
                    <Unlink className="w-4 h-4 mr-2" />
                    Desvincular
                  </Button>
                )}
              </Card.Content>
            </Card>
          </div>
        </div>
      </div>

      {/* Enroll Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowEnrollModal(false)}
          />
          <div className="relative bg-gray-900 rounded-xl border border-gray-800 w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h3 className="text-xl font-semibold">Vincular Tag a Item</h3>
              <p className="text-gray-400 text-sm mt-1">
                Selecciona el item de inventario al que deseas vincular este tag
              </p>
            </div>

            <div className="p-4 border-b border-gray-800">
              <Input
                placeholder="Buscar por serial, etiqueta, producto..."
                value={enrollSearch}
                onChange={(e) => setEnrollSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            <div className="p-4 overflow-y-auto max-h-[400px]">
              {availableItems.length > 0 ? (
                <div className="space-y-2">
                  {availableItems.slice(0, 20).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors cursor-pointer"
                      onClick={() => handleEnroll(item.id)}
                    >
                      <div>
                        <p className="font-medium">{item.product?.name}</p>
                        <p className="text-sm text-gray-400">
                          {item.assetTag || item.serialNumber || item.id.slice(-8)}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">
                          {item.product?.sku}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isEnrolling}
                      >
                        <LinkIcon className="w-4 h-4 mr-1" />
                        Vincular
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No hay items disponibles</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Todos los items ya tienen un tag asignado o no hay items que coincidan
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-800 flex justify-end">
              <Button variant="outline" onClick={() => setShowEnrollModal(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
