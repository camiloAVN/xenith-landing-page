'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRfidTags } from '@/hooks/useRfidTags'
import { useInventory } from '@/hooks/useInventory'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Table } from '@/components/ui/Table'
import {
  ArrowLeft,
  Radio,
  AlertCircle,
  Link as LinkIcon,
  Trash2,
  Search,
  Package,
  X,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function UnknownRfidTagsPage() {
  const { unknownTags, isLoading, fetchUnknownTags, enrollTag, deleteTag } = useRfidTags()
  const { items, fetchItems } = useInventory()
  const [enrollingTagId, setEnrollingTagId] = useState<string | null>(null)
  const [itemSearch, setItemSearch] = useState('')

  useEffect(() => {
    fetchUnknownTags()
    fetchItems({})
  }, [fetchUnknownTags, fetchItems])

  const handleEnroll = async (tagId: string, inventoryItemId: string) => {
    const result = await enrollTag(tagId, { inventoryItemId })
    if (result) {
      setEnrollingTagId(null)
      fetchUnknownTags()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este tag desconocido?')) return

    const success = await deleteTag(id)
    if (success) {
      fetchUnknownTags()
    }
  }

  const availableItems = items.filter(item =>
    !item.rfidTag &&
    (itemSearch === '' ||
      item.serialNumber?.toLowerCase().includes(itemSearch.toLowerCase()) ||
      item.assetTag?.toLowerCase().includes(itemSearch.toLowerCase()) ||
      item.product?.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
      item.product?.sku.toLowerCase().includes(itemSearch.toLowerCase())
    )
  )

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/inventario/rfid">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-amber-400" />
              Tags Desconocidos
            </h1>
            <p className="text-gray-400 mt-1">
              Tags detectados que no están registrados en el sistema
            </p>
          </div>
        </div>

        {/* Info Card */}
        <Card variant="glass" className="border-amber-500/20">
          <Card.Content className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
              <div>
                <p className="text-gray-200">
                  Estos tags fueron detectados por los lectores RFID pero no están vinculados a ningún item.
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Puedes vincularlos a items existentes o eliminarlos si no corresponden a tu inventario.
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-semibold">Tags Sin Identificar</h2>
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400">
                  {unknownTags.length}
                </span>
              </div>
            </div>
          </Card.Header>
          <Card.Content>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400 mt-4">Cargando tags...</p>
              </div>
            ) : unknownTags.length === 0 ? (
              <div className="text-center py-12">
                <Radio className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No hay tags desconocidos</p>
                <p className="text-sm text-gray-500 mt-2">
                  Todos los tags detectados están registrados
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <thead>
                    <tr>
                      <th>EPC</th>
                      <th>Primera Detección</th>
                      <th>Última Detección</th>
                      <th>Detecciones</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unknownTags.map((tag) => (
                      <tr key={tag.id}>
                        <td className="font-mono text-sm">{tag.epc}</td>
                        <td className="text-gray-400">
                          {format(new Date(tag.firstSeenAt), 'dd MMM yyyy HH:mm', { locale: es })}
                        </td>
                        <td className="text-gray-400">
                          {format(new Date(tag.lastSeenAt), 'dd MMM yyyy HH:mm', { locale: es })}
                        </td>
                        <td>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-800">
                            {tag._count?.detections || 0}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEnrollingTagId(tag.id)}
                            >
                              <LinkIcon className="w-4 h-4 mr-1" />
                              Vincular
                            </Button>
                            <Link href={`/dashboard/inventario/rfid/${tag.id}`}>
                              <Button variant="ghost" size="sm">
                                Ver
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              onClick={() => handleDelete(tag.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Content>
        </Card>
      </div>

      {/* Enroll Modal */}
      {enrollingTagId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setEnrollingTagId(null)}
          />
          <div className="relative bg-gray-900 rounded-xl border border-gray-800 w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">Vincular Tag a Item</h3>
                <p className="text-gray-400 text-sm mt-1 font-mono">
                  {unknownTags.find(t => t.id === enrollingTagId)?.epc}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEnrollingTagId(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-4 border-b border-gray-800">
              <Input
                placeholder="Buscar items por serial, etiqueta, producto..."
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
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
                      onClick={() => handleEnroll(enrollingTagId, item.id)}
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
                      <Button variant="outline" size="sm">
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
                    Todos los items ya tienen un tag asignado
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-800 flex justify-end">
              <Button variant="outline" onClick={() => setEnrollingTagId(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
