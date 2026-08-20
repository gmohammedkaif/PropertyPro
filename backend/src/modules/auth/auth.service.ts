import bcrypt from 'bcryptjs'
import type { AuthUser, Role } from '../../shared/index.js'

import {
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
} from '../../core/errors.js'
import { logger } from '../../core/logger.js'
import { getAuthRepository } from './repository.js'
import {
  generateRefreshToken,
  generateResetToken,
  hashToken,
  newFamilyId,
  refreshTokenExpiry,
  resetTokenExpiry,
  signAccessToken,
} from './auth.tokens.js'
import type { UserRecord } from './auth.types.js'

const BCRYPT_ROUNDS = 12

/** Precomputed bcrypt hash of a throwaway password — equalizes login timing. */
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('timing-equalizer-not-a-real-password', BCRYPT_ROUNDS)

export interface AuthSession {
  user: AuthUser
  accessToken: string
  refreshToken: string
}

export interface ResetTokenResult {
  resetToken: string
}

export class AuthService {
  register = async (input: {
    email: string
    password: string
    username?: string
    firstName?: string
    lastName?: string
    role?: Role
  }): Promise<AuthSession & { pendingApproval?: boolean }> => {
    const email = input.email.trim().toLowerCase()
    const role = input.role ?? 'tenant'

    // Prevent registering as admin from the public API
    if (role === ('admin' as Role)) {
      throw new ForbiddenError('Super Admin registration is not allowed.')
    }

    const existing = await this.repository.findByEmail(email)
    if (existing) {
      throw new ConflictError('An account with this email already exists.')
    }

    const name = input.username?.trim() || `${input.firstName ?? ''} ${input.lastName ?? ''}`.trim() || 'User'
    const nameParts = name.split(' ')
    const firstName = nameParts[0] || name
    const lastName = nameParts.slice(1).join(' ') || ''

    const isOwner = role === 'owner'
    const status = isOwner ? 'pending_approval' : 'active'

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS)
    const user = await this.repository.createUser({
      email,
      passwordHash,
      roles: [role],
      firstName,
      lastName,
      status,
    })

    logger.info({ userId: user.id, roles: user.roles, status: user.status }, 'User registered')

    if (isOwner) {
      // Owners require Super Admin approval before getting an active session
      return {
        user: toAuthUser(user),
        accessToken: '',
        refreshToken: '',
        pendingApproval: true,
      }
    }

