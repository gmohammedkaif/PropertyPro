import type { AuthRepository } from './auth.repository.js'
import { MongoAuthRepository } from './mongoAuth.repository.js'

let repository: AuthRepository | null = null

export function getAuthRepository(): AuthRepository {
  if (!repository) {
    repository = new MongoAuthRepository()
  }
  return repository
}
