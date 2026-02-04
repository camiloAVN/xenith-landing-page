'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useProducts } from '@/hooks/useProducts'
import { useCategories } from '@/hooks/useCategories'
import { ProductsTable } from '@/components/dashboard/inventory/ProductsTable'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Plus, Search, Filter } from 'lucide-react'

export default function ProductsPage() {
  const { products, isLoading, filters, setFilters, fetchProducts, deleteProduct } = useProducts()
  const { categories, fetchCategories } = useCategories()
  const [localSearch, setLocalSearch] = useState(filters.search)

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    fetchProducts(filters)
  }, [fetchProducts, filters])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setFilters({ search: localSearch })
  }

  const handleDelete = async (id: string) => {
    const success = await deleteProduct(id)
    if (success) {
      fetchProducts(filters)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Productos</h1>
          <p className="text-gray-400 mt-1">
            Catálogo de productos disponibles
          </p>
        </div>
        <Link href="/dashboard/inventario/productos/nuevo">
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </Button>
        </Link>
      </div>

      <Card>
        <Card.Header>
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex gap-2 flex-1">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por nombre, SKU, marca..."
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
                value={filters.categoryId}
                onChange={(e) => setFilters({ categoryId: e.target.value })}
              >
                <option value="">Todas las categorías</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <select
                className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={filters.status}
                onChange={(e) => setFilters({ status: e.target.value })}
              >
                <option value="">Todos los estados</option>
                <option value="ACTIVE">Activo</option>
                <option value="INACTIVE">Inactivo</option>
              </select>
            </div>
          </div>
        </Card.Header>
        <Card.Content>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 mt-4">Cargando productos...</p>
            </div>
          ) : (
            <ProductsTable products={products} onDelete={handleDelete} />
          )}
        </Card.Content>
      </Card>
    </div>
  )
}
