'use client'

import { useEffect, useState } from 'react'
import { useCategories } from '@/hooks/useCategories'
import { CategoriesTable } from '@/components/dashboard/CategoriesTable'
import { CategoryModal } from '@/components/forms/CategoryModal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Plus, Search } from 'lucide-react'
import { Category } from '@/lib/validations/category'

export default function CategoriesPage() {
  const { categories, isLoading, searchQuery, setSearchQuery, fetchCategories, createCategory, editCategory, deleteCategory } = useCategories()
  const [localSearch, setLocalSearch] = useState(searchQuery)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  useEffect(() => {
    fetchCategories(searchQuery)
  }, [fetchCategories, searchQuery])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearchQuery(localSearch)
  }

  const handleDelete = async (id: string) => {
    const success = await deleteCategory(id)
    if (success) {
      fetchCategories(searchQuery)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCategory(null)
  }

  const handleSave = async (data: { name: string; description?: string; color?: string; icon?: string }) => {
    if (editingCategory) {
      const result = await editCategory(editingCategory.id, data)
      if (result) {
        handleCloseModal()
        fetchCategories(searchQuery)
      }
    } else {
      const result = await createCategory(data)
      if (result) {
        handleCloseModal()
        fetchCategories(searchQuery)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Categorías</h1>
          <p className="text-gray-400 mt-1">
            Organiza tus productos por categorías
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Categoría
        </Button>
      </div>

      <Card>
        <Card.Header>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nombre..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <Button type="submit" variant="outline">
              Buscar
            </Button>
          </form>
        </Card.Header>
        <Card.Content>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 mt-4">Cargando categorías...</p>
            </div>
          ) : (
            <CategoriesTable categories={categories} onDelete={handleDelete} onEdit={handleEdit} />
          )}
        </Card.Content>
      </Card>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        category={editingCategory}
      />
    </div>
  )
}