    return this.issueSession(user)
  }

  login = async (input: { email: string; password: string }): Promise<AuthSession> => {
    const email = input.email.trim().toLowerCase()
    const user = await this.repository.findByEmail(email)

    // Constant-time-ish comparison even when the account does not exist.
    const passwordOk = await bcrypt.compare(
      input.password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    )
    if (!user || !passwordOk) {
      throw new UnauthorizedError('Invalid email or password.')
    }
    if (user.status === 'pending_approval') {
      throw new ForbiddenError('Your owner account is currently pending Super Admin approval.')
    }
    if (user.status === 'rejected') {
      throw new ForbiddenError('Your request has not yet been approved.')
    }
    if (user.status !== 'active') {
      throw new ForbiddenError('This account is not active. Contact support.')
    }

    logger.info({ userId: user.id }, 'User logged in')
    return this.issueSession(user)
  }

  refresh = async (refreshToken: string): Promise<AuthSession> => {
    const record = await this.repository.findRefreshTokenByHash(hashToken(refreshToken))
    if (!record) {
      throw new UnauthorizedError('Session expired. Please sign in again.')
    }

    // Reuse detection: a rotated/revoked token presented again revokes the family,
    // unless presented within a 15-second grace period (e.g. rapid page reloads/concurrency).
    if (record.revokedAt) {
      const revokedTime = new Date(record.revokedAt).getTime()
      const timeSinceRevoked = Date.now() - revokedTime
      const ROTATION_GRACE_PERIOD_MS = 15_000

      if (timeSinceRevoked > ROTATION_GRACE_PERIOD_MS) {
        await this.repository.revokeFamily(record.familyId)
        logger.warn(
          { userId: record.userId, familyId: record.familyId, timeSinceRevoked },
          'Refresh token reuse detected outside grace period — session family revoked',
        )
        throw new UnauthorizedError('Session expired. Please sign in again.')
      }

      logger.info(
        { userId: record.userId, familyId: record.familyId, timeSinceRevoked },
        'Refresh token presented within rotation grace period — issuing new session token in family',
      )
    }

    if (record.expiresAt.getTime() <= Date.now()) {
      await this.repository.revokeRefreshToken(record.id)
      throw new UnauthorizedError('Session expired. Please sign in again.')
    }

    const user = await this.repository.findById(record.userId)
    if (!user || user.status !== 'active') {
      await this.repository.revokeFamily(record.familyId)
      throw new UnauthorizedError('Session expired. Please sign in again.')
    }

    // Rotation: revoke the old token, issue a new one in the same family.
    await this.repository.revokeRefreshToken(record.id)
    const refreshTokenNext = await this.issueRefreshToken(user.id, record.familyId)
    return this.buildSession(user, refreshTokenNext)
  }

  logout = async (refreshToken: string, allDevices = false): Promise<void> => {
    if (!refreshToken) return
    const record = await this.repository.findRefreshTokenByHash(hashToken(refreshToken))
    if (!record) return
    if (allDevices) {
      await this.repository.revokeAllForUser(record.userId)
      logger.info({ userId: record.userId }, 'All sessions revoked')
    } else {
      await this.repository.revokeRefreshToken(record.id)
      logger.info({ userId: record.userId }, 'Session revoked')
    }
  }

  forgotPassword = async (email: string): Promise<ResetTokenResult | null> => {
    const user = await this.repository.findByEmail(email.trim().toLowerCase())
    if (!user) return null

    const resetToken = generateResetToken()
    await this.repository.createPasswordResetToken({
      userId: user.id,
      tokenHash: hashToken(resetToken),
      expiresAt: resetTokenExpiry(1),
    })
    logger.info({ userId: user.id }, 'Password reset token issued')
    return { resetToken }
  }

  resetPassword = async (token: string, password: string): Promise<void> => {
    const record = await this.repository.findPasswordResetTokenByHash(hashToken(token))
    if (!record || record.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedError('This reset link is invalid or has expired.')
    }

    const user = await this.repository.findById(record.userId)
    if (!user) {
      await this.repository.deletePasswordResetToken(record.id)
      throw new UnauthorizedError('This reset link is invalid or has expired.')
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
    await this.repository.updatePassword(user.id, passwordHash)
    await this.repository.revokeAllForUser(user.id)
    await this.repository.deletePasswordResetToken(record.id)

    logger.info({ userId: user.id }, 'Password reset completed — all sessions revoked')
  }

  me = async (userId: string): Promise<AuthUser> => {
    const user = await this.repository.findById(userId)
    if (!user) {
      throw new UnauthorizedError('Account not found.')
    }
    if (user.status !== 'active') {
      throw new ForbiddenError('This account is not active. Contact support.')
    }
    return toAuthUser(user)
  }

  updateProfile = async (userId: string, input: { name?: string; phone?: string; avatarUrl?: string }): Promise<AuthUser> => {
    const user = await this.repository.findById(userId)
    if (!user) {
      throw new UnauthorizedError('Account not found.')
    }

    const profileInput: { firstName?: string; lastName?: string; phone?: string; avatarUrl?: string } = {}
    if (input.name !== undefined) {
      const parts = input.name.trim().split(/\s+/)
      profileInput.firstName = parts[0] || ''
      profileInput.lastName = parts.slice(1).join(' ') || ''
    }
    if (input.phone !== undefined) {
      profileInput.phone = input.phone.trim()
    }
    if (input.avatarUrl !== undefined) {
      profileInput.avatarUrl = input.avatarUrl.trim()
    }

    const updated = await this.repository.updateProfile(userId, profileInput)
    if (!updated) {
      throw new UnauthorizedError('Account not found.')
    }

    logger.info({ userId }, 'Profile updated')
    return toAuthUser(updated)
  }

  changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<void> => {
    const user = await this.repository.findById(userId)
    if (!user) {
      throw new UnauthorizedError('Account not found.')
    }

    const currentOk = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!currentOk) {
      throw new UnauthorizedError('Current password is incorrect.')
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)
    await this.repository.updatePassword(user.id, passwordHash)
    await this.repository.revokeAllForUser(user.id)

    logger.info({ userId }, 'Password changed — all sessions revoked')
  }

  private get repository() {
    return getAuthRepository()
  }

  private async issueRefreshToken(userId: string, familyId: string): Promise<string> {
    const token = generateRefreshToken()
    await this.repository.createRefreshToken({
      userId,
      familyId,
      tokenHash: hashToken(token),
      expiresAt: refreshTokenExpiry(),
    })
    return token
  }

  private async issueSession(user: UserRecord): Promise<AuthSession> {
    const refreshToken = await this.issueRefreshToken(user.id, newFamilyId())
    return this.buildSession(user, refreshToken)
  }

  private buildSession(user: UserRecord, refreshToken: string): AuthSession {
    return {
      user: toAuthUser(user),
      accessToken: signAccessToken(user),
      refreshToken,
    }
  }
}

function toAuthUser(user: UserRecord): AuthUser {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
  return {
    id: user.id,
    email: user.email,
    name: name || user.email,
    phone: user.phone || '',
    roles: user.roles,
    status: user.status,
    avatarUrl: user.avatarUrl || '',
  }
}
