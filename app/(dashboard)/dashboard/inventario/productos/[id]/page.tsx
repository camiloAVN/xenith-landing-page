'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useProducts } from '@/hooks/useProducts'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Table } from '@/components/ui/Table'
import {
  ArrowLeft,
  Edit,
  Package,
  Tag,
  DollarSign,
  Boxes,
  Building2,
  FileText,
  Image as ImageIcon,
} from 'lucide-react'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { currentProduct: product, isLoading, fetchProduct } = useProducts()

  const productId = params.id as string

  useEffect(() => {
    if (productId) {
      fetchProduct(productId)
    }
  }, [productId, fetchProduct])

  const formatPrice = (price: number | null) => {
    if (price === null) return '-'
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      IN: 'bg-green-500/10 text-green-400',
      OUT: 'bg-yellow-500/10 text-yellow-400',
      MAINTENANCE: 'bg-orange-500/10 text-orange-400',
      LOST: 'bg-red-500/10 text-red-400',
    }
    const labels = {
      IN: 'En stock',
      OUT: 'En uso',
      MAINTENANCE: 'Mantenimiento',
      LOST: 'Perdido',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-500/10 text-gray-400'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  const getConditionBadge = (condition: string) => {
    const styles = {
      NEW: 'bg-blue-500/10 text-blue-400',
      GOOD: 'bg-green-500/10 text-green-400',
      FAIR: 'bg-yellow-500/10 text-yellow-400',
      POOR: 'bg-orange-500/10 text-orange-400',
      DAMAGED: 'bg-red-500/10 text-red-400',
    }
    const labels = {
      NEW: 'Nuevo',
      GOOD: 'Bueno',
      FAIR: 'Regular',
      POOR: 'Malo',
      DAMAGED: 'Dañado',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[condition as keyof typeof styles] || 'bg-gray-500/10 text-gray-400'}`}>
        {labels[condition as keyof typeof labels] || condition}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 mt-4">Cargando producto...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">Producto no encontrado</p>
        <Link href="/dashboard/inventario/productos">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a productos
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/inventario/productos">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-gray-400 mt-1 flex items-center gap-2">
              <span className="font-mono">{product.sku}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  product.status === 'ACTIVE'
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-gray-500/10 text-gray-400'
                }`}
              >
                {product.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
              </span>
            </p>
          </div>
        </div>
        <Link href={`/dashboard/inventario/productos/${product.id}/editar`}>
          <Button variant="primary">
            <Edit className="w-4 h-4 mr-2" />
            Editar Producto
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-violet-400" />
                <h2 className="text-lg font-semibold">Información General</h2>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-gray-400">Categoría</label>
                  <p className="mt-1 flex items-center gap-2">
                    {product.category && (
                      <>
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: product.category.color || '#6b7280' }}
                        />
                        {product.category.name}
                      </>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Marca / Modelo</label>
                  <p className="mt-1">
                    {[product.brand, product.model].filter(Boolean).join(' - ') || '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Precio Unitario</label>
                  <p className="mt-1 font-semibold text-lg">
                    {formatPrice(product.unitPrice as number | null)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Precio Alquiler</label>
                  <p className="mt-1 font-semibold text-lg text-violet-400">
                    {formatPrice(product.rentalPrice as number | null)}
                  </p>
                </div>
              </div>

              {product.description && (
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <label className="text-sm text-gray-400">Descripción</label>
                  <p className="mt-2 text-gray-300">{product.description}</p>
                </div>
              )}

              {product.notes && (
                <div className="mt-4">
                  <label className="text-sm text-gray-400">Notas</label>
                  <p className="mt-2 text-gray-300">{product.notes}</p>
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Inventory Items */}
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-violet-400" />
                  <h2 className="text-lg font-semibold">Items en Inventario</h2>
                  <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-500/10 text-violet-400">
                    {product._count?.inventoryItems || 0}
                  </span>
                </div>
                <Link href={`/dashboard/inventario/items?productId=${product.id}`}>
                  <Button variant="outline" size="sm">
                    Ver todos
                  </Button>
                </Link>
              </div>
            </Card.Header>
            <Card.Content>
              {product.inventoryItems && product.inventoryItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <thead>
                      <tr>
                        <th>Serial / Asset Tag</th>
                        <th>Estado</th>
                        <th>Condición</th>
                        <th>Ubicación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.inventoryItems.map((item: {
                        id: string
                        serialNumber: string | null
                        assetTag: string | null
                        status: string
                        condition: string
                        location: string | null
                      }) => (
                        <tr key={item.id}>
                          <td>
                            <div>
                              <p className="font-mono text-sm">{item.serialNumber || '-'}</p>
                              {item.assetTag && (
                                <p className="text-xs text-gray-500">{item.assetTag}</p>
                              )}
                            </div>
                          </td>
                          <td>{getStatusBadge(item.status)}</td>
                          <td>{getConditionBadge(item.condition)}</td>
                          <td className="text-gray-400">{item.location || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Boxes className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No hay items registrados</p>
                  <Link href={`/dashboard/inventario/items/nuevo?productId=${product.id}`}>
                    <Button variant="outline" size="sm" className="mt-3">
                      Agregar item
                    </Button>
                  </Link>
                </div>
              )}
            </Card.Content>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Image */}
          {product.imageUrl && (
            <Card>
              <Card.Content className="p-4">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-lg"
                />
              </Card.Content>
            </Card>
          )}

          {/* Suppliers */}
          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-violet-400" />
                <h2 className="text-lg font-semibold">Proveedores</h2>
              </div>
            </Card.Header>
            <Card.Content>
              {product.suppliers && product.suppliers.length > 0 ? (
                <div className="space-y-3">
                  {product.suppliers.map((ps) => (
                    <div
                      key={ps.supplierId}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50"
                    >
                      <div>
                        <p className="font-medium">{ps.supplier.name}</p>
                        {ps.supplierSku && (
                          <p className="text-xs text-gray-400 font-mono">{ps.supplierSku}</p>
                        )}
                      </div>
                      <div className="text-right">
                        {ps.cost && (
                          <p className="text-sm font-semibold">{formatPrice(ps.cost)}</p>
                        )}
                        {ps.isPreferred && (
                          <span className="text-xs text-violet-400">Preferido</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Building2 className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Sin proveedores asignados</p>
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Metadata */}
          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-violet-400" />
                <h2 className="text-lg font-semibold">Detalles</h2>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Creado</span>
                  <span>{formatDate(product.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Actualizado</span>
                  <span>{formatDate(product.updatedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">ID</span>
                  <span className="font-mono text-xs text-gray-500">{product.id}</span>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  )
}
