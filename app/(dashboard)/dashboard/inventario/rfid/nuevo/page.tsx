'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useRfidTags } from '@/hooks/useRfidTags'
import { useInventory } from '@/hooks/useInventory'
import { RfidTagFormData } from '@/lib/validations/rfid'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ArrowLeft, Radio, Search } from 'lucide-react'

export default function NewRfidTagPage() {
  const router = useRouter()
  const { createTag } = useRfidTags()
  const { items, fetchItems } = useInventory()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [itemSearch, setItemSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [epc, setEpc] = useState('')
  const [tid, setTid] = useState('')
  const [epcError, setEpcError] = useState('')

  useEffect(() => {
    fetchItems({})
  }, [fetchItems])

  const filteredItems = items.filter(item =>
    !item.rfidTag &&
    (itemSearch === '' ||
      item.serialNumber?.toLowerCase().includes(itemSearch.toLowerCase()) ||
      item.assetTag?.toLowerCase().includes(itemSearch.toLowerCase()) ||
      item.product?.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
      item.product?.sku.toLowerCase().includes(itemSearch.toLowerCase())
    )
  )

  const handleItemSelect = (itemId: string) => {
    setSelectedItem(itemId)
  }

  const handleClearItem = () => {
    setSelectedItem(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEpcError('')

    if (!epc.trim()) {
      setEpcError('El EPC es requerido')
      return
    }

    setIsSubmitting(true)
    try {
      const data: RfidTagFormData = {
        epc: epc.trim(),
        tid: tid.trim() || undefined,
        inventoryItemId: selectedItem,
        status: selectedItem ? 'ENROLLED' : 'UNASSIGNED',
      }
      const tag = await createTag(data)
      if (tag) {
        router.push('/dashboard/inventario/rfid')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/dashboard/inventario/rfid')
  }

  const selectedItemData = selectedItem ? items.find(i => i.id === selectedItem) : null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/inventario/rfid">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nuevo Tag RFID</h1>
          <p className="text-gray-400 mt-1">
            Registra manualmente un tag RFID
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tag Form */}
        <Card>
          <Card.Header>
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-violet-400" />
              <h2 className="text-lg font-semibold">Información del Tag</h2>
            </div>
          </Card.Header>
          <Card.Content>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="EPC *"
                placeholder="E200001234567890..."
                value={epc}
                onChange={(e) => setEpc(e.target.value)}
                error={epcError}
              />

              <Input
                label="TID (opcional)"
                placeholder="E200001234567890..."
                value={tid}
                onChange={(e) => setTid(e.target.value)}
              />

              {selectedItemData && (
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Item Vinculado
                  </label>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800 border border-gray-700">
                    <div>
                      <p className="font-medium">{selectedItemData.product?.name}</p>
                      <p className="text-sm text-gray-400">
                        {selectedItemData.assetTag || selectedItemData.serialNumber}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearItem}
                    >
                      Quitar
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting}>
                  Crear Tag
                </Button>
              </div>
            </form>
          </Card.Content>
        </Card>

        {/* Item Selection */}
        <Card>
          <Card.Header>
            <h2 className="text-lg font-semibold">Vincular a Item (opcional)</h2>
            <p className="text-sm text-gray-400 mt-1">
              Puedes vincular el tag a un item existente ahora o hacerlo después
            </p>
          </Card.Header>
          <Card.Content>
            <div className="space-y-4">
              <Input
                placeholder="Buscar items..."
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />

              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {filteredItems.length > 0 ? (
                  filteredItems.slice(0, 15).map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedItem === item.id
                          ? 'bg-violet-500/20 border border-violet-500/50'
                          : 'bg-gray-800/50 hover:bg-gray-800 border border-transparent'
                      }`}
                      onClick={() => handleItemSelect(item.id)}
                    >
                      <div>
                        <p className="font-medium text-sm">{item.product?.name}</p>
                        <p className="text-xs text-gray-400">
                          {item.assetTag || item.serialNumber || item.id.slice(-8)}
                        </p>
                      </div>
                      {selectedItem === item.id && (
                        <span className="text-xs text-violet-400 font-medium">Seleccionado</span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400 text-sm">No hay items disponibles</p>
                    <p className="text-gray-500 text-xs mt-1">
                      Todos los items ya tienen un tag asignado
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  )
}
