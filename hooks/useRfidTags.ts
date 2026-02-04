'use client'

import { useCallback } from 'react'
import { useRfidStore } from '@/store/rfidStore'
import { RfidTagFormData, RfidEnrollmentFormData } from '@/lib/validations/rfid'
import toast from 'react-hot-toast'

export function useRfidTags() {
  const {
    tags,
    unknownTags,
    currentTag,
    detections,
    isLoading,
    error,
    filters,
    setTags,
    setUnknownTags,
    setCurrentTag,
    addTag,
    updateTag,
    removeTag,
    setDetections,
    setLoading,
    setError,
    setFilters,
    resetFilters,
  } = useRfidStore()

  const fetchTags = useCallback(async (options?: {
    search?: string
    status?: string
  }) => {
    setLoading(true)
    setError(null)

    try {
      const url = new URL('/api/rfid/tags', window.location.origin)
      if (options?.search) url.searchParams.set('search', options.search)
      if (options?.status) url.searchParams.set('status', options.status)

      const response = await fetch(url.toString())

      if (!response.ok) {
        throw new Error('Error al obtener tags RFID')
      }

      const data = await response.json()
      setTags(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [setTags, setLoading, setError])

  const fetchUnknownTags = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/rfid/tags/unknown')

      if (!response.ok) {
        throw new Error('Error al obtener tags desconocidos')
      }

      const data = await response.json()
      setUnknownTags(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [setUnknownTags, setLoading, setError])

  const fetchTag = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/rfid/tags/${id}`)

      if (!response.ok) {
        throw new Error('Error al obtener tag RFID')
      }

      const data = await response.json()
      setCurrentTag(data)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [setCurrentTag, setLoading, setError])

  const createTag = useCallback(async (data: RfidTagFormData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/rfid/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear tag RFID')
      }

      const newTag = await response.json()
      addTag(newTag)
      toast.success('Tag RFID creado exitosamente')
      return newTag
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [addTag, setLoading, setError])

  const editTag = useCallback(async (id: string, data: RfidTagFormData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/rfid/tags/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al actualizar tag RFID')
      }

      const updatedTag = await response.json()
      updateTag(id, updatedTag)
      toast.success('Tag RFID actualizado exitosamente')
      return updatedTag
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [updateTag, setLoading, setError])

  const deleteTag = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/rfid/tags/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al eliminar tag RFID')
      }

      removeTag(id)
      toast.success('Tag RFID eliminado exitosamente')
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      toast.error(message)
      return false
    } finally {
      setLoading(false)
    }
  }, [removeTag, setLoading, setError])

  const enrollTag = useCallback(async (id: string, data: RfidEnrollmentFormData) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/rfid/tags/${id}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al vincular tag RFID')
      }

      const updatedTag = await response.json()
      updateTag(id, updatedTag)
      toast.success('Tag RFID vinculado exitosamente')
      return updatedTag
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [updateTag, setLoading, setError])

  const unenrollTag = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/rfid/tags/${id}/enroll`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al desvincular tag RFID')
      }

      const updatedTag = await response.json()
      updateTag(id, updatedTag)
      toast.success('Tag RFID desvinculado exitosamente')
      return updatedTag
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [updateTag, setLoading, setError])

  const fetchDetections = useCallback(async (options?: {
    rfidTagId?: string
    readerId?: string
    direction?: string
    limit?: number
    offset?: number
  }) => {
    setLoading(true)
    setError(null)

    try {
      const url = new URL('/api/rfid/detections', window.location.origin)
      if (options?.rfidTagId) url.searchParams.set('rfidTagId', options.rfidTagId)
      if (options?.readerId) url.searchParams.set('readerId', options.readerId)
      if (options?.direction) url.searchParams.set('direction', options.direction)
      if (options?.limit) url.searchParams.set('limit', options.limit.toString())
      if (options?.offset) url.searchParams.set('offset', options.offset.toString())

      const response = await fetch(url.toString())

      if (!response.ok) {
        throw new Error('Error al obtener detecciones')
      }

      const data = await response.json()
      setDetections(data.detections)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [setDetections, setLoading, setError])

  return {
    tags,
    unknownTags,
    currentTag,
    detections,
    isLoading,
    error,
    filters,
    setFilters,
    resetFilters,
    fetchTags,
    fetchUnknownTags,
    fetchTag,
    createTag,
    editTag,
    deleteTag,
    enrollTag,
    unenrollTag,
    fetchDetections,
  }
}
