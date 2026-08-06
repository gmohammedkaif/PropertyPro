import { type Role } from '@propertypro/shared'
import { z } from 'zod'

const email = z.string().trim().toLowerCase().email('Enter a valid email address')

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/\d/, 'Password must contain at least one number')

const nameField = z
  .string()
  .trim()
  .min(1, 'This field is required')
  .max(60, 'Must be at most 60 characters')
  .regex(/^[\p{L}\p{N}' .-]+$/u, 'Contains invalid characters')

const SELF_ASSIGNABLE_ROLES = ['buyer', 'owner', 'agent'] as const satisfies Role[]

export const registerSchema = z.object({
  email,
  password,
  firstName: nameField,
  lastName: nameField,
  role: z.enum(SELF_ASSIGNABLE_ROLES).optional(),
})
export type RegisterInput = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required').max(128),
})
export type LoginInput = z.infer<typeof loginSchema>

export const forgotPasswordSchema = z.object({ email })
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password,
})
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

export const logoutSchema = z.object({ allDevices: z.boolean().optional() })
export type LogoutInput = z.infer<typeof logoutSchema>

export const SELF_ASSIGNABLE_ROLES_LIST = [...SELF_ASSIGNABLE_ROLES]
export type { Role }
