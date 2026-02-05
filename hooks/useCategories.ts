'use client'

import { useCallback } from 'react'
import { useCategoryStore } from '@/store/categoryStore'
import { CategoryFormData, Category } from '@/lib/validations/category'
import toast from 'react-hot-toast'

export function useCategories() {
  const {
    categories,
    currentCategory,
    isLoading,
    error,
    searchQuery,
    setCategories,
    setCurrentCategory,
    addCategory,
    updateCategory,
    removeCategory,
    setLoading,
    setError,
    setSearchQuery,
  } = useCategoryStore()

  const fetchCategories = useCallback(async (search?: string, options?: { silent?: boolean }) => {
    setLoading(true)
    setError(null)

    try {
      const url = new URL('/api/categories', window.location.origin)
      if (search) {
        url.searchParams.set('search', search)
      }

      const response = await fetch(url.toString())

      // Handle permission errors silently - just set empty array
      if (response.status === 401 || response.status === 403) {
        setCategories([])
        return
      }

      if (!response.ok) {
        throw new Error('Error al obtener categorías')
      }

      const data = await response.json()
      setCategories(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      if (!options?.silent) {
        toast.error(message)
      }
    } finally {
      setLoading(false)
    }
  }, [setCategories, setLoading, setError])

  const fetchCategory = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/categories/${id}`)

      if (!response.ok) {
        throw new Error('Error al obtener categoría')
      }

      const data = await response.json()
      setCurrentCategory(data)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [setCurrentCategory, setLoading, setError])

  const createCategory = useCallback(async (data: CategoryFormData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear categoría')
      }

      const newCategory = await response.json()
      addCategory(newCategory)
      toast.success('Categoría creada exitosamente')
      return newCategory
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [addCategory, setLoading, setError])

  const editCategory = useCallback(async (id: string, data: CategoryFormData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al actualizar categoría')
      }

      const updatedCategory = await response.json()
      updateCategory(id, updatedCategory)
      toast.success('Categoría actualizada exitosamente')
      return updatedCategory
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [updateCategory, setLoading, setError])

  const deleteCategory = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al eliminar categoría')
      }

      removeCategory(id)
      toast.success('Categoría eliminada exitosamente')
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      toast.error(message)
      return false
    } finally {
      setLoading(false)
    }
  }, [removeCategory, setLoading, setError])

  return {
    categories,
    currentCategory,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    fetchCategories,
    fetchCategory,
    createCategory,
    editCategory,
    deleteCategory,
  }
}
