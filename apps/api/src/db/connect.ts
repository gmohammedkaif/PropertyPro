import mongoose from 'mongoose'

import { env } from '../config/env.js'
import { logger } from '../core/logger.js'

/**
 * Connects to MongoDB when `MONGODB_URI` is configured. In development without a
 * URI the API degrades gracefully to an in-memory auth store; production fails fast.
 *
 * @returns `true` when a real MongoDB connection is ready.
 */
export async function connectDatabase(): Promise<boolean> {
  if (!env.MONGODB_URI) {
    logger.warn(
      'MONGODB_URI is not configured — using the in-memory auth store. Set MONGODB_URI for persistent storage.',
    )
    return false
  } 

  try {
    mongoose.set('strictQuery', true)
    await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
    logger.info({ uri: redactMongoUri(env.MONGODB_URI) }, 'MongoDB connected')
    return true
  } catch (err) {
    if (env.NODE_ENV === 'production') {
      logger.error({ err }, 'MongoDB connection failed in production — aborting startup')
      throw err
    }
    logger.error(
      { err },
      'MongoDB connection failed — falling back to the in-memory auth store',
    )
    return false
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
    logger.info('MongoDB disconnected')
  }
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1
}

function redactMongoUri(uri: string): string {
  return uri.replace(/\/\/[^@/]+@/, '//***@')
}
