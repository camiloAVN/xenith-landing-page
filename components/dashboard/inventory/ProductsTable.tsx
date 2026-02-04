'use client'

import Link from 'next/link'
import { Product } from '@/lib/validations/product'
import { Table } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Eye, Edit, Trash2, Package } from 'lucide-react'

interface ProductsTableProps {
  products: Product[]
  onDelete: (id: string) => void
}

export function ProductsTable({ products, onDelete }: ProductsTableProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">No hay productos registrados</p>
        <p className="text-sm text-gray-500 mt-2">
          Crea tu primer producto para comenzar
        </p>
      </div>
    )
  }

  const formatPrice = (price: number | null) => {
    if (price === null) return '-'
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Marca / Modelo</th>
            <th>Precio Alquiler</th>
            <th>Items</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td className="font-mono text-sm">{product.sku}</td>
              <td className="font-medium">{product.name}</td>
              <td>
                {product.category && (
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: product.category.color || '#6b7280' }}
                    />
                    {product.category.name}
                  </span>
                )}
              </td>
              <td className="text-gray-400">
                {[product.brand, product.model].filter(Boolean).join(' ') || '-'}
              </td>
              <td>{formatPrice(product.rentalPrice as number | null)}</td>
              <td>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-800">
                  {product._count?.inventoryItems || 0}
                </span>
              </td>
              <td>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    product.status === 'ACTIVE'
                      ? 'bg-green-500/10 text-green-400'
                      : 'bg-gray-500/10 text-gray-400'
                  }`}
                >
                  {product.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td>
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/inventario/productos/${product.id}`}>
                    <Button variant="ghost" size="sm" title="Ver detalles">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href={`/dashboard/inventario/productos/${product.id}/editar`}>
                    <Button variant="ghost" size="sm" title="Editar">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => {
                      if (
                        confirm(
                          '¿Estás seguro de que deseas eliminar este producto?'
                        )
                      ) {
                        onDelete(product.id)
                      }
                    }}
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}
