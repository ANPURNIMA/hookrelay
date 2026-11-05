import { readFile } from 'node:fs/promises'
import { redis } from '../config/redis.js'
import { env } from '../config/env.js'
import { streamKeys } from '../lib/stream-keys.js'

const scriptUrl = new URL('../lua/tokenBucket.lua', import.meta.url)
let tokenBucketScript

async function loadScript() {
  tokenBucketScript ??= readFile(scriptUrl, 'utf8')
  return tokenBucketScript
}

/**
 * Atomically reserves one outbound-delivery token. Bucket capacity is the
 * burst allowance; refillRate is sustained requests per second.
 */
export async function acquireToken(endpoint) {
  const refillRate = Number(endpoint.rateLimitPerSecond ?? env.RATE_LIMIT_DEFAULT_RPS)
  const capacity = Number(endpoint.burstCapacity ?? env.RATE_LIMIT_DEFAULT_BURST)
  const [allowed, retryAfterMs, remainingTokens] = await redis.eval(
    await loadScript(), 1, streamKeys.tokenBucket(endpoint.id), Date.now(), refillRate, capacity, 1,
  )

  return {
    allowed: Number(allowed) === 1,
    retryAfterMs: Math.max(1, Number(retryAfterMs)),
    remainingTokens: Number(remainingTokens),
  }
}
