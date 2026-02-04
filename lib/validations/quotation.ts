import { z } from 'zod'

export const quotationItemSchema = z.object({
  inventoryItemId: z.string().optional().nullable(),
  description: z.string().min(3, 'La descripción debe tener al menos 3 caracteres'),
  quantity: z.number().min(1, 'La cantidad debe ser al menos 1'),
  unitPrice: z.number().min(0, 'El precio unitario debe ser positivo'),
})

export const quotationSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().optional(),
  clientId: z.string().min(1, 'Debes seleccionar un cliente'),
  projectId: z.string().optional(),
  status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED']),
  validUntil: z.string().min(1, 'Debes especificar la fecha de validez'),
  discount: z.string().optional(),
  tax: z.string().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  items: z.array(quotationItemSchema).min(1, 'Debes agregar al menos un item'),
})

export type QuotationItemFormData = z.infer<typeof quotationItemSchema>
export type QuotationFormData = z.infer<typeof quotationSchema>

export type QuotationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'

export type QuotationItem = {
  id: string
  quotationId: string
  inventoryItemId: string | null
  description: string
  quantity: number
  unitPrice: number
  total: number
  order: number
  createdAt: Date
  updatedAt: Date
  inventoryItem?: {
    id: string
    serialNumber: string | null
    assetTag: string | null
    product?: {
      id: string
      sku: string
      name: string
      brand: string | null
      model: string | null
    }
  } | null
}

export type Quotation = {
  id: string
  quotationNumber: string
  title: string
  description: string | null
  clientId: string
  projectId: string | null
  createdBy: string
  status: QuotationStatus
  validUntil: Date
  subtotal: number
  tax: number
  discount: number
  total: number
  notes: string | null
  terms: string | null
  createdAt: Date
  updatedAt: Date
  client?: {
    id: string
    name: string
    company: string | null
    email: string
    phone: string | null
    address: string | null
    city: string | null
    country: string | null
    taxId: string | null
  }
  project?: {
    id: string
    title: string
  }
  createdByUser?: {
    id: string
    name: string | null
    email: string
  }
  items: QuotationItem[]
}

export const statusLabels: Record<QuotationStatus, string> = {
  DRAFT: 'Borrador',
  SENT: 'Enviada',
  ACCEPTED: 'Aceptada',
  REJECTED: 'Rechazada',
  EXPIRED: 'Expirada',
}

export const statusColors: Record<QuotationStatus, string> = {
  DRAFT: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  SENT: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  ACCEPTED: 'bg-green-500/10 text-green-400 border-green-500/20',
  REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
  EXPIRED: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
}
