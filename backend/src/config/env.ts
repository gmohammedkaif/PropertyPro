import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().max(65535).default(4000),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  MONGODB_URI: z.string().optional(),
  REDIS_URL: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().min(16).default('dev-access-secret-change-me'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  AUTH_COOKIE_NAME: z.string().default('pp_refresh'),
  AUTH_COOKIE_SECURE: z.coerce.boolean().default(false),
  AUTH_RATE_LIMIT: z.coerce.number().int().positive().default(10),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  process.stderr.write(
    `Invalid environment configuration: ${JSON.stringify(
      parsed.error.flatten().fieldErrors,
      null,
      2,
    )}\n`,
  )
  process.exit(1)
}

// Production must not boot with the throwaway development secrets.
if (
  parsed.data.NODE_ENV === 'production' &&
  parsed.data.JWT_ACCESS_SECRET === 'dev-access-secret-change-me'
) {
  process.stderr.write(
    'Invalid environment configuration: JWT_ACCESS_SECRET must be set to a strong secret in production.\n',
  )
  process.exit(1)
}

export type Env = z.infer<typeof envSchema>

export const env: Env = parsed.data
