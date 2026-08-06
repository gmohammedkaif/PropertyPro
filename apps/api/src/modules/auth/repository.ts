import { isDbConnected } from '../../db/connect.js'
import { logger } from '../../core/logger.js'
import type { AuthRepository } from './auth.repository.js'
import { InMemoryAuthRepository } from './memoryAuth.repository.js'
import { MongoAuthRepository } from './mongoAuth.repository.js'

let repository: AuthRepository | null = null

/**
 * Returns the auth repository for the current runtime. Selected once at first use
 * (after the database has had a chance to connect at boot): MongoDB when ready,
 * otherwise the in-memory fallback.
 */
export function getAuthRepository(): AuthRepository {
  if (!repository) {
    if (isDbConnected()) {
      logger.info('Using MongoDB auth repository')
      repository = new MongoAuthRepository()
    } else {
      logger.warn('Using in-memory auth repository (dev fallback)')
      repository = new InMemoryAuthRepository()
    }
  }
  return repository
}
