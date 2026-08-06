import type {
  CreateUserInput,
  PasswordResetTokenRecord,
  RefreshTokenRecord,
  UserRecord,
} from './auth.types.js'

/**
 * Storage contract for the auth module. Implementations are storage-agnostic and
 * return normalized records. Swap the backend by changing `getAuthRepository()`.
 */
export interface AuthRepository {
  findByEmail(email: string): Promise<UserRecord | null>
  findById(id: string): Promise<UserRecord | null>
  createUser(input: CreateUserInput): Promise<UserRecord>
  updatePassword(userId: string, passwordHash: string): Promise<void>
  updateUserStatus(userId: string, status: import('@propertypro/shared').UserStatus): Promise<UserRecord | null>
  listOwnerRequests(): Promise<UserRecord[]>

  createRefreshToken(input: {
    userId: string
    familyId: string
    tokenHash: string
    expiresAt: Date
  }): Promise<RefreshTokenRecord>
  findRefreshTokenByHash(tokenHash: string): Promise<RefreshTokenRecord | null>
  revokeRefreshToken(id: string): Promise<void>
  revokeFamily(familyId: string, exceptId?: string): Promise<void>
  revokeAllForUser(userId: string): Promise<void>

  createPasswordResetToken(input: {
    userId: string
    tokenHash: string
    expiresAt: Date
  }): Promise<PasswordResetTokenRecord>
  findPasswordResetTokenByHash(tokenHash: string): Promise<PasswordResetTokenRecord | null>
  deletePasswordResetToken(id: string): Promise<void>
}
