import { createHash, randomBytes, randomUUID } from 'node:crypto'

import jwt from 'jsonwebtoken'
import type { Role } from '../../shared/index.js'

import { env } from '../../config/env.js'
import { UnauthorizedError } from '../../core/errors.js'

/** Claims carried in the short-lived access JWT (see docs/SECURITY.md). */
export interface AccessTokenPayload {
  sub: string
  roles: Role[]
  email?: string
  type: 'access'
}

export function signAccessToken(user: { id: string; roles: Role[]; email?: string }): string {
  return jwt.sign({ roles: user.roles, email: user.email, type: 'access' }, env.JWT_ACCESS_SECRET, {
    subject: user.id,
    expiresIn: env.JWT_ACCESS_TTL as jwt.SignOptions['expiresIn'],
  })
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET)
    if (typeof payload === 'string' || payload.type !== 'access' || !payload.sub) {
      throw new Error('Malformed access token')
    }
    return {
      sub: payload.sub,
      roles: payload.roles as Role[],
      email: typeof payload === 'object' && payload.email ? (payload.email as string) : undefined,
      type: 'access',
    }
  } catch {
    throw new UnauthorizedError('Invalid or expired access token')
  }
}

/** Opaque 256-bit refresh token — delivered via HttpOnly cookie only. */
export function generateRefreshToken(): string {
  return randomBytes(32).toString('base64url')
}

/** Opaque reset token — delivered via email (dev: echoed back). */
export function generateResetToken(): string {
  return randomBytes(32).toString('base64url')
}

/** Refresh/reset tokens are stored hashed (SHA-256) in the database. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function refreshTokenExpiry(): Date {
  const date = new Date()
  date.setDate(date.getDate() + env.REFRESH_TOKEN_TTL_DAYS)
  return date
}

export function resetTokenExpiry(hours = 1): Date {
  const date = new Date()
  date.setHours(date.getHours() + hours)
  return date
}

/** New session family identifier for rotation + reuse detection. */
export function newFamilyId(): string {
  return randomUUID()
}