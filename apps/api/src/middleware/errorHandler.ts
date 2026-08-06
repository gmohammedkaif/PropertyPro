import type { ErrorRequestHandler, NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'

import { AppError } from '../core/errors.js'
import { logger } from '../core/logger.js'

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    data: null,
    meta: {},
    error: {
      code: 'NOT_FOUND',
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    },
  })
}

export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof ZodError) {
    res.status(400).json({
      data: null,
      meta: {},
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload',
        details: err.issues,
      },
    })
    return
  }

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, requestId: req.id }, err.message)
    }
    res.status(err.statusCode).json({
      data: null,
      meta: {},
      error: { code: err.code, message: err.message },
    })
    return
  }

  const status = (err as { status?: number } | null)?.status ?? 500
  if (status >= 500) {
    logger.error({ err, requestId: req.id }, 'Unhandled error')
  }

  res.status(status).json({
    data: null,
    meta: {},
    error: {
      code: 'INTERNAL',
      message: status >= 500 ? 'Internal server error' : 'Something went wrong',
    },
  })
}
