'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useProducts } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { ProductForm } from '@/components/forms/ProductForm'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProductFormData } from '@/lib/validations/product'
import { ArrowLeft, Package } from 'lucide-react'

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const { currentProduct: product, isLoading, fetchProduct, editProduct } = useProducts()
  const { categories, fetchCategories } = useCategories()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const productId = params.id as string

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    if (productId) {
      fetchProduct(productId)
    }
  }, [productId, fetchProduct])

  const handleSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true)
    try {
      const updated = await editProduct(productId, data)
      if (updated) {
        router.push(`/dashboard/inventario/productos/${productId}`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push(`/dashboard/inventario/productos/${productId}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 mt-4">Cargando producto...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">Producto no encontrado</p>
        <Link href="/dashboard/inventario/productos">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a productos
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/inventario/productos/${productId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Editar Producto</h1>
          <p className="text-gray-400 mt-1">
            {product.name} ({product.sku})
          </p>
        </div>
      </div>

      <Card>
        <Card.Content className="pt-6">
          <ProductForm
            product={product}
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
