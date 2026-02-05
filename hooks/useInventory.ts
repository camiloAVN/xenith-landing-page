'use client'

import { useCallback } from 'react'
import { useInventoryStore } from '@/store/inventoryStore'
import { InventoryItemFormData, CheckInOutFormData } from '@/lib/validations/inventory'
import toast from 'react-hot-toast'

export function useInventory() {
  const {
    items,
    currentItem,
    movements,
    summary,
    isLoading,
    error,
    filters,
    setItems,
    setCurrentItem,
    addItem,
    updateItem,
    removeItem,
    setMovements,
    setSummary,
    setLoading,
    setError,
    setFilters,
    resetFilters,
  } = useInventoryStore()

  const fetchItems = useCallback(async (options?: {
    search?: string
    status?: string
    type?: string
    productId?: string
    silent?: boolean
  }) => {
    setLoading(true)
    setError(null)

    try {
      const url = new URL('/api/inventory', window.location.origin)
      if (options?.search) url.searchParams.set('search', options.search)
      if (options?.status) url.searchParams.set('status', options.status)
      if (options?.type) url.searchParams.set('type', options.type)
      if (options?.productId) url.searchParams.set('productId', options.productId)

      const response = await fetch(url.toString())

      // Handle permission errors silently - just set empty array
      if (response.status === 401 || response.status === 403) {
        setItems([])
        return
      }

      if (!response.ok) {
        throw new Error('Error al obtener items de inventario')
      }

      const data = await response.json()
      setItems(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      if (!options?.silent) {
        toast.error(message)
      }
    } finally {
      setLoading(false)
    }
  }, [setItems, setLoading, setError])

  const fetchItem = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/inventory/${id}`)

      if (!response.ok) {
        throw new Error('Error al obtener item de inventario')
      }

      const data = await response.json()
      setCurrentItem(data)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [setCurrentItem, setLoading, setError])

  const createItem = useCallback(async (data: InventoryItemFormData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear item de inventario')
      }

      const newItem = await response.json()
      addItem(newItem)
      toast.success('Item creado exitosamente')
      return newItem
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [addItem, setLoading, setError])

  const editItem = useCallback(async (id: string, data: InventoryItemFormData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al actualizar item de inventario')
      }

      const updatedItem = await response.json()
      updateItem(id, updatedItem)
      toast.success('Item actualizado exitosamente')
      return updatedItem
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [updateItem, setLoading, setError])

  const deleteItem = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al eliminar item de inventario')
      }

      removeItem(id)
      toast.success('Item eliminado exitosamente')
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      toast.error(message)
      return false
    } finally {
      setLoading(false)
    }
  }, [removeItem, setLoading, setError])

  const checkIn = useCallback(async (id: string, data?: CheckInOutFormData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/inventory/${id}/check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data || {}),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al registrar entrada')
      }

      const updatedItem = await response.json()
      updateItem(id, updatedItem)
      toast.success('Entrada registrada exitosamente')
      return updatedItem
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [updateItem, setLoading, setError])

  const checkOut = useCallback(async (id: string, data?: CheckInOutFormData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/inventory/${id}/check-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data || {}),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al registrar salida')
      }

      const updatedItem = await response.json()
      updateItem(id, updatedItem)
      toast.success('Salida registrada exitosamente')
      return updatedItem
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [updateItem, setLoading, setError])

  const fetchSummary = useCallback(async (options?: { silent?: boolean }) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/inventory/summary')

      // Handle permission errors silently - just set null summary
      if (response.status === 401 || response.status === 403) {
        setSummary(null)
        return null
      }

      if (!response.ok) {
        throw new Error('Error al obtener resumen de inventario')
      }

      const data = await response.json()
      setSummary(data)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      if (!options?.silent) {
        toast.error(message)
      }
      return null
    } finally {
      setLoading(false)
    }
  }, [setSummary, setLoading, setError])

  const fetchMovements = useCallback(async (options?: {
    type?: string
    inventoryItemId?: string
    limit?: number
    offset?: number
    silent?: boolean
  }) => {
    setLoading(true)
    setError(null)

    try {
      const url = new URL('/api/inventory/movements', window.location.origin)
      if (options?.type) url.searchParams.set('type', options.type)
      if (options?.inventoryItemId) url.searchParams.set('inventoryItemId', options.inventoryItemId)
      if (options?.limit) url.searchParams.set('limit', options.limit.toString())
      if (options?.offset) url.searchParams.set('offset', options.offset.toString())

      const response = await fetch(url.toString())

      // Handle permission errors silently - just set empty array
      if (response.status === 401 || response.status === 403) {
        setMovements([])
        return { movements: [], total: 0 }
      }

      if (!response.ok) {
        throw new Error('Error al obtener movimientos')
      }

      const data = await response.json()
      setMovements(data.movements)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      if (!options?.silent) {
        toast.error(message)
      }
      return null
    } finally {
      setLoading(false)
    }
  }, [setMovements, setLoading, setError])

  return {
    items,
    currentItem,
    movements,
    summary,
    isLoading,
    error,
    filters,
    setFilters,
    resetFilters,
    fetchItems,
    fetchItem,
    createItem,
    editItem,
    deleteItem,
    checkIn,
    checkOut,
    fetchSummary,
    fetchMovements,
  }
}
