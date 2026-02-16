'use client'

import { useState, useRef, useCallback } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from './Button'
import toast from 'react-hot-toast'

interface ImagePickerProps {
  value?: string | null
  onChange: (value: string | null) => void
  onPreview?: (imageUrl: string) => void
  className?: string
  disabled?: boolean
  error?: string
}

export function ImagePicker({
  value,
  onChange,
  onPreview,
  className,
  disabled = false,
  error,
}: ImagePickerProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast.error('Selecciona un archivo de imagen valido')
        return
      }

      // Max file size: 5MB
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen no puede ser mayor a 5MB')
        return
      }

      try {
        setIsUploading(true)

        const formData = new FormData()
        formData.append('file', file)

        const uploadResponse = await fetch('/api/uploads/products', {
          method: 'POST',
          body: formData,
        })

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json().catch(() => ({}))
          throw new Error(error.error || 'No se pudo subir la imagen')
        }

        const uploadData = await uploadResponse.json()
        const nextUrl = uploadData.url as string
        const previousUrl = value || null

        onChange(nextUrl)

        // Best effort: if image was replaced, remove old file from R2.
        if (previousUrl && previousUrl !== nextUrl) {
          await fetch('/api/uploads/products', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: previousUrl }),
          })
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'No se pudo subir la imagen'
        toast.error(message)
      } finally {
        setIsUploading(false)
      }
    },
    [onChange, value]
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled) return

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isUploading) return

    const run = async () => {
      if (!value) {
        onChange(null)
        return
      }

      const confirmed = confirm('¿Eliminar la imagen del producto? Esta accion no se puede deshacer.')
      if (!confirmed) return

      try {
        const response = await fetch('/api/uploads/products', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: value }),
        })

        if (!response.ok) {
          const error = await response.json().catch(() => ({}))
          throw new Error(error.error || 'No se pudo eliminar la imagen')
        }

        onChange(null)
        if (inputRef.current) {
          inputRef.current.value = ''
        }
        toast.success('Imagen eliminada')
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'No se pudo eliminar la imagen'
        toast.error(message)
      }
    }

    void run()
  }

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click()
    }
  }

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (value && onPreview) {
      onPreview(value)
    }
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Imagen del Producto
      </label>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer',
          'flex items-center justify-center',
          isDragging
            ? 'border-orange-500 bg-orange-500/10'
            : 'border-gray-700 hover:border-gray-600 bg-gray-900/50',
          (disabled || isUploading) && 'opacity-50 cursor-not-allowed',
          error && 'border-red-500',
          value ? 'p-2' : 'p-6'
        )}
      >
        {value ? (
          <div className="relative w-full">
            <div
              className="relative aspect-video w-full max-w-[200px] mx-auto cursor-zoom-in"
              onClick={handleImageClick}
            >
              <img
                src={value}
                alt="Preview"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={disabled || isUploading}
              className="absolute top-0 right-0 p-1 bg-gray-900/80 hover:bg-red-500/20 text-red-400 rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>

            <p className="text-xs text-gray-500 text-center mt-2">
              {isUploading
                ? 'Subiendo imagen...'
                : 'Click en la imagen para ampliar o click fuera para cambiar'}
            </p>
          </div>
        ) : (
          <div className="text-center">
            <ImagePlus className="w-10 h-10 mx-auto mb-2 text-gray-500" />
            <p className="text-sm text-gray-400 mb-1">
              {isUploading
                ? 'Subiendo imagen...'
                : 'Click para seleccionar o arrastra una imagen'}
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG, WEBP hasta 5MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}
