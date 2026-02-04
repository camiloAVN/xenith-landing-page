import { z } from 'zod'

export const categorySchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color debe ser formato hex (#RRGGBB)').optional().or(z.literal('')),
  icon: z.string().optional(),
})

export type CategoryFormData = z.infer<typeof categorySchema>

export type Category = {
  id: string
  name: string
  description: string | null
  color: string | null
  icon: string | null
  createdAt: Date
  updatedAt: Date
  _count?: {
    products: number
  }
}
