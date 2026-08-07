import type { Role } from '../shared/index.js'

import 'express'

declare global {
  namespace Express {
    interface Request {
      id: string
      user?: {
        id: string
        roles: Role[]
        email?: string
        name?: string
      }
    }
  }
}

export {}
