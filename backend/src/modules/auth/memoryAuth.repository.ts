import { randomUUID } from 'node:crypto'

import bcrypt from 'bcryptjs'
import type { UserStatus } from '../../shared/index.js'
import { ConflictError } from '../../core/errors.js'
import { persistentDb } from '../../core/persistentDb.js'
import type { AuthRepository } from './auth.repository.js'
import type {
  CreateUserInput,
  PasswordResetTokenRecord,
  RefreshTokenRecord,
  UserRecord,
} from './auth.types.js'

/**
 * Development-only implementation that persists data to a local JSON file
 * so that sessions and users survive tsx/nodemon restarts during dev.
 */
export class InMemoryAuthRepository implements AuthRepository {
  private users: Map<string, UserRecord>
  private usersByEmail: Map<string, string>
  private refreshTokens: Map<string, RefreshTokenRecord>
  private refreshTokensByHash: Map<string, string>
  private passwordResetTokens: Map<string, PasswordResetTokenRecord>

  constructor() {
    const loaded = persistentDb.loadAuth()
    this.users = loaded.users
    this.usersByEmail = loaded.usersByEmail
    this.refreshTokens = loaded.refreshTokens
    this.refreshTokensByHash = loaded.refreshTokensByHash
    this.passwordResetTokens = loaded.passwordResetTokens

    // ── Dev-only Super Admin seed ──────────────────────────────────────────────
    // Creates admin@propertypro.com / Admin@123 only if it does not already exist.
    // InMemoryAuthRepository is ONLY used in development mode; never in production.
    const ADMIN_EMAIL = 'admin@propertypro.com'
    if (!this.usersByEmail.has(ADMIN_EMAIL)) {
      const now = new Date().toISOString()
      const adminRecord: UserRecord = {
        id: randomUUID(),
        email: ADMIN_EMAIL,
        passwordHash: bcrypt.hashSync('Admin@123', 12),
        roles: ['admin'],
        firstName: 'Super',
        lastName: 'Admin',
        phone: '',
        status: 'active',
        emailVerifiedAt: null,
        createdAt: now,
        updatedAt: now,
      }
      this.users.set(adminRecord.id, adminRecord)
      this.usersByEmail.set(ADMIN_EMAIL, adminRecord.id)
      this.save()
    }

    // ── Dev-only Owner seed ────────────────────────────────────────────────────
    // Creates owner@propertypro.com / Owner@123 as a pre-approved owner account.
    // Useful for testing the Owner Dashboard without needing Super Admin approval.
    const OWNER_EMAIL = 'owner@propertypro.com'
    if (!this.usersByEmail.has(OWNER_EMAIL)) {
      const now = new Date().toISOString()
      const ownerRecord: UserRecord = {
        id: randomUUID(),
        email: OWNER_EMAIL,
        passwordHash: bcrypt.hashSync('Owner@123', 12),
        roles: ['owner'],
        firstName: 'Dev',
        lastName: 'Owner',
        phone: '',
        status: 'active',
        emailVerifiedAt: null,
        createdAt: now,
        updatedAt: now,
      }
      this.users.set(ownerRecord.id, ownerRecord)
      this.usersByEmail.set(OWNER_EMAIL, ownerRecord.id)
      this.save()
    }

    // ── Dev-only Tenant seed ───────────────────────────────────────────────────
    const TENANT_EMAIL = 'tenant@propertypro.com'
    if (!this.usersByEmail.has(TENANT_EMAIL)) {
      const now = new Date().toISOString()
      const tenantRecord: UserRecord = {
        id: randomUUID(),
        email: TENANT_EMAIL,
        passwordHash: bcrypt.hashSync('Tenant@123', 12),
        roles: ['tenant'],
        firstName: 'John',
        lastName: 'Tenant',
        phone: '',
        status: 'active',
        emailVerifiedAt: null,
        createdAt: now,
        updatedAt: now,
      }
      this.users.set(tenantRecord.id, tenantRecord)
      this.usersByEmail.set(TENANT_EMAIL, tenantRecord.id)
      this.save()
    }
  }

  private save() {
    persistentDb.saveAuth({
      users: this.users,
      usersByEmail: this.usersByEmail,
      refreshTokens: this.refreshTokens,
      refreshTokensByHash: this.refreshTokensByHash,
      passwordResetTokens: this.passwordResetTokens,
    })
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const id = this.usersByEmail.get(email.toLowerCase())
    return id ? (this.users.get(id) ?? null) : null
  }

  async findById(id: string): Promise<UserRecord | null> {
    return this.users.get(id) ?? null
  }

