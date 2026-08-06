import type { Request, Response } from 'express'

import { env } from '../../config/env.js'
import { AuthService } from './auth.service.js'
import {
  clearRefreshCookie,
  requireRefreshCookie,
  setRefreshCookie,
} from './auth.cookies.js'
import {
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  registerSchema,
  resetPasswordSchema,
} from './auth.schemas.js'

const authService = new AuthService()

export async function register(req: Request, res: Response): Promise<void> {
  const input = registerSchema.parse(req.body)
  const session = await authService.register(input)
  setRefreshCookie(res, session.refreshToken)
  res.status(201).json({
    data: { accessToken: session.accessToken, user: session.user },
    meta: {},
    error: null,
  })
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = loginSchema.parse(req.body)
  const session = await authService.login(input)
  setRefreshCookie(res, session.refreshToken)
  res.json({
    data: { accessToken: session.accessToken, user: session.user },
    meta: {},
    error: null,
  })
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const token = requireRefreshCookie(req)
  const session = await authService.refresh(token)
  setRefreshCookie(res, session.refreshToken)
  res.json({
    data: { accessToken: session.accessToken, user: session.user },
    meta: {},
    error: null,
  })
}

export async function logout(req: Request, res: Response): Promise<void> {
  const { allDevices } = logoutSchema.parse(req.body ?? {})
  const token = requireRefreshCookie(req)
  await authService.logout(token, allDevices)
  clearRefreshCookie(res)
  res.status(204).send()
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = forgotPasswordSchema.parse(req.body)
  const result = await authService.forgotPassword(email)
  // Always return 202 — no user enumeration. In development the reset token is
  // echoed back so the full flow can be exercised without an email provider.
  res.status(202).json({
    data: null,
    meta:
      result && env.NODE_ENV !== 'production'
        ? { resetToken: result.resetToken }
        : {},
    error: null,
  })
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, password } = resetPasswordSchema.parse(req.body)
  await authService.resetPassword(token, password)
  clearRefreshCookie(res)
  res.status(204).send()
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new Error('authenticate() must run before me()')
  const user = await authService.me(req.user.id)
  res.json({ data: user, meta: {}, error: null })
}
