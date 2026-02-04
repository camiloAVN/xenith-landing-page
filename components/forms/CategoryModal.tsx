'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { categorySchema, CategoryFormData, Category } from '@/lib/validations/category'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: CategoryFormData) => void
  category?: Category | null
}

export function CategoryModal({ isOpen, onClose, onSave, category }: CategoryModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
      color: '#6366f1',
      icon: '',
    },
  })

  const colorValue = watch('color')

  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        description: category.description || '',
        color: category.color || '#6366f1',
        icon: category.icon || '',
      })
    } else {
      reset({
        name: '',
        description: '',
        color: '#6366f1',
        icon: '',
      })
    }
  }, [category, reset])

  const onSubmit = (data: CategoryFormData) => {
    onSave(data)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={category ? 'Editar Categoría' : 'Nueva Categoría'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nombre"
          placeholder="Audio, Video, Iluminación..."
          {...register('name')}
          error={errors.name?.message}
        />

        <Input
          label="Descripción"
          placeholder="Descripción opcional..."
          {...register('description')}
          error={errors.description?.message}
        />

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Color
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              className="w-10 h-10 rounded-lg border-2 border-gray-700 cursor-pointer"
              value={colorValue || '#6366f1'}
              onChange={(e) => setValue('color', e.target.value)}
            />
            <Input
              placeholder="#6366f1"
              className="flex-1"
              value={colorValue || ''}
              onChange={(e) => setValue('color', e.target.value)}
              error={errors.color?.message}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : category ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
