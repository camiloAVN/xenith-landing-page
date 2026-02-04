'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSuppliers } from '@/hooks/useSuppliers'
import { SupplierForm } from '@/components/forms/SupplierForm'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { SupplierFormData } from '@/lib/validations/supplier'
import { ArrowLeft, Truck } from 'lucide-react'

export default function EditSupplierPage() {
  const params = useParams()
  const router = useRouter()
  const { currentSupplier: supplier, isLoading, fetchSupplier, editSupplier } = useSuppliers()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supplierId = params.id as string

  useEffect(() => {
    if (supplierId) {
      fetchSupplier(supplierId)
    }
  }, [supplierId, fetchSupplier])

  const handleSubmit = async (data: SupplierFormData) => {
    setIsSubmitting(true)
    try {
      const updated = await editSupplier(supplierId, data)
      if (updated) {
        router.push(`/dashboard/proveedores/${supplierId}`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push(`/dashboard/proveedores/${supplierId}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 mt-4">Cargando proveedor...</p>
        </div>
      </div>
    )
  }

  if (!supplier) {
    return (
      <div className="text-center py-12">
        <Truck className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">Proveedor no encontrado</p>
        <Link href="/dashboard/proveedores">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a proveedores
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/proveedores/${supplierId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Editar Proveedor</h1>
          <p className="text-gray-400 mt-1">{supplier.name}</p>
        </div>
      </div>

      <Card>
        <Card.Content className="pt-6">
          <SupplierForm
            supplier={supplier}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </Card.Content>
      </Card>
    </div>
  )
}
