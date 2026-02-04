'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { supplierSchema, SupplierFormData, Supplier } from '@/lib/validations/supplier'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'

interface SupplierFormProps {
  supplier?: Supplier | null
  onSubmit: (data: SupplierFormData) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function SupplierForm({
  supplier,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: SupplierFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: supplier
      ? {
          name: supplier.name,
          contactName: supplier.contactName || '',
          email: supplier.email || '',
          phone: supplier.phone || '',
          address: supplier.address || '',
          city: supplier.city || '',
          country: supplier.country || '',
          website: supplier.website || '',
          notes: supplier.notes || '',
        }
      : undefined,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Nombre *"
          placeholder="AudioPro S.A.S"
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Persona de Contacto"
          placeholder="Juan García"
          error={errors.contactName?.message}
          {...register('contactName')}
        />

        <Input
          label="Email"
          type="email"
          placeholder="contacto@audiopro.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Teléfono"
          placeholder="+57 300 123 4567"
          error={errors.phone?.message}
          {...register('phone')}
        />

        <Input
          label="Dirección"
          placeholder="Calle 100 #15-20"
          error={errors.address?.message}
          {...register('address')}
        />

        <Input
          label="Ciudad"
          placeholder="Bogotá"
          error={errors.city?.message}
          {...register('city')}
        />

        <Input
          label="País"
          placeholder="Colombia"
          error={errors.country?.message}
          {...register('country')}
        />

        <Input
          label="Sitio Web"
          placeholder="https://audiopro.com"
          error={errors.website?.message}
          {...register('website')}
        />
      </div>

      <Textarea
        label="Notas"
        placeholder="Información adicional sobre el proveedor..."
        rows={4}
        error={errors.notes?.message}
        {...register('notes')}
      />

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {supplier ? 'Actualizar Proveedor' : 'Crear Proveedor'}
        </Button>
      </div>
    </form>
  )
}
