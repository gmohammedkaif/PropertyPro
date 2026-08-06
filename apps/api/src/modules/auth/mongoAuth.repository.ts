import { ConflictError } from '../../core/errors.js'
import {
  PasswordResetToken,
  type PasswordResetTokenDocument,
} from './models/passwordResetToken.model.js'
import { RefreshToken, type RefreshTokenDocument } from './models/refreshToken.model.js'
import { User, type UserDocument } from './models/user.model.js'
import type { AuthRepository } from './auth.repository.js'
import type {
  CreateUserInput,
  PasswordResetTokenRecord,
  RefreshTokenRecord,
  UserRecord,
} from './auth.types.js'

function toUserRecord(doc: UserDocument): UserRecord {
  return {
    id: doc._id.toString(),
    email: doc.email,
    passwordHash: doc.passwordHash,
    roles: doc.roles,
    firstName: doc.profile?.firstName ?? '',
    lastName: doc.profile?.lastName ?? '',
    status: doc.status,
    emailVerifiedAt: doc.emailVerifiedAt ? doc.emailVerifiedAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  }
}

function toRefreshTokenRecord(doc: RefreshTokenDocument): RefreshTokenRecord {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    familyId: doc.familyId,
    tokenHash: doc.tokenHash,
    expiresAt: new Date(doc.expiresAt),
    revokedAt: doc.revokedAt ? new Date(doc.revokedAt) : null,
    replacedByTokenId: doc.replacedByTokenId ?? null,
  }
}

function toPasswordResetTokenRecord(doc: PasswordResetTokenDocument): PasswordResetTokenRecord {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    tokenHash: doc.tokenHash,
    expiresAt: new Date(doc.expiresAt),
  }
}

function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: number }).code === 11000
  )
}

export class MongoAuthRepository implements AuthRepository {
  async findByEmail(email: string): Promise<UserRecord | null> {
    const doc = await User.findOne({ email: email.toLowerCase() }).lean()
    return doc ? toUserRecord(doc as UserDocument) : null
  }

  async findById(id: string): Promise<UserRecord | null> {
    const doc = await User.findById(id).lean()
    return doc ? toUserRecord(doc as UserDocument) : null
  }

  async createUser(input: CreateUserInput): Promise<UserRecord> {
    try {
      const doc = await User.create({
        email: input.email.toLowerCase(),
        passwordHash: input.passwordHash,
        roles: input.roles,
        profile: { firstName: input.firstName, lastName: input.lastName },
        status: input.status ?? 'active',
      })
      return toUserRecord(doc as unknown as UserDocument)
    } catch (err) {
      if (isDuplicateKeyError(err)) throw new ConflictError('An account with this email already exists.')
      throw err
    }
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await User.updateOne({ _id: userId }, { $set: { passwordHash } })
  }

  async updateUserStatus(userId: string, status: import('@propertypro/shared').UserStatus): Promise<UserRecord | null> {
    const doc = await User.findByIdAndUpdate(userId, { $set: { status } }, { new: true }).lean()
    return doc ? toUserRecord(doc as UserDocument) : null
  }

  async listOwnerRequests(): Promise<UserRecord[]> {
    const docs = await User.find({ roles: 'owner' }).sort({ createdAt: -1 }).lean()
    return docs.map((doc) => toUserRecord(doc as UserDocument))
  }

  async createRefreshToken(input: {
    userId: string
    familyId: string
    tokenHash: string
    expiresAt: Date
  }): Promise<RefreshTokenRecord> {
    const doc = await RefreshToken.create(input)
    return toRefreshTokenRecord(doc as unknown as RefreshTokenDocument)
  }

  async findRefreshTokenByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    const doc = await RefreshToken.findOne({ tokenHash }).lean()
    return doc ? toRefreshTokenRecord(doc as RefreshTokenDocument) : null
  }

  async revokeRefreshToken(id: string): Promise<void> {
    await RefreshToken.updateOne({ _id: id }, { $set: { revokedAt: new Date() } })
  }

  async revokeFamily(familyId: string, exceptId?: string): Promise<void> {
    await RefreshToken.updateMany(
      { familyId, revokedAt: null, ...(exceptId ? { _id: { $ne: exceptId } } : {}) },
      { $set: { revokedAt: new Date() } },
    )
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await RefreshToken.updateMany(
      { userId, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    )
  }

  async createPasswordResetToken(input: {
    userId: string
    tokenHash: string
    expiresAt: Date
  }): Promise<PasswordResetTokenRecord> {
    const doc = await PasswordResetToken.create(input)
    return toPasswordResetTokenRecord(doc as unknown as PasswordResetTokenDocument)
  }

  async findPasswordResetTokenByHash(
    tokenHash: string,
  ): Promise<PasswordResetTokenRecord | null> {
    const doc = await PasswordResetToken.findOne({ tokenHash }).lean()
    return doc ? toPasswordResetTokenRecord(doc as PasswordResetTokenDocument) : null
  }

  async deletePasswordResetToken(id: string): Promise<void> {
    await PasswordResetToken.deleteOne({ _id: id })
  }
}
