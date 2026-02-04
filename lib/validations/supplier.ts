import { z } from 'zod'

export const supplierSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  contactName: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  notes: z.string().optional(),
})

export type SupplierFormData = z.infer<typeof supplierSchema>

export type Supplier = {
  id: string
  name: string
  contactName: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  country: string | null
  website: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
  _count?: {
    products: number
  }
  products?: Array<{
    productId: string
    supplierSku: string | null
    cost: number | null
    isPreferred: boolean
    product: {
      id: string
      sku: string
      name: string
      brand: string | null
    }
  }>
}
