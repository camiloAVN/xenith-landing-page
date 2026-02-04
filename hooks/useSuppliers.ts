'use client'

import { useCallback } from 'react'
import { useSupplierStore } from '@/store/supplierStore'
import { SupplierFormData, Supplier } from '@/lib/validations/supplier'
import toast from 'react-hot-toast'

export function useSuppliers() {
  const {
    suppliers,
    currentSupplier,
    isLoading,
    error,
    searchQuery,
    setSuppliers,
    setCurrentSupplier,
    addSupplier,
    updateSupplier,
    removeSupplier,
    setLoading,
    setError,
    setSearchQuery,
  } = useSupplierStore()

  const fetchSuppliers = useCallback(async (search?: string) => {
    setLoading(true)
    setError(null)

    try {
      const url = new URL('/api/suppliers', window.location.origin)
      if (search) {
        url.searchParams.set('search', search)
      }

      const response = await fetch(url.toString())

      if (!response.ok) {
        throw new Error('Error al obtener proveedores')
      }

      const data = await response.json()
      setSuppliers(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [setSuppliers, setLoading, setError])

  const fetchSupplier = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/suppliers/${id}`)

      if (!response.ok) {
        throw new Error('Error al obtener proveedor')
      }

      const data = await response.json()
      setCurrentSupplier(data)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [setCurrentSupplier, setLoading, setError])

  const createSupplier = useCallback(async (data: SupplierFormData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/suppliers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear proveedor')
      }

      const newSupplier = await response.json()
      addSupplier(newSupplier)
      toast.success('Proveedor creado exitosamente')
      return newSupplier
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [addSupplier, setLoading, setError])

  const editSupplier = useCallback(async (id: string, data: SupplierFormData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/suppliers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al actualizar proveedor')
      }

      const updatedSupplier = await response.json()
      updateSupplier(id, updatedSupplier)
      toast.success('Proveedor actualizado exitosamente')
      return updatedSupplier
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [updateSupplier, setLoading, setError])

  const deleteSupplier = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/suppliers/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al eliminar proveedor')
      }

      removeSupplier(id)
      toast.success('Proveedor eliminado exitosamente')
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      toast.error(message)
      return false
    } finally {
      setLoading(false)
    }
  }, [removeSupplier, setLoading, setError])

  return {
    suppliers,
    currentSupplier,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    fetchSuppliers,
    fetchSupplier,
    createSupplier,
    editSupplier,
    deleteSupplier,
  }
}
