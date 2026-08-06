import type { NextFunction, Request, RequestHandler, Response } from 'express'
import type { Role } from '@propertypro/shared'

import { ForbiddenError, UnauthorizedError } from '../../core/errors.js'
import { verifyAccessToken } from '../auth/auth.tokens.js'

/** Authenticates the `Authorization: Bearer <jwt>` header and attaches `req.user`. */
export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    next(new UnauthorizedError('Authentication required'))
    return
  }

  const payload = verifyAccessToken(header.slice('Bearer '.length))
  req.user = { id: payload.sub, roles: payload.roles }
  next()
}

/** Role gate — OR semantics over the authenticated user's roles. */
export function authorize(...allowed: Role[]): RequestHandler {
  return (req, _res, next) => {
    const roles = req.user?.roles ?? []
    if (!allowed.some((role) => roles.includes(role))) {
      next(new ForbiddenError('You do not have permission to perform this action'))
      return
    }
    next()
  }
}
