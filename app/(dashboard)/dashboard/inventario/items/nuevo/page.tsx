'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useInventory } from '@/hooks/useInventory'
import { useProducts } from '@/hooks/useProducts'
import { InventoryItemForm } from '@/components/forms/InventoryItemForm'
import { Card } from '@/components/ui/Card'
import { InventoryItemFormData } from '@/lib/validations/inventory'

export default function NewInventoryItemPage() {
  const router = useRouter()
  const { createItem, items, fetchItems } = useInventory()
  const { products, fetchProducts } = useProducts()
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchProducts()
    fetchItems({ type: 'CONTAINER' })
  }, [fetchProducts, fetchItems])

  const containers = items.filter((item) => item.type === 'CONTAINER')

  const handleSubmit = async (data: InventoryItemFormData) => {
    setIsSubmitting(true)
    try {
      const item = await createItem(data)
      if (item) {
        router.push('/dashboard/inventario/items')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/dashboard/inventario/items')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nuevo Item de Inventario</h1>
        <p className="text-gray-400 mt-1">
          Agrega un nuevo equipo al inventario
        </p>
      </div>

      <Card>
        <Card.Content className="pt-6">
          <InventoryItemForm
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
