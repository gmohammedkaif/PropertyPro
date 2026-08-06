import type { Role } from '@propertypro/shared'

import 'express'

declare global {
  namespace Express {
    interface Request {
      id: string
      user?: {
        id: string
        roles: Role[]
      }
    }
  }
}

export {}
