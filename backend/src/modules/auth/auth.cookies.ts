import type { CookieOptions, Response } from 'express'
import { AUTH_REFRESH_COOKIE } from '../../shared/index.js'

import { env } from '../../config/env.js'
import { UnauthorizedError } from '../../core/errors.js'

export const AUTH_COOKIE_PATH = '/api/v1/auth'

export function refreshCookieOptions(): CookieOptions {
  const isProd = env.NODE_ENV === 'production'
  return {
    httpOnly: true,
    secure: isProd || env.AUTH_COOKIE_SECURE,
    sameSite: isProd ? 'none' : 'lax',
    path: AUTH_COOKIE_PATH,
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  }
}

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(env.AUTH_COOKIE_NAME, token, refreshCookieOptions())
}

export function clearRefreshCookie(res: Response): void {
  const options = refreshCookieOptions()
  res.clearCookie(env.AUTH_COOKIE_NAME, {
    path: AUTH_COOKIE_PATH,
    secure: options.secure,
    sameSite: options.sameSite,
    httpOnly: options.httpOnly,
  })
}

export function readRefreshCookie(req: import('express').Request): string | undefined {
  return req.cookies?.[env.AUTH_COOKIE_NAME] as string | undefined
}

export function requireRefreshCookie(req: import('express').Request): string {
  const token = readRefreshCookie(req)
  if (!token) {
    throw new UnauthorizedError('Session expired. Please sign in again.')
  }
  return token
}

export { UnauthorizedError, AUTH_REFRESH_COOKIE }
