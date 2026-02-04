'use client'

import Link from 'next/link'
import { RfidTag } from '@/lib/validations/rfid'
import { Table } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Eye, Trash2, Radio, Link as LinkIcon } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface RfidTagsTableProps {
  tags: RfidTag[]
  onDelete: (id: string) => void
}

const statusConfig = {
  ENROLLED: { label: 'Vinculado', className: 'bg-green-500/10 text-green-400' },
  UNASSIGNED: { label: 'Sin Vincular', className: 'bg-amber-500/10 text-amber-400' },
  UNKNOWN: { label: 'Desconocido', className: 'bg-red-500/10 text-red-400' },
}

export function RfidTagsTable({ tags, onDelete }: RfidTagsTableProps) {
  if (tags.length === 0) {
    return (
      <div className="text-center py-12">
        <Radio className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">No hay tags RFID registrados</p>
        <p className="text-sm text-gray-500 mt-2">
          Los tags se crearán automáticamente al ser detectados
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <thead>
          <tr>
            <th>EPC</th>
            <th>Estado</th>
            <th>Item Vinculado</th>
            <th>Última Detección</th>
            <th>Detecciones</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {tags.map((tag) => (
            <tr key={tag.id}>
              <td className="font-mono text-sm">{tag.epc}</td>
              <td>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[tag.status].className}`}>
                  {statusConfig[tag.status].label}
                </span>
              </td>
              <td>
                {tag.inventoryItem ? (
                  <Link
                    href={`/dashboard/inventario/items/${tag.inventoryItem.id}`}
                    className="text-violet-400 hover:text-violet-300 flex items-center gap-1"
                  >
                    <LinkIcon className="w-3 h-3" />
                    {tag.inventoryItem.assetTag || tag.inventoryItem.serialNumber || tag.inventoryItem.product?.name}
                  </Link>
                ) : (
                  <span className="text-gray-500">-</span>
                )}
              </td>
              <td className="text-gray-400">
                {format(new Date(tag.lastSeenAt), 'dd MMM yyyy HH:mm', { locale: es })}
              </td>
              <td>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-800">
                  {tag._count?.detections || 0}
                </span>
              </td>
              <td>
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/inventario/rfid/${tag.id}`}>
                    <Button variant="ghost" size="sm" title="Ver detalles">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => {
                      if (confirm('¿Estás seguro de que deseas eliminar este tag?')) {
                        onDelete(tag.id)
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
