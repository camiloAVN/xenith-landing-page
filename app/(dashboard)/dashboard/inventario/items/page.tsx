'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useInventory } from '@/hooks/useInventory'
import { InventoryItemsTable } from '@/components/dashboard/inventory/InventoryItemsTable'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Plus, Search } from 'lucide-react'

export default function InventoryItemsPage() {
  const { items, isLoading, filters, setFilters, fetchItems, deleteItem, checkIn, checkOut } = useInventory()
  const [localSearch, setLocalSearch] = useState(filters.search)

  useEffect(() => {
    fetchItems(filters)
  }, [fetchItems, filters])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setFilters({ search: localSearch })
  }

  const handleDelete = async (id: string) => {
    const success = await deleteItem(id)
    if (success) {
      fetchItems(filters)
    }
  }

  const handleCheckIn = async (id: string) => {
    const result = await checkIn(id)
    if (result) {
      fetchItems(filters)
    }
  }

  const handleCheckOut = async (id: string) => {
    const result = await checkOut(id)
    if (result) {
      fetchItems(filters)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Items de Inventario</h1>
          <p className="text-gray-400 mt-1">
            Gestiona tus equipos físicos
          </p>
        </div>
        <Link href="/dashboard/inventario/items/nuevo">
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Item
          </Button>
        </Link>
      </div>

      <Card>
        <Card.Header>
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por número de serie, etiqueta, producto..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>
              <Button type="submit" variant="outline">
                Buscar
              </Button>
            </form>
            <div className="flex gap-2">
              <select
                className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={filters.status}
                onChange={(e) => setFilters({ status: e.target.value })}
              >
                <option value="">Todos los estados</option>
                <option value="IN">En Bodega</option>
                <option value="OUT">Afuera</option>
                <option value="MAINTENANCE">Mantenimiento</option>
                <option value="LOST">Perdido</option>
              </select>
              <select
                className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={filters.type}
                onChange={(e) => setFilters({ type: e.target.value })}
              >
                <option value="">Todos los tipos</option>
                <option value="UNIT">Unidad</option>
                <option value="CONTAINER">Contenedor</option>
              </select>
            </div>
          </div>
        </Card.Header>
        <Card.Content>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 mt-4">Cargando items...</p>
            </div>
          ) : (
            <InventoryItemsTable
              items={items}
              onDelete={handleDelete}
              onCheckIn={handleCheckIn}
              onCheckOut={handleCheckOut}
            />
          )}
        </Card.Content>
      </Card>
    </div>
  )
}
