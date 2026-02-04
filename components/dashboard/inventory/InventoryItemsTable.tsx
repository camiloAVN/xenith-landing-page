'use client'

import Link from 'next/link'
import { InventoryItem } from '@/lib/validations/inventory'
import { Table } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Eye, Edit, Trash2, ArrowDownToLine, ArrowUpFromLine, Tags } from 'lucide-react'

interface InventoryItemsTableProps {
  items: InventoryItem[]
  onDelete: (id: string) => void
  onCheckIn?: (id: string) => void
  onCheckOut?: (id: string) => void
}

const statusConfig = {
  IN: { label: 'En Bodega', className: 'bg-green-500/10 text-green-400' },
  OUT: { label: 'Afuera', className: 'bg-blue-500/10 text-blue-400' },
  MAINTENANCE: { label: 'Mantenimiento', className: 'bg-amber-500/10 text-amber-400' },
  LOST: { label: 'Perdido', className: 'bg-red-500/10 text-red-400' },
}

const typeConfig = {
  UNIT: { label: 'Unidad', className: 'bg-violet-500/10 text-violet-400' },
  CONTAINER: { label: 'Contenedor', className: 'bg-cyan-500/10 text-cyan-400' },
  BULK: { label: 'Bulk', className: 'bg-gray-500/10 text-gray-400' },
}

export function InventoryItemsTable({ items, onDelete, onCheckIn, onCheckOut }: InventoryItemsTableProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <Tags className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">No hay items de inventario</p>
        <p className="text-sm text-gray-500 mt-2">
          Agrega tu primer item para comenzar
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <thead>
          <tr>
            <th>ID / Serie</th>
            <th>Producto</th>
            <th>Tipo</th>
            <th>Estado</th>
            <th>Ubicación</th>
            <th>RFID</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <div>
                  <span className="font-mono text-sm font-medium">
                    {item.assetTag || item.serialNumber || item.id.slice(-8)}
                  </span>
                  {item.serialNumber && item.assetTag && (
                    <p className="text-xs text-gray-500">{item.serialNumber}</p>
                  )}
                </div>
              </td>
              <td>
                <div>
                  <span className="font-medium">{item.product?.name || 'N/A'}</span>
                  {item.product?.brand && (
                    <p className="text-xs text-gray-500">
                      {[item.product.brand, item.product.model].filter(Boolean).join(' ')}
                    </p>
                  )}
                </div>
              </td>
              <td>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeConfig[item.type].className}`}>
                  {typeConfig[item.type].label}
                </span>
              </td>
              <td>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[item.status].className}`}>
                  {statusConfig[item.status].label}
                </span>
              </td>
              <td className="text-gray-400">{item.location || '-'}</td>
              <td>
                {item.rfidTag ? (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
                    Vinculado
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400">
                    Sin Tag
                  </span>
                )}
              </td>
              <td>
                <div className="flex items-center gap-1">
                  {item.status !== 'IN' && onCheckIn && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                      onClick={() => onCheckIn(item.id)}
                      title="Check In"
                    >
                      <ArrowDownToLine className="w-4 h-4" />
                    </Button>
                  )}
                  {item.status === 'IN' && onCheckOut && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                      onClick={() => onCheckOut(item.id)}
                      title="Check Out"
                    >
                      <ArrowUpFromLine className="w-4 h-4" />
                    </Button>
                  )}
                  <Link href={`/dashboard/inventario/items/${item.id}`}>
                    <Button variant="ghost" size="sm" title="Ver detalles">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href={`/dashboard/inventario/items/${item.id}/editar`}>
                    <Button variant="ghost" size="sm" title="Editar">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => {
                      if (confirm('¿Estás seguro de que deseas eliminar este item?')) {
                        onDelete(item.id)
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
