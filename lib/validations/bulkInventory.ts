import { z } from 'zod'

export const bulkInventorySchema = z.object({
  productId: z.string().min(1, 'El producto es requerido'),
  quantity: z.number().int().min(0, 'La cantidad debe ser 0 o mayor'),
  minQuantity: z.number().int().min(0, 'La cantidad mínima debe ser 0 o mayor').optional().nullable(),
  location: z.string().optional(),
})

export type BulkInventoryFormData = z.infer<typeof bulkInventorySchema>

export const bulkAdjustmentSchema = z.object({
  quantity: z.number().int().refine((val) => val !== 0, 'La cantidad no puede ser 0'),
  reason: z.string().min(1, 'La razón es requerida'),
  reference: z.string().optional(),
})

export type BulkAdjustmentFormData = z.infer<typeof bulkAdjustmentSchema>

export type BulkInventory = {
  id: string
  productId: string
  quantity: number
  minQuantity: number | null
  location: string | null
  createdAt: Date
  updatedAt: Date
  product?: {
    id: string
    sku: string
    name: string
    brand: string | null
    model: string | null
    category?: {
      id: string
      name: string
      color: string | null
    }
  }
  _count?: {
    movements: number
  }
}

export type BulkMovement = {
  id: string
  bulkInventoryId: string
  type: 'CHECK_IN' | 'CHECK_OUT' | 'ADJUSTMENT' | 'ENROLLMENT' | 'TRANSFER'
  quantity: number
  previousQty: number
  newQty: number
  reason: string | null
  reference: string | null
  performedBy: string
  createdAt: Date
  user?: {
    id: string
    name: string | null
    email: string
  }
  bulkInventory?: {
    product?: {
      name: string
      sku: string
    }
  }
}
