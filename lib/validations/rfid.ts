import { z } from 'zod'

export const rfidTagSchema = z.object({
  epc: z.string().min(1, 'El EPC es requerido'),
  tid: z.string().optional(),
  inventoryItemId: z.string().optional().nullable(),
  status: z.enum(['ENROLLED', 'UNASSIGNED', 'UNKNOWN']).default('UNASSIGNED'),
})

export type RfidTagFormData = z.infer<typeof rfidTagSchema>

export const rfidEnrollmentSchema = z.object({
  inventoryItemId: z.string().min(1, 'El item de inventario es requerido'),
})

export type RfidEnrollmentFormData = z.infer<typeof rfidEnrollmentSchema>

export const rfidReadSchema = z.object({
  readerId: z.string().min(1, 'El ID del lector es requerido'),
  readerName: z.string().optional(),
  reads: z.array(z.object({
    epc: z.string().min(1, 'El EPC es requerido'),
    tid: z.string().optional(),
    rssi: z.number().optional(),
    direction: z.enum(['IN', 'OUT']).optional(),
    timestamp: z.string().optional(),
  })),
  apiKey: z.string().min(1, 'La API key es requerida'),
})

export type RfidReadPayload = z.infer<typeof rfidReadSchema>

export type RfidTag = {
  id: string
  epc: string
  tid: string | null
  inventoryItemId: string | null
  status: 'ENROLLED' | 'UNASSIGNED' | 'UNKNOWN'
  firstSeenAt: Date
  lastSeenAt: Date
  createdAt: Date
  updatedAt: Date
  inventoryItem?: {
    id: string
    serialNumber: string | null
    assetTag: string | null
    status: string
    location?: string | null
    product?: {
      id: string
      sku: string
      name: string
      brand?: string | null
      model?: string | null
    }
  } | null
  detections?: Array<{
    id: string
    readerId: string
    readerName: string | null
    rssi: number | null
    direction: string | null
    timestamp: Date
  }>
  _count?: {
    detections: number
  }
}

export type RfidDetection = {
  id: string
  rfidTagId: string
  readerId: string
  readerName: string | null
  rssi: number | null
  direction: string | null
  timestamp: Date
  rfidTag?: {
    id: string
    epc: string
    status: string
    inventoryItem?: {
      id: string
      serialNumber: string | null
      assetTag: string | null
      product?: {
        name: string
        sku: string
      }
    } | null
  }
}
