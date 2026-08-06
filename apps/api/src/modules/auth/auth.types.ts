import type { Role, UserStatus } from '@propertypro/shared'

/** Persisted user row (repository-normalized, storage-agnostic). */
export interface UserRecord {
  id: string
  email: string
  passwordHash: string
  roles: Role[]
  firstName: string
  lastName: string
  status: UserStatus
  emailVerifiedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface RefreshTokenRecord {
  id: string
  userId: string
  familyId: string
  tokenHash: string
  expiresAt: Date
  revokedAt: Date | null
  replacedByTokenId: string | null
}

export interface PasswordResetTokenRecord {
  id: string
  userId: string
  tokenHash: string
  expiresAt: Date
}

export interface CreateUserInput {
  email: string
  passwordHash: string
  roles: Role[]
  firstName: string
  lastName: string
}