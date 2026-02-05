'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useClients } from '@/hooks/useClients'
import { usePermissions } from '@/hooks/usePermissions'
import { ClientsTable } from '@/components/dashboard/ClientsTable'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Plus, Search } from 'lucide-react'

export default function ClientsPage() {
  const router = useRouter()
  const { clients, isLoading, searchQuery, setSearchQuery, fetchClients, deleteClient } = useClients()
  const { canEdit } = usePermissions()
  const [localSearch, setLocalSearch] = useState(searchQuery)

  const hasEditPermission = canEdit('clientes')

  useEffect(() => {
    fetchClients(searchQuery)
  }, [fetchClients, searchQuery])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchQuery(localSearch)
  }

  const handleDelete = async (id: string) => {
    const success = await deleteClient(id)
    if (success) {
      fetchClients(searchQuery)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-gray-400 mt-1">
            Gestiona tu cartera de clientes
          </p>
        </div>
        {hasEditPermission && (
          <Link href="/dashboard/clientes/nuevo">
            <Button variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Cliente
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <Card.Header>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre, email o empresa..."
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
              <p className="text-gray-400 mt-4">Cargando clientes...</p>
            </div>
          ) : (
            <ClientsTable
              clients={clients}
              onDelete={hasEditPermission ? handleDelete : undefined}
              showActions={hasEditPermission}
            />
          )}
        </Card.Content>
      </Card>
    </div>
  )
}
