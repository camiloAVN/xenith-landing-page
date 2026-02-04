'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useInventory } from '@/hooks/useInventory'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Table } from '@/components/ui/Table'
import {
  ArrowLeft,
  Edit,
  Package,
  Tag,
  MapPin,
  Calendar,
  DollarSign,
  Radio,
  Box,
  History,
  ArrowDownToLine,
  ArrowUpFromLine,
  Wrench,
  AlertTriangle,
} from 'lucide-react'

const statusConfig = {
  IN: { label: 'En Bodega', className: 'bg-green-500/10 text-green-400', icon: ArrowDownToLine },
  OUT: { label: 'Afuera', className: 'bg-blue-500/10 text-blue-400', icon: ArrowUpFromLine },
  MAINTENANCE: { label: 'Mantenimiento', className: 'bg-amber-500/10 text-amber-400', icon: Wrench },
  LOST: { label: 'Perdido', className: 'bg-red-500/10 text-red-400', icon: AlertTriangle },
}

const typeConfig = {
  UNIT: { label: 'Unidad', className: 'bg-violet-500/10 text-violet-400' },
  CONTAINER: { label: 'Contenedor', className: 'bg-cyan-500/10 text-cyan-400' },
  BULK: { label: 'Bulk', className: 'bg-gray-500/10 text-gray-400' },
}

const movementTypeConfig: Record<string, { label: string; className: string }> = {
  CHECK_IN: { label: 'Entrada', className: 'text-green-400' },
  CHECK_OUT: { label: 'Salida', className: 'text-blue-400' },
  ADJUSTMENT: { label: 'Ajuste', className: 'text-amber-400' },
  ENROLLMENT: { label: 'Registro', className: 'text-violet-400' },
  TRANSFER: { label: 'Transferencia', className: 'text-cyan-400' },
}

interface Movement {
  id: string
  type: string
  fromStatus: string | null
  toStatus: string
  fromLocation: string | null
  toLocation: string | null
  reason: string | null
  reference: string | null
  createdAt: Date | string
  user?: {
    id: string
    name: string | null
    email: string
  }
}

interface ContentItem {
  id: string
  serialNumber: string | null
  assetTag: string | null
  status: string
  product?: {
    name: string
    sku: string
  }
}

