'use client'

import Link from 'next/link'
import { InventoryMovement } from '@/lib/validations/inventory'
import { Table } from '@/components/ui/Table'
import { ArrowRightLeft, ArrowDownToLine, ArrowUpFromLine, Settings, Plus, Repeat } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface MovementsTableProps {
  movements: InventoryMovement[]
}

const typeConfig = {
  CHECK_IN: { label: 'Entrada', icon: ArrowDownToLine, className: 'bg-green-500/10 text-green-400' },
  CHECK_OUT: { label: 'Salida', icon: ArrowUpFromLine, className: 'bg-blue-500/10 text-blue-400' },
  ADJUSTMENT: { label: 'Ajuste', icon: Settings, className: 'bg-amber-500/10 text-amber-400' },
  ENROLLMENT: { label: 'Registro', icon: Plus, className: 'bg-violet-500/10 text-violet-400' },
  TRANSFER: { label: 'Transferencia', icon: Repeat, className: 'bg-cyan-500/10 text-cyan-400' },
}

const statusLabels: Record<string, string> = {
  IN: 'En Bodega',
  OUT: 'Afuera',
  MAINTENANCE: 'Mantenimiento',
  LOST: 'Perdido',
}

export function MovementsTable({ movements }: MovementsTableProps) {
  if (movements.length === 0) {
    return (
      <div className="text-center py-12">
        <ArrowRightLeft className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">No hay movimientos registrados</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Item</th>
            <th>Cambio de Estado</th>
            <th>Ubicación</th>
            <th>Usuario</th>
            <th>Razón</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((movement) => {
            const config = typeConfig[movement.type as keyof typeof typeConfig] || typeConfig.ADJUSTMENT
            const Icon = config.icon
            return (
              <tr key={movement.id}>
                <td className="text-gray-400">
                  {format(new Date(movement.createdAt), 'dd MMM yyyy HH:mm', { locale: es })}
                </td>
                <td>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
                    <Icon className="w-3 h-3" />
                    {config.label}
                  </span>
                </td>
                <td>
                  {movement.inventoryItem ? (
                    <Link
                      href={`/dashboard/inventario/items/${movement.inventoryItem.id}`}
                      className="text-violet-400 hover:text-violet-300"
                    >
                      <div>
                        <span className="font-medium">
                          {movement.inventoryItem.assetTag || movement.inventoryItem.serialNumber || 'Item'}
                        </span>
                        {movement.inventoryItem.product && (
                          <p className="text-xs text-gray-500">{movement.inventoryItem.product.name}</p>
                        )}
                      </div>
                    </Link>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </td>
                <td>
                  <div className="flex items-center gap-2 text-sm">
                    {movement.fromStatus && (
                      <>
                        <span className="text-gray-500">{statusLabels[movement.fromStatus] || movement.fromStatus}</span>
                        <span className="text-gray-600">→</span>
                      </>
                    )}
                    <span className="text-gray-300">{statusLabels[movement.toStatus] || movement.toStatus}</span>
                  </div>
                </td>
                <td>
                  <div className="text-sm">
                    {movement.fromLocation && (
                      <span className="text-gray-500">{movement.fromLocation} → </span>
                    )}
                    <span className="text-gray-300">{movement.toLocation || '-'}</span>
                  </div>
                </td>
                <td className="text-gray-400">
                  {movement.user?.name || movement.user?.email || '-'}
                </td>
                <td className="text-gray-400 text-sm max-w-xs truncate">
                  {movement.reason || '-'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </Table>
    </div>
  )
}
