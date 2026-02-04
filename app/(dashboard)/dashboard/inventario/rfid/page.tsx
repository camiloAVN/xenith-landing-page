'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRfidTags } from '@/hooks/useRfidTags'
import { RfidTagsTable } from '@/components/dashboard/inventory/RfidTagsTable'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Plus, Search, AlertCircle } from 'lucide-react'

export default function RfidTagsPage() {
  const { tags, unknownTags, isLoading, filters, setFilters, fetchTags, fetchUnknownTags, deleteTag } = useRfidTags()
  const [localSearch, setLocalSearch] = useState(filters.search)

  useEffect(() => {
    fetchTags(filters)
    fetchUnknownTags()
  }, [fetchTags, fetchUnknownTags, filters])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setFilters({ search: localSearch })
  }

  const handleDelete = async (id: string) => {
    const success = await deleteTag(id)
    if (success) {
      fetchTags(filters)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tags RFID</h1>
          <p className="text-gray-400 mt-1">
            Gestiona los tags RFID de tu inventario
          </p>
        </div>
        <Link href="/dashboard/inventario/rfid/nuevo">
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Tag
          </Button>
        </Link>
      </div>

      {/* Unknown Tags Alert */}
      {unknownTags.length > 0 && (
        <Card variant="glass" className="border-amber-500/20">
          <Card.Content className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-amber-400">Tags Desconocidos Detectados</p>
                  <p className="text-sm text-gray-400">
                    Se han detectado {unknownTags.length} tags que no están registrados en el sistema
                  </p>
                </div>
              </div>
              <Link href="/dashboard/inventario/rfid/desconocidos">
                <Button variant="outline" size="sm">
                  Ver Tags
                </Button>
              </Link>
            </div>
          </Card.Content>
        </Card>
      )}

      <Card>
        <Card.Header>
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por EPC, TID, serial..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>
              <Button type="submit" variant="outline">
                Buscar
              </Button>
            </form>
            <select
              className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              value={filters.status}
              onChange={(e) => setFilters({ status: e.target.value })}
            >
              <option value="">Todos los estados</option>
              <option value="ENROLLED">Vinculado</option>
              <option value="UNASSIGNED">Sin Vincular</option>
              <option value="UNKNOWN">Desconocido</option>
            </select>
          </div>
        </Card.Header>
        <Card.Content>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 mt-4">Cargando tags...</p>
            </div>
          ) : (
            <RfidTagsTable tags={tags} onDelete={handleDelete} />
          )}
        </Card.Content>
      </Card>
    </div>
  )
}
