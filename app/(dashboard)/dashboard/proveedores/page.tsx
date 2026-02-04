'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSuppliers } from '@/hooks/useSuppliers'
import { SuppliersTable } from '@/components/dashboard/SuppliersTable'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Plus, Search } from 'lucide-react'

export default function SuppliersPage() {
  const { suppliers, isLoading, searchQuery, setSearchQuery, fetchSuppliers, deleteSupplier } = useSuppliers()
  const [localSearch, setLocalSearch] = useState(searchQuery)

  useEffect(() => {
    fetchSuppliers(searchQuery)
  }, [fetchSuppliers, searchQuery])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchQuery(localSearch)
  }

  const handleDelete = async (id: string) => {
    const success = await deleteSupplier(id)
    if (success) {
      fetchSuppliers(searchQuery)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Proveedores</h1>
          <p className="text-gray-400 mt-1">
            Gestiona tus proveedores de equipos
          </p>
        </div>
        <Link href="/dashboard/proveedores/nuevo">
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Proveedor
          </Button>
        </Link>
      </div>

      <Card>
        <Card.Header>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre, contacto o email..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <Button type="submit" variant="outline">
              Buscar
            </Button>
          </form>
        </Card.Header>
        <Card.Content>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 mt-4">Cargando proveedores...</p>
            </div>
          ) : (
            <SuppliersTable suppliers={suppliers} onDelete={handleDelete} />
          )}
        </Card.Content>
      </Card>
    </div>
  )
}
