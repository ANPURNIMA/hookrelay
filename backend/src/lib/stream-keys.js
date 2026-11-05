import { env } from '../config/env.js'

export const streamKeys = {
  ready: env.REDIS_STREAM,
  delayed: `${env.REDIS_STREAM}:delayed`,
  group: env.REDIS_STREAM_GROUP,
  idempotency: (scope, key) => `hookrelay:idempotency:${scope}:${key}`,
  circuit: (endpointId) => `hookrelay:circuit:${endpointId}`,
  tokenBucket: (endpointId) => `hookrelay:ratelimit:${endpointId}`,
}
