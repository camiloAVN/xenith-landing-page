import { z } from 'zod'

export const taskItemSchema = z.object({
  title: z.string().min(1, 'El título de la tarea es requerido'),
  description: z.string().optional(),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
})

export const projectSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  clientId: z.string().min(1, 'Debes seleccionar un cliente'),
  assignedTo: z.string().min(1, 'Debes asignar el proyecto a un usuario'),
  status: z.enum(['PROSPECT', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  tasks: z.array(taskItemSchema).optional(),
})

export type ProjectFormData = z.infer<typeof projectSchema>
export type TaskItemFormData = z.infer<typeof taskItemSchema>

export type ProjectStatus = 'PROSPECT' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'

export type Project = {
  id: string
  title: string
  description: string
  status: ProjectStatus
  clientId: string
  assignedTo: string
  startDate: Date | null
  endDate: Date | null
  budget: number | null
  priority: Priority
  tags: string[]
  notes: string | null
  createdAt: Date
  updatedAt: Date
  client?: {
    id: string
    name: string
    company: string | null
    email: string
  }
  assignedUser?: {
    id: string
    name: string | null
    email: string
  }
  quotations?: Array<{
    id: string
    quotationNumber: string
    title: string
    status: string
    total: number
    createdAt: Date
  }>
  tasks?: Array<{
    id: string
    title: string
    description: string | null
    status: TaskStatus
    assignedTo: string | null
    dueDate: Date | null
    priority: Priority
    completed: boolean
    assignedUser?: {
      id: string
      name: string | null
      email: string
    } | null
  }>
}

export const statusLabels: Record<ProjectStatus, string> = {
  PROSPECT: 'Prospecto',
  IN_PROGRESS: 'En Progreso',
  ON_HOLD: 'En Pausa',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
}

export const statusColors: Record<ProjectStatus, string> = {
  PROSPECT: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  IN_PROGRESS: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  ON_HOLD: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  COMPLETED: 'bg-green-500/10 text-green-400 border-green-500/20',
  CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export const priorityLabels: Record<Priority, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  URGENT: 'Urgente',
}

export const priorityColors: Record<Priority, string> = {
  LOW: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  MEDIUM: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  HIGH: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  URGENT: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export const taskStatusLabels: Record<TaskStatus, string> = {
  TODO: 'Por Hacer',
  IN_PROGRESS: 'En Progreso',
  DONE: 'Completada',
}

export const taskStatusColors: Record<TaskStatus, string> = {
  TODO: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  IN_PROGRESS: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  DONE: 'bg-green-500/10 text-green-400 border-green-500/20',
}
