'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  Package,
  Boxes,
  Tags,
  Radio,
  ArrowRightLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
} from 'lucide-react'
import { useInventory } from '@/hooks/useInventory'

export default function InventarioDashboardPage() {
  const { summary, fetchSummary, isLoading } = useInventory()

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  const statusItems = [
    { label: 'En Bodega', key: 'IN', color: 'bg-green-500', icon: CheckCircle2 },
    { label: 'Afuera', key: 'OUT', color: 'bg-blue-500', icon: ArrowRightLeft },
    { label: 'Mantenimiento', key: 'MAINTENANCE', color: 'bg-amber-500', icon: Clock },
    { label: 'Perdido', key: 'LOST', color: 'bg-red-500', icon: XCircle },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Control de <span className="text-gradient">Inventario</span>
          </h1>
          <p className="text-gray-400">
            Gestiona tus equipos audiovisuales y rastrea su ubicación
          </p>
        </div>
        <Link href="/dashboard/inventario/items/nuevo">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Item
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Items"
          value={summary?.total || 0}
          icon={Package}
          iconColor="text-violet-400"
          iconBgColor="bg-violet-500/10"
        />

        <StatsCard
          title="En Bodega"
          value={summary?.byStatus?.IN || 0}
          icon={CheckCircle2}
          iconColor="text-green-400"
          iconBgColor="bg-green-500/10"
        />

        <StatsCard
          title="Alquilados"
          value={summary?.byStatus?.OUT || 0}
          icon={ArrowRightLeft}
          iconColor="text-blue-400"
          iconBgColor="bg-blue-500/10"
        />

        <StatsCard
          title="Mantenimiento"
          value={summary?.byStatus?.MAINTENANCE || 0}
          icon={Clock}
          iconColor="text-amber-400"
          iconBgColor="bg-amber-500/10"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Distribution */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle>Distribución por Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statusItems.map((status) => {
                  const count = summary?.byStatus?.[status.key as keyof typeof summary.byStatus] || 0
                  const total = summary?.total || 1
                  const percentage = Math.round((count / total) * 100)
                  return (
                    <div key={status.key}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <status.icon className={`w-4 h-4 ${status.color.replace('bg-', 'text-').replace('-500', '-400')}`} />
                          <span className="text-sm font-medium text-gray-300">
                            {status.label}
                          </span>
                        </div>
                        <span className="text-sm text-gray-400">{count} items</span>
                      </div>
                      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${status.color} transition-all duration-300`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Movements */}
          <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Movimientos Recientes</CardTitle>
              <Link href="/dashboard/inventario/movimientos">
                <Button variant="ghost" size="sm">Ver todos</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {summary?.recentMovements && summary.recentMovements.length > 0 ? (
                <div className="space-y-3">
                  {summary.recentMovements.slice(0, 5).map((movement: {
                    id: string
                    type: string
                    createdAt: string
                    inventoryItem?: {
                      product?: { name: string }
                      serialNumber?: string | null
                      assetTag?: string | null
                    }
                    user?: { name?: string | null }
                  }) => (
                    <div
                      key={movement.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          movement.type === 'CHECK_IN' ? 'bg-green-500/10' :
                          movement.type === 'CHECK_OUT' ? 'bg-blue-500/10' :
                          'bg-gray-500/10'
                        }`}>
                          <ArrowRightLeft className={`w-4 h-4 ${
                            movement.type === 'CHECK_IN' ? 'text-green-400' :
                            movement.type === 'CHECK_OUT' ? 'text-blue-400' :
                            'text-gray-400'
                          }`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-200">
                            {movement.inventoryItem?.product?.name || 'Item'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {movement.inventoryItem?.serialNumber || movement.inventoryItem?.assetTag || 'Sin ID'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-medium ${
                          movement.type === 'CHECK_IN' ? 'text-green-400' :
                          movement.type === 'CHECK_OUT' ? 'text-blue-400' :
                          'text-gray-400'
                        }`}>
                          {movement.type === 'CHECK_IN' ? 'Entrada' :
                           movement.type === 'CHECK_OUT' ? 'Salida' :
                           movement.type}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(movement.createdAt).toLocaleDateString('es-CO')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 py-4">
                  No hay movimientos recientes
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href="/dashboard/inventario/productos/nuevo" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Boxes className="w-4 h-4 mr-2" />
                    Nuevo Producto
                  </Button>
                </Link>
                <Link href="/dashboard/inventario/items/nuevo" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Tags className="w-4 h-4 mr-2" />
                    Nuevo Item
                  </Button>
                </Link>
                <Link href="/dashboard/inventario/rfid" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Radio className="w-4 h-4 mr-2" />
                    Gestionar RFID
                  </Button>
                </Link>
                <Link href="/dashboard/categorias" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Package className="w-4 h-4 mr-2" />
                    Categorías
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Categories Distribution */}
          {summary?.byCategory && summary.byCategory.length > 0 && (
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Por Categoría</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summary.byCategory.map((cat: { name: string; color: string | null; count: number }) => (
                    <div key={cat.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color || '#6b7280' }}
                        />
                        <span className="text-sm text-gray-300">{cat.name}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-400">{cat.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Alerts */}
          {(summary?.byStatus?.LOST || 0) > 0 && (
            <Card variant="glass" className="border-red-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-400">Items Perdidos</p>
                    <p className="text-2xl font-bold text-red-400">{summary?.byStatus?.LOST}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