  async createUser(input: CreateUserInput): Promise<UserRecord> {
    const email = input.email.toLowerCase()
    if (this.usersByEmail.has(email)) {
      throw new ConflictError('An account with this email already exists.')
    }
    const now = new Date().toISOString()
    const record: UserRecord = {
      id: randomUUID(),
      email,
      passwordHash: input.passwordHash,
      roles: input.roles,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: '',
      status: input.status ?? 'active',
      emailVerifiedAt: null,
      createdAt: now,
      updatedAt: now,
    }
    this.users.set(record.id, record)
    this.usersByEmail.set(email, record.id)
    this.save()
    return record
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    const user = this.users.get(userId)
    if (!user) return
    this.users.set(userId, { ...user, passwordHash, updatedAt: new Date().toISOString() })
    this.save()
  }

  async updateProfile(userId: string, input: { firstName?: string; lastName?: string; phone?: string }): Promise<UserRecord | null> {
    const user = this.users.get(userId)
    if (!user) return null
    const updated = {
      ...user,
      firstName: input.firstName !== undefined ? input.firstName.trim() : user.firstName,
      lastName: input.lastName !== undefined ? input.lastName.trim() : user.lastName,
      phone: input.phone !== undefined ? input.phone.trim() : user.phone,
      updatedAt: new Date().toISOString(),
    }
    this.users.set(userId, updated)
    this.save()
    return updated
  }

  async updateUserStatus(userId: string, status: UserStatus): Promise<UserRecord | null> {
    const user = this.users.get(userId)
    if (!user) return null
    const updated = { ...user, status, updatedAt: new Date().toISOString() }
    this.users.set(userId, updated)
    this.save()
    return updated
  }

  async listOwnerRequests(): Promise<UserRecord[]> {
    const records = Array.from(this.users.values())
      .filter((u) => u.roles.includes('owner'))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return records
  }

  async listAllUsers(): Promise<UserRecord[]> {
    return Array.from(this.users.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  async createRefreshToken(input: {
    userId: string
    familyId: string
    tokenHash: string
    expiresAt: Date
  }): Promise<RefreshTokenRecord> {
    const record: RefreshTokenRecord = {
      id: randomUUID(),
      userId: input.userId,
      familyId: input.familyId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      revokedAt: null,
      replacedByTokenId: null,
    }
    this.refreshTokens.set(record.id, record)
    this.refreshTokensByHash.set(record.tokenHash, record.id)
    this.save()
    return record
  }

  async findRefreshTokenByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    const id = this.refreshTokensByHash.get(tokenHash)
    const record = id ? (this.refreshTokens.get(id) ?? null) : null
    if (record) {
      // Ensure expiresAt and revokedAt are Date objects (deserialized from JSON strings)
      if (typeof record.expiresAt === 'string') record.expiresAt = new Date(record.expiresAt)
      if (typeof record.revokedAt === 'string') record.revokedAt = new Date(record.revokedAt)
    }
    return record
  }

  async revokeRefreshToken(id: string): Promise<void> {
    const record = this.refreshTokens.get(id)
    if (!record || record.revokedAt) return
    this.refreshTokens.set(id, { ...record, revokedAt: new Date() })
    this.save()
  }

  async revokeFamily(familyId: string, exceptId?: string): Promise<void> {
    let updated = false
    for (const [id, record] of this.refreshTokens) {
      if (record.familyId === familyId && record.revokedAt === null && id !== exceptId) {
        this.refreshTokens.set(id, { ...record, revokedAt: new Date() })
        updated = true
      }
    }
    if (updated) this.save()
  }

  async revokeAllForUser(userId: string): Promise<void> {
    let updated = false
    for (const [id, record] of this.refreshTokens) {
      if (record.userId === userId && record.revokedAt === null) {
        this.refreshTokens.set(id, { ...record, revokedAt: new Date() })
        updated = true
      }
    }
    if (updated) this.save()
  }

  async createPasswordResetToken(input: {
    userId: string
    tokenHash: string
    expiresAt: Date
  }): Promise<PasswordResetTokenRecord> {
    const record: PasswordResetTokenRecord = {
      id: randomUUID(),
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
    }
    this.passwordResetTokens.set(record.id, record)
    this.save()
    return record
  }

  async findPasswordResetTokenByHash(
    tokenHash: string,
  ): Promise<PasswordResetTokenRecord | null> {
    for (const record of this.passwordResetTokens.values()) {
      if (record.tokenHash === tokenHash) {
        if (typeof record.expiresAt === 'string') record.expiresAt = new Date(record.expiresAt)
        return record
      }
    }
    return null
  }

  async deletePasswordResetToken(id: string): Promise<void> {
    this.passwordResetTokens.delete(id)
    this.save()
  }
}
