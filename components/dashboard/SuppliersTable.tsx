'use client'

import Link from 'next/link'
import { Supplier } from '@/lib/validations/supplier'
import { Table } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Eye, Edit, Trash2, Truck, Mail, Phone } from 'lucide-react'

interface SuppliersTableProps {
  suppliers: Supplier[]
  onDelete: (id: string) => void
}

export function SuppliersTable({ suppliers, onDelete }: SuppliersTableProps) {
  if (suppliers.length === 0) {
    return (
      <div className="text-center py-12">
        <Truck className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">No hay proveedores registrados</p>
        <p className="text-sm text-gray-500 mt-2">
          Agrega tu primer proveedor para comenzar
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Contacto</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Ciudad</th>
            <th>Productos</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((supplier) => (
            <tr key={supplier.id}>
              <td className="font-medium">{supplier.name}</td>
              <td className="text-gray-400">{supplier.contactName || '-'}</td>
              <td>
                {supplier.email ? (
                  <a
                    href={`mailto:${supplier.email}`}
                    className="text-violet-400 hover:text-violet-300 flex items-center gap-1"
                  >
                    <Mail className="w-3 h-3" />
                    {supplier.email}
                  </a>
                ) : (
                  <span className="text-gray-500">-</span>
                )}
              </td>
              <td>
                {supplier.phone ? (
                  <a
                    href={`tel:${supplier.phone}`}
                    className="text-gray-300 flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" />
                    {supplier.phone}
                  </a>
                ) : (
                  <span className="text-gray-500">-</span>
                )}
              </td>
              <td className="text-gray-400">{supplier.city || '-'}</td>
              <td>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-800">
                  {supplier._count?.products || 0}
                </span>
              </td>
              <td>
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/proveedores/${supplier.id}`}>
                    <Button variant="ghost" size="sm" title="Ver detalles">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href={`/dashboard/proveedores/${supplier.id}/editar`}>
                    <Button variant="ghost" size="sm" title="Editar">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => {
                      if (confirm('¿Estás seguro de que deseas eliminar este proveedor?')) {
                        onDelete(supplier.id)
                      }
                    }}
                    title="Eliminar"
                    disabled={(supplier._count?.products || 0) > 0}
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
