'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { productSchema, ProductFormData, Product } from '@/lib/validations/product'
import { Category } from '@/lib/validations/category'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'

interface ProductFormProps {
  product?: Product | null
  categories: Category[]
  onSubmit: (data: ProductFormData) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function ProductForm({
  product,
  categories,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ProductFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          sku: product.sku,
          name: product.name,
          description: product.description || '',
          categoryId: product.categoryId,
          brand: product.brand || '',
          model: product.model || '',
          status: product.status,
          unitPrice: product.unitPrice as number | undefined,
          rentalPrice: product.rentalPrice as number | undefined,
          imageUrl: product.imageUrl || '',
          notes: product.notes || '',
        }
      : {
          status: 'ACTIVE',
        },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="SKU *"
          placeholder="AUD-001"
          error={errors.sku?.message}
          {...register('sku')}
        />

        <Input
          label="Nombre *"
          placeholder="Micrófono Shure SM58"
          error={errors.name?.message}
          {...register('name')}
        />

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Categoría *
          </label>
          <select
            className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
            {...register('categoryId')}
          >
            <option value="">Seleccionar categoría...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="text-red-400 text-sm mt-1">{errors.categoryId.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Estado
          </label>
          <select
            className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
            {...register('status')}
          >
            <option value="ACTIVE">Activo</option>
            <option value="INACTIVE">Inactivo</option>
          </select>
        </div>

        <Input
          label="Marca"
          placeholder="Shure"
          error={errors.brand?.message}
          {...register('brand')}
        />

        <Input
          label="Modelo"
          placeholder="SM58"
          error={errors.model?.message}
          {...register('model')}
        />

        <Input
          label="Precio Unitario"
          type="number"
          placeholder="150000"
          error={errors.unitPrice?.message}
          {...register('unitPrice', { valueAsNumber: true })}
        />

        <Input
          label="Precio Alquiler"
          type="number"
          placeholder="25000"
          error={errors.rentalPrice?.message}
          {...register('rentalPrice', { valueAsNumber: true })}
        />

        <div className="md:col-span-2">
          <Input
            label="URL Imagen"
            placeholder="https://..."
            error={errors.imageUrl?.message}
            {...register('imageUrl')}
          />
        </div>
      </div>

      <Textarea
        label="Descripción"
        placeholder="Descripción del producto..."
        rows={3}
        error={errors.description?.message}
        {...register('description')}
      />

      <Textarea
        label="Notas"
        placeholder="Notas adicionales..."
        rows={2}
        error={errors.notes?.message}
        {...register('notes')}
      />

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {product ? 'Actualizar Producto' : 'Crear Producto'}
        </Button>
      </div>
    </form>
  )
}
