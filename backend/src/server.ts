import 'dotenv/config'

import { createApp } from './app.js'
import { env } from './config/env.js'
import { logger } from './core/logger.js'
import { connectDatabase, disconnectDatabase } from './db/connect.js'

import { sweepLeaseExpiries } from './modules/tenancy/tenancyExpiry.service.js'
import { sweepPaymentOverdues } from './modules/payment/paymentOverdue.service.js'
import { syncPropertyOccupancy } from './modules/property/propertyOccupancy.service.js'

const dbReady = await connectDatabase()

const app = createApp()

if (!process.env.VERCEL) {
  const server = app.listen(env.PORT, env.HOST, () => {
    logger.info({ host: env.HOST, port: env.PORT, db: dbReady ? 'mongodb' : 'memory' }, 'PropertyPro API listening')

    // Initial sweep and hourly scheduled sweeper for lease expiries, payment overdues, and property occupancy
    void sweepLeaseExpiries().catch(() => null)
    void sweepPaymentOverdues().catch(() => null)
    void syncPropertyOccupancy().catch(() => null)
    const expiryInterval = setInterval(() => {
      void sweepLeaseExpiries().catch(() => null)
      void sweepPaymentOverdues().catch(() => null)
      void syncPropertyOccupancy().catch(() => null)
    }, 60 * 60 * 1000)
    expiryInterval.unref()
  })

  const shutdown = (signal: NodeJS.Signals): void => {
    logger.info({ signal }, 'Shutting down gracefully')

    server.close(() => {
      void disconnectDatabase().finally(() => {
        logger.info('HTTP server closed')
        process.exit(0)
      })
    })

    // Force-exit if graceful shutdown takes too long.
    setTimeout(() => process.exit(1), 10_000).unref()
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

export default app
