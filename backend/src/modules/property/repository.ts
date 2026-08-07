import { isDbConnected } from '../../db/connect.js'
import { logger } from '../../core/logger.js'
import type { PropertyRepository } from './property.repository.js'
import { InMemoryPropertyRepository } from './memoryProperty.repository.js'
import { MongoPropertyRepository } from './mongoProperty.repository.js'

let repository: PropertyRepository | null = null

export function getPropertyRepository(): PropertyRepository {
  if (!repository) {
    if (isDbConnected()) {
      logger.info('Using MongoDB property repository')
      repository = new MongoPropertyRepository()
    } else {
      logger.warn('Using in-memory property repository (dev fallback)')
      repository = new InMemoryPropertyRepository()
    }
  }
  return repository
}
