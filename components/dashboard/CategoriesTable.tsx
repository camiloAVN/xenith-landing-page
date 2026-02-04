'use client'

import { Category } from '@/lib/validations/category'
import { Table } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Edit, Trash2, FolderTree } from 'lucide-react'

interface CategoriesTableProps {
  categories: Category[]
  onDelete: (id: string) => void
  onEdit: (category: Category) => void
}

export function CategoriesTable({ categories, onDelete, onEdit }: CategoriesTableProps) {
  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <FolderTree className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">No hay categorías registradas</p>
        <p className="text-sm text-gray-500 mt-2">
          Crea tu primera categoría para organizar tus productos
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <thead>
          <tr>
            <th>Color</th>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Productos</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.id}>
              <td>
                <div
                  className="w-6 h-6 rounded-full border-2 border-gray-700"
                  style={{ backgroundColor: category.color || '#6b7280' }}
                />
              </td>
              <td className="font-medium">{category.name}</td>
              <td className="text-gray-400">{category.description || '-'}</td>
              <td>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-800">
                  {category._count?.products || 0}
                </span>
              </td>
              <td>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(category)}
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => {
                      if (confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
                        onDelete(category.id)
                      }
                    }}
                    title="Eliminar"
                    disabled={(category._count?.products || 0) > 0}
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
