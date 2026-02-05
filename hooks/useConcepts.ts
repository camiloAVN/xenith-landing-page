'use client'

import { useCallback } from 'react'
import { useConceptStore } from '@/store/conceptStore'
import { ConceptFormData } from '@/lib/validations/concept'
import toast from 'react-hot-toast'

export function useConcepts() {
  const {
    concepts,
    currentConcept,
    isLoading,
    error,
    filters,
    setConcepts,
    setCurrentConcept,
    addConcept,
    updateConcept,
    removeConcept,
    setLoading,
    setError,
    setFilters,
    resetFilters,
  } = useConceptStore()

  const fetchConcepts = useCallback(async (options?: {
    search?: string
    category?: string
    supplierId?: string
    isActive?: string
    silent?: boolean
  }) => {
    setLoading(true)
    setError(null)

    try {
      const url = new URL('/api/concepts', window.location.origin)
      if (options?.search) url.searchParams.set('search', options.search)
      if (options?.category) url.searchParams.set('category', options.category)
      if (options?.supplierId) url.searchParams.set('supplierId', options.supplierId)
      if (options?.isActive) url.searchParams.set('isActive', options.isActive)

      const response = await fetch(url.toString())

      // Handle permission errors silently - just set empty array
      if (response.status === 401 || response.status === 403) {
        setConcepts([])
        return
      }

      if (!response.ok) {
        throw new Error('Error al obtener conceptos')
      }

      const data = await response.json()
      setConcepts(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      if (!options?.silent) {
        toast.error(message)
      }
    } finally {
      setLoading(false)
    }
  }, [setConcepts, setLoading, setError])

  const fetchConcept = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/concepts/${id}`)

      if (!response.ok) {
        throw new Error('Error al obtener concepto')
      }

      const data = await response.json()
      setCurrentConcept(data)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [setCurrentConcept, setLoading, setError])

  const createConcept = useCallback(async (data: ConceptFormData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/concepts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear concepto')
      }

      const newConcept = await response.json()
      addConcept(newConcept)
      toast.success('Concepto creado exitosamente')
      return newConcept
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [addConcept, setLoading, setError])

  const editConcept = useCallback(async (id: string, data: ConceptFormData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/concepts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al actualizar concepto')
      }

      const updatedConcept = await response.json()
      updateConcept(id, updatedConcept)
      toast.success('Concepto actualizado exitosamente')
      return updatedConcept
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [updateConcept, setLoading, setError])

  const deleteConcept = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/concepts/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al eliminar concepto')
      }

      removeConcept(id)
      toast.success('Concepto eliminado exitosamente')
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      toast.error(message)
      return false
    } finally {
      setLoading(false)
    }
  }, [removeConcept, setLoading, setError])

  return {
    concepts,
    currentConcept,
    isLoading,
    error,
    filters,
    setFilters,
    resetFilters,
    fetchConcepts,
    fetchConcept,
    createConcept,
    editConcept,
    deleteConcept,
  }
}
