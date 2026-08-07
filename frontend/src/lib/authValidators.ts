import { z } from 'zod'

const email = z.string().trim().toLowerCase().email('Enter a valid email address')

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

export const registerSchema = z.object({
  email,
  password,
  firstName: z
    .string()
    .trim()
    .min(1, 'First name is required')
    .max(60, 'Must be at most 60 characters'),
  lastName: z
    .string()
    .trim()
    .min(1, 'Last name is required')
    .max(60, 'Must be at most 60 characters'),
  role: z.enum(['buyer', 'owner', 'agent']).optional(),
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

export const passwordStrength = (value: string): { score: number; label: string } => {
  let score = 0
  if (value.length >= 8) score++
  if (value.length >= 12) score++
  if (/[A-Z]/.test(value)) score++
  if (/\d/.test(value)) score++
  if (/[^A-Za-z0-9]/.test(value)) score++
  const labels = ['weak', 'fair', 'good', 'strong', 'excellent']
  return { score: Math.min(score, 4), label: labels[Math.min(score, 4)] }
}
