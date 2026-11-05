import 'dotenv/config'
import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  MONGODB_URI: z.string().min(1),
  REDIS_URL: z.string().min(1),
  REDIS_STREAM: z.string().default('hookrelay:events'),
  REDIS_STREAM_GROUP: z.string().default('hookrelay-delivery-workers'),
  REDIS_OBSERVABILITY_CHANNEL: z.string().default('hookrelay:delivery-events'),
  WORKER_CONSUMER_NAME: z.string().default(`worker-${process.pid}`),
  DELIVERY_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
  RETRY_BASE_DELAY_MS: z.coerce.number().int().positive().default(1000),
  RETRY_MAX_DELAY_MS: z.coerce.number().int().positive().default(300000),
  RETRY_JITTER_MS: z.coerce.number().int().nonnegative().default(1000),
  CIRCUIT_FAILURE_THRESHOLD: z.coerce.number().int().positive().default(5),
  CIRCUIT_FAILURE_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  CIRCUIT_BASE_COOLDOWN_MS: z.coerce.number().int().positive().default(45_000),
  CIRCUIT_MAX_COOLDOWN_MS: z.coerce.number().int().positive().default(300_000),
  // Must exceed the outbound request timeout so two workers never probe concurrently.
  CIRCUIT_PROBE_LEASE_MS: z.coerce.number().int().positive().default(7_000),
  RATE_LIMIT_DEFAULT_RPS: z.coerce.number().positive().default(50),
  RATE_LIMIT_DEFAULT_BURST: z.coerce.number().positive().default(10),
})

export const env = schema.parse(process.env)
