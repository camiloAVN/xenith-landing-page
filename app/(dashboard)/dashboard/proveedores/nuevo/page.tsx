'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSuppliers } from '@/hooks/useSuppliers'
import { SupplierForm } from '@/components/forms/SupplierForm'
import { Card } from '@/components/ui/Card'
import { SupplierFormData } from '@/lib/validations/supplier'

export default function NewSupplierPage() {
  const router = useRouter()
  const { createSupplier } = useSuppliers()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: SupplierFormData) => {
    setIsSubmitting(true)
    try {
      const supplier = await createSupplier(data)
      if (supplier) {
        router.push('/dashboard/proveedores')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/dashboard/proveedores')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nuevo Proveedor</h1>
        <p className="text-gray-400 mt-1">
          Agrega un nuevo proveedor de equipos
        </p>
      </div>

      <Card>
        <Card.Content className="pt-6">
          <SupplierForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </Card.Content>
      </Card>
    </div>
  )
}
