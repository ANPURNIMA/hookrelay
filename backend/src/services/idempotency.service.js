import { redis } from '../config/redis.js'
import { streamKeys } from '../lib/stream-keys.js'

const TTL_SECONDS = 86_400

export async function reserveIdempotencyKey(scope, key, response) {
  const redisKey = streamKeys.idempotency(scope, key)
  const result = await redis.set(redisKey, JSON.stringify(response), 'EX', TTL_SECONDS, 'NX')
  if (result === 'OK') return { acquired: true, redisKey }
  const existing = await redis.get(redisKey)
  return { acquired: false, response: existing ? JSON.parse(existing) : null }
}

export async function releaseIdempotencyKey(redisKey) {
  // The key is only released on a failed ingestion transaction; it is never released after 202.
  await redis.del(redisKey)
}
