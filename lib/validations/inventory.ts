import { z } from 'zod'

export const inventoryItemSchema = z.object({
  productId: z.string().min(1, 'El producto es requerido'),
  serialNumber: z.string().optional(),
  assetTag: z.string().optional(),
  type: z.enum(['UNIT', 'CONTAINER', 'BULK']),
  status: z.enum(['IN', 'OUT', 'MAINTENANCE', 'LOST']),
  condition: z.string().optional(),
  location: z.string().optional(),
  containerId: z.string().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  purchasePrice: z.number().min(0, 'El precio debe ser positivo').optional().nullable(),
  warrantyExpiry: z.string().optional().nullable(),
  notes: z.string().optional(),
})

export type InventoryItemFormData = z.infer<typeof inventoryItemSchema>

export const checkInOutSchema = z.object({
  location: z.string().optional(),
  reason: z.string().optional(),
  reference: z.string().optional(),
})

export type CheckInOutFormData = z.infer<typeof checkInOutSchema>

export type InventoryItem = {
  id: string
  productId: string
  serialNumber: string | null
  assetTag: string | null
  type: 'UNIT' | 'CONTAINER' | 'BULK'
  status: 'IN' | 'OUT' | 'MAINTENANCE' | 'LOST'
  condition: string | null
  location: string | null
  containerId: string | null
  purchaseDate: Date | null
  purchasePrice: number | null
  warrantyExpiry: Date | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
  product?: {
    id: string
    sku: string
    name: string
    brand: string | null
    model: string | null
    unitPrice?: number | null
    rentalPrice?: number | null
    category?: {
      id: string
      name: string
      color: string | null
    }
  }
  container?: {
    id: string
    assetTag: string | null
    serialNumber: string | null
  } | null
  contents?: InventoryItem[]
  rfidTag?: {
    id: string
    epc: string
    tid?: string
    status: string
    lastSeenAt: Date
    firstSeenAt?: Date
  } | null
  movements?: Array<{
    id: string
    type: string
    fromStatus: string | null
    toStatus: string
    fromLocation: string | null
    toLocation: string | null
    reason: string | null
    reference: string | null
    createdAt: Date
    user?: {
      id: string
      name: string | null
      email: string
    }
  }>
  _count?: {
    movements: number
    contents: number
  }
}

export type InventoryMovement = {
  id: string
  inventoryItemId: string
  type: 'CHECK_IN' | 'CHECK_OUT' | 'ADJUSTMENT' | 'ENROLLMENT' | 'TRANSFER'
  fromStatus: string | null
  toStatus: string
  fromLocation: string | null
  toLocation: string | null
  reason: string | null
  reference: string | null
  performedBy: string
  createdAt: Date
  user?: {
    id: string
    name: string | null
    email: string
  }
  inventoryItem?: {
    id: string
    serialNumber: string | null
    assetTag: string | null
    product?: {
      name: string
      sku: string
    }
  }
}

export type InventorySummary = {
  total: number
  byStatus: {
    IN: number
    OUT: number
    MAINTENANCE: number
    LOST: number
  }
  byType: {
    UNIT: number
    CONTAINER: number
  }
  byCategory?: Array<{
    name: string
    color: string | null
    count: number
  }>
  recentMovements?: Array<{
    id: string
    type: string
    createdAt: string
    inventoryItem?: {
      product?: { name: string }
      serialNumber?: string | null
      assetTag?: string | null
    }
    user?: { name?: string | null }
  }>
}
