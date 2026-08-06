import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { pinoHttp } from 'pino-http'

import { API_PREFIX } from '@propertypro/shared'

import { env } from './config/env.js'
import { logger } from './core/logger.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { requestId } from './middleware/requestId.js'
import authRoutes from './modules/auth/auth.routes.js'
import healthRoutes from './modules/health/health.routes.js'
import propertyRoutes from './modules/property/property.routes.js'

export function createApp(): express.Express {
  const app = express()

  app.disable('x-powered-by')
  app.set('trust proxy', 1)

  app.use(requestId)
  app.use(helmet())
  app.use(
    cors({
      origin: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '1mb' }))
  app.use(cookieParser())

  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req) => req.url?.includes('/health') ?? false,
      },
    }),
  )

  // Liveness probe for orchestrators / load balancers.
  app.get('/healthz', (_req, res) => res.status(200).send('ok'))

  app.use(API_PREFIX, authRoutes)
  app.use(API_PREFIX, healthRoutes)
  app.use(API_PREFIX, propertyRoutes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
