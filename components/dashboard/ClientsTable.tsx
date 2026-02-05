'use client'

import Link from 'next/link'
import { Client } from '@/lib/validations/client'
import { Table } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Eye, Edit, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ClientsTableProps {
  clients: Client[]
  onDelete?: (id: string) => void
  showActions?: boolean
}

export function ClientsTable({ clients, onDelete, showActions = true }: ClientsTableProps) {
  if (clients.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No hay clientes registrados</p>
        <p className="text-sm text-gray-500 mt-2">
          Crea tu primer cliente para comenzar
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
            <th>Empresa</th>
            <th>Email</th>
            <th>Telefono</th>
            <th>Fecha de Registro</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id}>
              <td className="font-medium">{client.name}</td>
              <td>{client.company || '-'}</td>
              <td>{client.email}</td>
              <td>{client.phone || '-'}</td>
              <td>
                {format(new Date(client.createdAt), 'dd MMM yyyy', {
                  locale: es,
                })}
              </td>
              <td>
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/clientes/${client.id}`}>
                    <Button variant="ghost" size="sm" title="Ver detalles">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                  {showActions && (
                    <>
                      <Link href={`/dashboard/clientes/${client.id}/editar`}>
                        <Button variant="ghost" size="sm" title="Editar">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => {
                            if (
                              confirm(
                                '¿Estas seguro de que deseas eliminar este cliente?'
                              )
                            ) {
                              onDelete(client.id)
                            }
                          }}
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}
