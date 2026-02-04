'use client'

import { useEffect, useState } from 'react'
import { useInventory } from '@/hooks/useInventory'
import { MovementsTable } from '@/components/dashboard/inventory/MovementsTable'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Search } from 'lucide-react'

export default function MovementsPage() {
  const { movements, isLoading, fetchMovements } = useInventory()
  const [typeFilter, setTypeFilter] = useState('')

  useEffect(() => {
    fetchMovements({ type: typeFilter || undefined })
  }, [fetchMovements, typeFilter])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Movimientos de Inventario</h1>
        <p className="text-gray-400 mt-1">
          Historial de entradas, salidas y ajustes
        </p>
      </div>

      <Card>
        <Card.Header>
          <div className="flex gap-4">
            <select
              className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">Todos los tipos</option>
              <option value="CHECK_IN">Entrada</option>
              <option value="CHECK_OUT">Salida</option>
              <option value="ADJUSTMENT">Ajuste</option>
              <option value="ENROLLMENT">Registro</option>
              <option value="TRANSFER">Transferencia</option>
            </select>
          </div>
        </Card.Header>
        <Card.Content>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 mt-4">Cargando movimientos...</p>
            </div>
          ) : (
            <MovementsTable movements={movements} />
          )}
        </Card.Content>
      </Card>
    </div>
  )
}
