import pino from 'pino'

import { APP_NAME, APP_VERSION } from '../shared/index.js'

import { env } from '../config/env.js'

export const logger = pino({
  level: env.LOG_LEVEL,
  base: {
    service: `${APP_NAME}-api`,
    version: APP_VERSION,
    nodeEnv: env.NODE_ENV,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token'],
    censor: '[REDACTED]',
  },
})
