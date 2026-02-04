'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { inventoryItemSchema, InventoryItemFormData, InventoryItem } from '@/lib/validations/inventory'
import { Product } from '@/lib/validations/product'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'

interface InventoryItemFormProps {
  item?: InventoryItem | null
  products: Product[]
  containers?: InventoryItem[]
  onSubmit: (data: InventoryItemFormData) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function InventoryItemForm({
  item,
  products,
  containers = [],
  onSubmit,
  onCancel,
  isSubmitting = false,
}: InventoryItemFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<InventoryItemFormData>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: item
      ? {
          productId: item.productId,
          serialNumber: item.serialNumber || '',
          assetTag: item.assetTag || '',
          type: item.type,
          status: item.status,
          condition: item.condition || '',
          location: item.location || '',
          containerId: item.containerId || '',
          purchaseDate: item.purchaseDate ? new Date(item.purchaseDate).toISOString().split('T')[0] : '',
          purchasePrice: item.purchasePrice as number | undefined,
          warrantyExpiry: item.warrantyExpiry ? new Date(item.warrantyExpiry).toISOString().split('T')[0] : '',
          notes: item.notes || '',
        }
      : {
          type: 'UNIT',
          status: 'IN',
        },
  })

  const selectedType = watch('type')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Producto *
          </label>
          <select
            className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
            {...register('productId')}
          >
            <option value="">Seleccionar producto...</option>
            {products.map((prod) => (
              <option key={prod.id} value={prod.id}>
                {prod.sku} - {prod.name}
              </option>
            ))}
          </select>
          {errors.productId && (
            <p className="text-red-400 text-sm mt-1">{errors.productId.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Tipo
          </label>
          <select
            className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
            {...register('type')}
          >
            <option value="UNIT">Unidad</option>
            <option value="CONTAINER">Contenedor (Flight Case)</option>
          </select>
        </div>

        <Input
          label="Número de Serie"
          placeholder="SN-2024-001"
          error={errors.serialNumber?.message}
          {...register('serialNumber')}
        />

        <Input
          label="Etiqueta de Activo"
          placeholder="XENITH-001"
          error={errors.assetTag?.message}
          {...register('assetTag')}
        />

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Estado
          </label>
          <select
            className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
            {...register('status')}
          >
            <option value="IN">En Bodega</option>
            <option value="OUT">Afuera</option>
            <option value="MAINTENANCE">Mantenimiento</option>
            <option value="LOST">Perdido</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Condición
          </label>
          <select
            className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
            {...register('condition')}
          >
            <option value="">Seleccionar...</option>
            <option value="Excelente">Excelente</option>
            <option value="Bueno">Bueno</option>
            <option value="Regular">Regular</option>
            <option value="Malo">Malo</option>
          </select>
        </div>

        <Input
          label="Ubicación"
          placeholder="Bodega A - Estante 3"
          error={errors.location?.message}
          {...register('location')}
        />

        {selectedType === 'UNIT' && containers.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Contenedor
            </label>
            <select
              className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
              {...register('containerId')}
            >
              <option value="">Sin contenedor</option>
              {containers.map((cont) => (
                <option key={cont.id} value={cont.id}>
                  {cont.assetTag || cont.serialNumber || cont.id.slice(-8)}
                </option>
              ))}
            </select>
          </div>
        )}

        <Input
          label="Fecha de Compra"
          type="date"
          error={errors.purchaseDate?.message}
          {...register('purchaseDate')}
        />

        <Input
          label="Precio de Compra"
          type="number"
          placeholder="500000"
          error={errors.purchasePrice?.message}
          {...register('purchasePrice', { valueAsNumber: true })}
        />

        <Input
          label="Vencimiento Garantía"
          type="date"
          error={errors.warrantyExpiry?.message}
          {...register('warrantyExpiry')}
        />
      </div>

      <Textarea
        label="Notas"
        placeholder="Notas sobre el item..."
        rows={3}
        error={errors.notes?.message}
        {...register('notes')}
      />

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {item ? 'Actualizar Item' : 'Crear Item'}
        </Button>
      </div>
    </form>
  )
}
