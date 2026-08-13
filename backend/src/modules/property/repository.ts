import type { PropertyRepository } from './property.repository.js'
import { MongoPropertyRepository } from './mongoProperty.repository.js'

let repository: PropertyRepository | null = null

export function getPropertyRepository(): PropertyRepository {
  if (!repository) {
    repository = new MongoPropertyRepository()
  }
  return repository
}