export default function InventoryItemDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { currentItem: item, isLoading, fetchItem, checkIn, checkOut } = useInventory()

  const itemId = params.id as string

  useEffect(() => {
    if (itemId) {
      fetchItem(itemId)
    }
  }, [itemId, fetchItem])

  const formatPrice = (price: number | null) => {
    if (price === null) return '-'
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatDateTime = (date: Date | string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleCheckIn = async () => {
    const result = await checkIn(itemId)
    if (result) {
      fetchItem(itemId)
    }
  }

  const handleCheckOut = async () => {
    const result = await checkOut(itemId)
    if (result) {
      fetchItem(itemId)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 mt-4">Cargando item...</p>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">Item no encontrado</p>
        <Link href="/dashboard/inventario/items">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a items
          </Button>
        </Link>
      </div>
    )
  }

  const StatusIcon = statusConfig[item.status].icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/inventario/items">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              {item.assetTag || item.serialNumber || item.id.slice(-8)}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig[item.status].className}`}>
                <StatusIcon className="w-4 h-4 inline mr-1" />
                {statusConfig[item.status].label}
              </span>
            </h1>
            <p className="text-gray-400 mt-1">
              {item.product?.name} - {item.product?.sku}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {item.status !== 'IN' && (
            <Button variant="outline" onClick={handleCheckIn}>
              <ArrowDownToLine className="w-4 h-4 mr-2" />
              Check In
            </Button>
          )}
          {item.status === 'IN' && (
            <Button variant="outline" onClick={handleCheckOut}>
              <ArrowUpFromLine className="w-4 h-4 mr-2" />
              Check Out
            </Button>
          )}
          <Link href={`/dashboard/inventario/items/${item.id}/editar`}>
            <Button variant="primary">
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-violet-400" />
                <h2 className="text-lg font-semibold">Información General</h2>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-gray-400">Producto</label>
                  <Link
                    href={`/dashboard/inventario/productos/${item.productId}`}
                    className="mt-1 flex items-center gap-2 text-violet-400 hover:text-violet-300"
                  >
                    {item.product?.name}
                    {item.product?.brand && (
                      <span className="text-gray-500 text-sm">
                        ({item.product.brand} {item.product.model})
                      </span>
                    )}
                  </Link>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Categoría</label>
                  <p className="mt-1 flex items-center gap-2">
                    {item.product?.category && (
                      <>
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.product.category.color || '#6b7280' }}
                        />
                        {item.product.category.name}
                      </>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Número de Serie</label>
                  <p className="mt-1 font-mono">{item.serialNumber || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Etiqueta de Activo</label>
                  <p className="mt-1 font-mono">{item.assetTag || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Tipo</label>
                  <p className="mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeConfig[item.type].className}`}>
                      {typeConfig[item.type].label}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Condición</label>
                  <p className="mt-1">{item.condition || '-'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Ubicación</label>
                  <p className="mt-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    {item.location || 'Sin ubicación'}
                  </p>
                </div>
                {item.container && (
                  <div>
                    <label className="text-sm text-gray-400">Contenedor</label>
                    <Link
                      href={`/dashboard/inventario/items/${item.containerId}`}
                      className="mt-1 flex items-center gap-2 text-violet-400 hover:text-violet-300"
                    >
                      <Box className="w-4 h-4" />
                      {item.container.assetTag || item.container.serialNumber || item.container.id.slice(-8)}
                    </Link>
                  </div>
                )}
              </div>

              {item.notes && (
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <label className="text-sm text-gray-400">Notas</label>
                  <p className="mt-2 text-gray-300">{item.notes}</p>
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Contents (for containers) */}
          {item.type === 'CONTAINER' && (
            <Card>
              <Card.Header>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Box className="w-5 h-5 text-violet-400" />
                    <h2 className="text-lg font-semibold">Contenido</h2>
                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-500/10 text-violet-400">
                      {item._count?.contents || 0} items
                    </span>
                  </div>
                </div>
              </Card.Header>
              <Card.Content>
                {item.contents && item.contents.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <thead>
                        <tr>
                          <th>ID / Serie</th>
                          <th>Producto</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(item.contents as ContentItem[]).map((content) => (
                          <tr key={content.id}>
                            <td>
                              <Link
                                href={`/dashboard/inventario/items/${content.id}`}
                                className="font-mono text-sm text-violet-400 hover:text-violet-300"
                              >
                                {content.assetTag || content.serialNumber || content.id.slice(-8)}
                              </Link>
                            </td>
                            <td>{content.product?.name || 'N/A'}</td>
                            <td>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[content.status as keyof typeof statusConfig]?.className || 'bg-gray-500/10 text-gray-400'}`}>
                                {statusConfig[content.status as keyof typeof statusConfig]?.label || content.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Box className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">Este contenedor está vacío</p>
                  </div>
                )}
              </Card.Content>
            </Card>
          )}

          {/* Movements History */}
          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-violet-400" />
                <h2 className="text-lg font-semibold">Historial de Movimientos</h2>
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400">
                  {item._count?.movements || 0}
                </span>
              </div>
            </Card.Header>
            <Card.Content>
              {item.movements && (item.movements as Movement[]).length > 0 ? (
                <div className="space-y-4">
                  {(item.movements as Movement[]).map((movement) => (
                    <div
                      key={movement.id}
                      className="flex items-start gap-4 p-4 rounded-lg bg-gray-800/50"
                    >
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gray-800 ${movementTypeConfig[movement.type]?.className || 'text-gray-400'}`}>
                          {movement.type === 'CHECK_IN' && <ArrowDownToLine className="w-5 h-5" />}
                          {movement.type === 'CHECK_OUT' && <ArrowUpFromLine className="w-5 h-5" />}
                          {movement.type === 'ADJUSTMENT' && <Wrench className="w-5 h-5" />}
                          {movement.type === 'ENROLLMENT' && <Tag className="w-5 h-5" />}
                          {movement.type === 'TRANSFER' && <MapPin className="w-5 h-5" />}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${movementTypeConfig[movement.type]?.className || 'text-gray-400'}`}>
                            {movementTypeConfig[movement.type]?.label || movement.type}
                          </span>
                          <span className="text-gray-500 text-sm">
                            {formatDateTime(movement.createdAt)}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-gray-400">
                          {movement.fromStatus && (
                            <span>
                              {statusConfig[movement.fromStatus as keyof typeof statusConfig]?.label || movement.fromStatus}
                              {' '}&rarr;{' '}
                            </span>
                          )}
                          <span className="text-gray-200">
                            {statusConfig[movement.toStatus as keyof typeof statusConfig]?.label || movement.toStatus}
                          </span>
                          {movement.toLocation && (
                            <span className="ml-2">
                              en {movement.toLocation}
                            </span>
                          )}
                        </div>
                        {movement.reason && (
                          <p className="mt-1 text-sm text-gray-500">{movement.reason}</p>
                        )}
                        {movement.user && (
                          <p className="mt-1 text-xs text-gray-500">
                            Por: {movement.user.name || movement.user.email}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No hay movimientos registrados</p>
                </div>
              )}
            </Card.Content>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* RFID Tag */}
          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-violet-400" />
                <h2 className="text-lg font-semibold">Tag RFID</h2>
              </div>
            </Card.Header>
            <Card.Content>
              {item.rfidTag ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-400">EPC</label>
                    <p className="mt-1 font-mono text-sm break-all">{item.rfidTag.epc}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Estado</label>
                    <p className="mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.rfidTag.status === 'ENROLLED'
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-gray-500/10 text-gray-400'
                      }`}>
                        {item.rfidTag.status === 'ENROLLED' ? 'Vinculado' : item.rfidTag.status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Última detección</label>
                    <p className="mt-1 text-sm">{formatDateTime(item.rfidTag.lastSeenAt)}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Radio className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Sin tag RFID asignado</p>
                  <Button variant="outline" size="sm" className="mt-3">
                    Asignar Tag
                  </Button>
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Purchase Info */}
          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-violet-400" />
                <h2 className="text-lg font-semibold">Información de Compra</h2>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-400">Fecha de Compra</label>
                  <p className="mt-1">{formatDate(item.purchaseDate)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Precio de Compra</label>
                  <p className="mt-1 font-semibold text-lg">
                    {formatPrice(item.purchasePrice)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Vencimiento Garantía</label>
                  <p className="mt-1">{formatDate(item.warrantyExpiry)}</p>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Metadata */}
          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-violet-400" />
                <h2 className="text-lg font-semibold">Detalles</h2>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Creado</span>
                  <span>{formatDate(item.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Actualizado</span>
                  <span>{formatDate(item.updatedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">ID</span>
                  <span className="font-mono text-xs text-gray-500">{item.id}</span>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  )
}
