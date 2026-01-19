import { z } from 'zod'

// Common weak passwords to block
const COMMON_PASSWORDS = [
  'password', 'password123', '123456', '12345678', 'qwerty', 'abc123',
  'monkey', 'master', 'dragon', 'letmein', 'login', 'admin', 'welcome',
  'password1', 'xenith', 'xenith123', 'admin123', 'root', 'toor',
]

// Password strength validation
const passwordValidation = z
  .string()
  .min(8, 'La contrasena debe tener al menos 8 caracteres')
  .max(128, 'La contrasena no puede exceder 128 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una mayuscula')
  .regex(/[a-z]/, 'Debe contener al menos una minuscula')
  .regex(/[0-9]/, 'Debe contener al menos un numero')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Debe contener al menos un caracter especial (!@#$%^&*)')
  .refine(
    (password) => !COMMON_PASSWORDS.includes(password.toLowerCase()),
    'Esta contrasena es muy comun. Elige una mas segura.'
  )
  .refine(
    (password) => !/(.)\1{2,}/.test(password),
    'No puede contener mas de 2 caracteres repetidos consecutivos'
  )
  .refine(
    (password) => !/^[a-zA-Z]+$/.test(password) && !/^[0-9]+$/.test(password),
    'La contrasena no puede ser solo letras o solo numeros'
  )

// Email validation with additional security checks
const emailValidation = z
  .string()
  .email('Email invalido')
  .min(5, 'El email es muy corto')
  .max(100, 'El email no puede exceder 100 caracteres')
  .toLowerCase()
  .refine(
    (email) => !email.includes('+'),
    'No se permiten direcciones de email con alias (+)'
  )
  .refine(
    (email) => {
      const domain = email.split('@')[1]
      // Block temporary email providers
      const blockedDomains = ['tempmail.com', 'throwaway.com', 'guerrillamail.com', 'mailinator.com', '10minutemail.com']
      return !blockedDomains.includes(domain)
    },
    'No se permiten servicios de email temporal'
  )

export const loginSchema = z.object({
  email: z
    .string()
    .email('Email invalido')
    .min(5, 'El email es muy corto')
    .max(100, 'El email no puede exceder 100 caracteres')
    .toLowerCase(),

  password: z
    .string()
    .min(1, 'La contrasena es requerida')
    .max(128, 'La contrasena no puede exceder 128 caracteres'),
})

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'El nombre solo puede contener letras y espacios'),

  email: emailValidation,

  password: passwordValidation,

  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contrasenas no coinciden',
  path: ['confirmPassword'],
})

// Schema for password change
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contrasena actual es requerida'),
  newPassword: passwordValidation,
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Las contrasenas no coinciden',
  path: ['confirmNewPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'La nueva contrasena debe ser diferente a la actual',
  path: ['newPassword'],
})

// Schema for password reset request
export const passwordResetRequestSchema = z.object({
  email: z
    .string()
    .email('Email invalido')
    .toLowerCase(),
})

// Schema for password reset
export const passwordResetSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  password: passwordValidation,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contrasenas no coinciden',
  path: ['confirmPassword'],
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
export type PasswordResetRequestFormData = z.infer<typeof passwordResetRequestSchema>
export type PasswordResetFormData = z.infer<typeof passwordResetSchema>

// Helper function to check password strength
export function getPasswordStrength(password: string): {
  score: number
  label: string
  color: string
} {
  let score = 0

  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++
  if (password.length >= 16) score++

  if (score <= 2) return { score, label: 'Debil', color: 'red' }
  if (score <= 4) return { score, label: 'Media', color: 'yellow' }
  if (score <= 5) return { score, label: 'Fuerte', color: 'green' }
  return { score, label: 'Muy Fuerte', color: 'emerald' }
}
