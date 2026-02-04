import { z } from 'zod'

export const productSchema = z.object({
  sku: z.string().min(1, 'El SKU es requerido'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'La categoría es requerida'),
  brand: z.string().optional(),
  model: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  unitPrice: z.number().min(0, 'El precio debe ser positivo').optional().nullable(),
  rentalPrice: z.number().min(0, 'El precio debe ser positivo').optional().nullable(),
  imageUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  notes: z.string().optional(),
})

export type ProductFormData = z.infer<typeof productSchema>

export const productSupplierSchema = z.object({
  supplierId: z.string().min(1, 'El proveedor es requerido'),
  supplierSku: z.string().optional(),
  cost: z.number().min(0, 'El costo debe ser positivo').optional().nullable(),
  isPreferred: z.boolean().default(false),
})

export type ProductSupplierFormData = z.infer<typeof productSupplierSchema>

export type Product = {
  id: string
  sku: string
  name: string
  description: string | null
  categoryId: string
  brand: string | null
  model: string | null
  status: 'ACTIVE' | 'INACTIVE'
  unitPrice: number | null
  rentalPrice: number | null
  imageUrl: string | null
  notes: string | null
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
  category?: {
    id: string
    name: string
    color: string | null
  }
  suppliers?: Array<{
    supplierId: string
    supplierSku: string | null
    cost: number | null
    isPreferred: boolean
    supplier: {
      id: string
      name: string
    }
  }>
  _count?: {
    inventoryItems: number
  }
  inventoryItems?: Array<{
    id: string
    serialNumber: string | null
    assetTag: string | null
    status: string
    condition: string
    location: string | null
  }>
}
