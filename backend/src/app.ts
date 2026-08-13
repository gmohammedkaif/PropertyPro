import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { pinoHttp } from 'pino-http'

import { API_PREFIX } from './shared/index.js'

import { env } from './config/env.js'
import { logger } from './core/logger.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { requestId } from './middleware/requestId.js'
import adminRoutes from './modules/admin/admin.routes.js'
import authRoutes from './modules/auth/auth.routes.js'
import healthRoutes from './modules/health/health.routes.js'
import propertyRoutes from './modules/property/property.routes.js'
import rentalRequestRoutes from './modules/rentalRequest/rentalRequest.routes.js'
import tenancyRoutes from './modules/tenancy/tenancy.routes.js'
import maintenanceRoutes from './modules/maintenance/maintenance.routes.js'
import notificationRoutes from './modules/notification/notification.routes.js'
import paymentRoutes from './modules/payment/payment.routes.js'
import analyticsRoutes from './modules/analytics/analytics.routes.js'

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
  app.use((req, res, next) => {
    if (req.path.endsWith('/properties/upload-image')) {
      express.json({ limit: '15mb' })(req, res, next)
    } else {
      express.json({ limit: '1mb' })(req, res, next)
    }
  })
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

  app.use(API_PREFIX, adminRoutes)
  app.use(API_PREFIX, authRoutes)
  app.use(API_PREFIX, healthRoutes)
  app.use(API_PREFIX, propertyRoutes)
  app.use(API_PREFIX, rentalRequestRoutes)
  app.use(API_PREFIX, tenancyRoutes)
  app.use(API_PREFIX, maintenanceRoutes)
  app.use(API_PREFIX, notificationRoutes)
  app.use(API_PREFIX, paymentRoutes)
  app.use(API_PREFIX, analyticsRoutes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
