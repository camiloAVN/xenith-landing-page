import { z } from 'zod'

export const userRoles = ['SUPERADMIN', 'ADMIN', 'USER'] as const
export type UserRole = typeof userRoles[number]

// Modulos disponibles en el sistema
export const systemModules = [
  'dashboard',
  'proyectos',
  'clientes',
  'cotizaciones',
  'inventario',
  'productos',
  'items',
  'grupos',
  'rfid',
  'movimientos',
  'contratistas',
  'conceptos',
  'categorias',
] as const

export type SystemModule = typeof systemModules[number]

// Labels para los modulos
export const moduleLabels: Record<SystemModule, string> = {
  dashboard: 'Dashboard',
  proyectos: 'Proyectos',
  clientes: 'Clientes',
  cotizaciones: 'Cotizaciones',
  inventario: 'Inventario',
  productos: 'Productos',
  items: 'Items',
  grupos: 'Grupos',
  rfid: 'RFID',
  movimientos: 'Movimientos',
  contratistas: 'Contratistas',
  conceptos: 'Conceptos',
  categorias: 'Categorias',
}

// Agrupacion de modulos para la UI
export const moduleGroups = {
  general: ['dashboard', 'proyectos', 'clientes', 'cotizaciones'],
  inventario: ['inventario', 'productos', 'items', 'grupos', 'rfid', 'movimientos'],
  terceros: ['contratistas', 'conceptos'],
  configuracion: ['categorias'],
} as const

export const moduleGroupLabels: Record<keyof typeof moduleGroups, string> = {
  general: 'General',
  inventario: 'Inventario',
  terceros: 'Terceros',
  configuracion: 'Configuracion',
}

// Schema de permisos
export const permissionSchema = z.object({
  module: z.enum(systemModules),
  canView: z.boolean().default(false),
  canEdit: z.boolean().default(false),
})

export type Permission = z.infer<typeof permissionSchema>

export const createUserSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  email: z
    .string()
    .email('Email invalido')
    .max(100, 'El email no puede exceder 100 caracteres'),
  password: z
    .string()
    .min(8, 'La contrasena debe tener al menos 8 caracteres')
    .max(128, 'La contrasena no puede exceder 128 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayuscula')
    .regex(/[a-z]/, 'Debe contener al menos una minuscula')
    .regex(/[0-9]/, 'Debe contener al menos un numero'),
  role: z.enum(userRoles).default('USER'),
  position: z
    .string()
    .max(100, 'El cargo no puede exceder 100 caracteres')
    .optional()
    .nullable(),
  permissions: z.array(permissionSchema).optional(),
})

export const updateUserSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .optional(),
  email: z
    .string()
    .email('Email invalido')
    .max(100, 'El email no puede exceder 100 caracteres')
    .optional(),
  password: z
    .string()
    .min(8, 'La contrasena debe tener al menos 8 caracteres')
    .max(128, 'La contrasena no puede exceder 128 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayuscula')
    .regex(/[a-z]/, 'Debe contener al menos una minuscula')
    .regex(/[0-9]/, 'Debe contener al menos un numero')
    .optional(),
  role: z.enum(userRoles).optional(),
  position: z
    .string()
    .max(100, 'El cargo no puede exceder 100 caracteres')
    .optional()
    .nullable(),
  isActive: z.boolean().optional(),
  permissions: z.array(permissionSchema).optional(),
})

export type CreateUserFormData = z.infer<typeof createUserSchema>
export type UpdateUserFormData = z.infer<typeof updateUserSchema>

export type UserPermission = {
  id: string
  userId: string
  module: SystemModule
  canView: boolean
  canEdit: boolean
}

export type User = {
  id: string
  name: string | null
  email: string
  role: UserRole
  position: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  permissions?: UserPermission[]
}

export const roleLabels: Record<UserRole, string> = {
  SUPERADMIN: 'Super Admin',
  ADMIN: 'Administrador',
  USER: 'Usuario',
}

export const roleColors: Record<UserRole, string> = {
  SUPERADMIN: 'bg-red-500/10 text-red-400 border-red-500/20',
  ADMIN: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  USER: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
}

// Email del superadmin (unico que puede gestionar usuarios)
export const SUPERADMIN_EMAIL = 'camilo.vargas@xenith.com.co'

// Schema para cambiar contraseña
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'La contrasena actual es requerida'),
  newPassword: z
    .string()
    .min(8, 'La contrasena debe tener al menos 8 caracteres')
    .max(128, 'La contrasena no puede exceder 128 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayuscula')
    .regex(/[a-z]/, 'Debe contener al menos una minuscula')
    .regex(/[0-9]/, 'Debe contener al menos un numero'),
  confirmPassword: z
    .string()
    .min(1, 'Confirma la nueva contrasena'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contrasenas no coinciden',
  path: ['confirmPassword'],
})

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
