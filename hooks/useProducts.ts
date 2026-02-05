'use client'

import { useCallback } from 'react'
import { useProductStore } from '@/store/productStore'
import { ProductFormData, Product, ProductSupplierFormData } from '@/lib/validations/product'
import toast from 'react-hot-toast'

export function useProducts() {
  const {
    products,
    currentProduct,
    isLoading,
    error,
    filters,
    setProducts,
    setCurrentProduct,
    addProduct,
    updateProduct,
    removeProduct,
    setLoading,
    setError,
    setFilters,
    resetFilters,
  } = useProductStore()

  const fetchProducts = useCallback(async (options?: {
    search?: string
    categoryId?: string
    status?: string
    silent?: boolean
  }) => {
    setLoading(true)
    setError(null)

    try {
      const url = new URL('/api/products', window.location.origin)
      if (options?.search) url.searchParams.set('search', options.search)
      if (options?.categoryId) url.searchParams.set('category', options.categoryId)
      if (options?.status) url.searchParams.set('status', options.status)

      const response = await fetch(url.toString())

      // Handle permission errors silently - just set empty array
      if (response.status === 401 || response.status === 403) {
        setProducts([])
        return
      }

      if (!response.ok) {
        throw new Error('Error al obtener productos')
      }

      const data = await response.json()
      setProducts(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      if (!options?.silent) {
        toast.error(message)
      }
    } finally {
      setLoading(false)
    }
  }, [setProducts, setLoading, setError])

  const fetchProduct = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/products/${id}`)

      if (!response.ok) {
        throw new Error('Error al obtener producto')
      }

      const data = await response.json()
      setCurrentProduct(data)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [setCurrentProduct, setLoading, setError])

  const createProduct = useCallback(async (data: ProductFormData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear producto')
      }

      const newProduct = await response.json()
      addProduct(newProduct)
      toast.success('Producto creado exitosamente')
      return newProduct
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [addProduct, setLoading, setError])

  const editProduct = useCallback(async (id: string, data: ProductFormData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al actualizar producto')
      }

      const updatedProduct = await response.json()
      updateProduct(id, updatedProduct)
      toast.success('Producto actualizado exitosamente')
      return updatedProduct
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [updateProduct, setLoading, setError])

  const deleteProduct = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al eliminar producto')
      }

      removeProduct(id)
      toast.success('Producto eliminado exitosamente')
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      toast.error(message)
      return false
    } finally {
      setLoading(false)
    }
  }, [removeProduct, setLoading, setError])

  const addSupplierToProduct = useCallback(async (productId: string, data: ProductSupplierFormData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/products/${productId}/suppliers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al agregar proveedor')
      }

      const result = await response.json()
      toast.success('Proveedor agregado exitosamente')
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError])

  const removeSupplierFromProduct = useCallback(async (productId: string, supplierId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/products/${productId}/suppliers/${supplierId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al eliminar proveedor')
      }

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
  }, [setLoading, setError])

  return {
    products,
    currentProduct,
    isLoading,
    error,
    filters,
    setFilters,
    resetFilters,
    fetchProducts,
    fetchProduct,
    createProduct,
    editProduct,
    deleteProduct,
    addSupplierToProduct,
    removeSupplierFromProduct,
  }
}
