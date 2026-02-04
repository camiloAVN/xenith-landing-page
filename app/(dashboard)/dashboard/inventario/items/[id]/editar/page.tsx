'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useInventory } from '@/hooks/useInventory'
import { useProducts } from '@/hooks/useProducts'
import { InventoryItemForm } from '@/components/forms/InventoryItemForm'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { InventoryItemFormData } from '@/lib/validations/inventory'
import { ArrowLeft, Package } from 'lucide-react'

export default function EditInventoryItemPage() {
  const params = useParams()
  const router = useRouter()
  const { currentItem: item, items, isLoading, fetchItem, fetchItems, editItem } = useInventory()
  const { products, fetchProducts } = useProducts()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const itemId = params.id as string

  useEffect(() => {
    fetchProducts()
    fetchItems({ type: 'CONTAINER' })
  }, [fetchProducts, fetchItems])

  useEffect(() => {
    if (itemId) {
      fetchItem(itemId)
    }
  }, [itemId, fetchItem])

  const containers = items.filter((i) => i.type === 'CONTAINER' && i.id !== itemId)

  const handleSubmit = async (data: InventoryItemFormData) => {
    setIsSubmitting(true)
    try {
      const updated = await editItem(itemId, data)
      if (updated) {
        router.push(`/dashboard/inventario/items/${itemId}`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push(`/dashboard/inventario/items/${itemId}`)
  }

  if (isLoading && !item) {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/inventario/items/${itemId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Editar Item</h1>
          <p className="text-gray-400 mt-1">
            {item.assetTag || item.serialNumber || item.id.slice(-8)} - {item.product?.name}
          </p>
        </div>
      </div>

      <Card>
        <Card.Content className="pt-6">
          <InventoryItemForm
            item={item}
            products={products}
            containers={containers}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </Card.Content>
      </Card>
    </div>
  )
}
