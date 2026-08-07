import type { Request, Response } from 'express'

import { API_VERSION, APP_NAME, APP_VERSION } from '../../shared/index.js'

import { env } from '../../config/env.js'
import { isDbConnected } from '../../db/connect.js'

export function getHealth(_req: Request, res: Response): void {
  res.json({
    data: {
      status: 'ok',
      name: APP_NAME,
      service: 'propertypro-api',
      version: APP_VERSION,
      apiVersion: API_VERSION,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    meta: {},
    error: null,
  })
}

export function getLivez(_req: Request, res: Response): void {
  res.status(200).send('ok')
}

export function getReadyz(_req: Request, res: Response): void {
  res.status(200).json({
    data: {
      status: 'ok',
      dependencies: {
        mongodb: isDbConnected() ? 'connected' : env.MONGODB_URI ? 'unavailable' : 'not_configured',
        redis: env.REDIS_URL ? 'configured' : 'not_configured',
      },
    },
    meta: {},
    error: null,
  })
}
