'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProducts } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { ProductForm } from '@/components/forms/ProductForm'
import { Card } from '@/components/ui/Card'
import { ProductFormData } from '@/lib/validations/product'

export default function NewProductPage() {
  const router = useRouter()
  const { createProduct } = useProducts()
  const { categories, fetchCategories } = useCategories()
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true)
    try {
      const product = await createProduct(data)
      if (product) {
        router.push('/dashboard/inventario/productos')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/dashboard/inventario/productos')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nuevo Producto</h1>
        <p className="text-gray-400 mt-1">
          Agrega un nuevo producto al catálogo
        </p>
      </div>

      <Card>
        <Card.Content className="pt-6">
          <ProductForm
            categories={categories}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </Card.Content>
      </Card>
    </div>
  )
}
