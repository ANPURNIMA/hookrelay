import { redis } from '../config/redis.js'
import { streamKeys } from '../lib/stream-keys.js'
import { logger } from '../config/logger.js'

const delayedPromotionScript = `
  local ids = redis.call('ZRANGEBYSCORE', KEYS[1], '-inf', ARGV[1], 'LIMIT', 0, ARGV[2])
  for _, id in ipairs(ids) do
    if redis.call('ZREM', KEYS[1], id) == 1 then
      redis.call('XADD', KEYS[2], '*', 'eventId', id)
    end
  end
  return ids
`

export async function ensureConsumerGroup() {
  try {
    await redis.xgroup('CREATE', streamKeys.ready, streamKeys.group, '0', 'MKSTREAM')
  } catch (error) {
    if (!String(error.message).includes('BUSYGROUP')) throw error
  }
}

export async function enqueueEvent(eventId) {
  return redis.xadd(streamKeys.ready, '*', 'eventId', String(eventId))
}

export async function scheduleEvent(eventId, dueAt) {
  return redis.zadd(streamKeys.delayed, dueAt.getTime(), String(eventId))
}

export async function promoteDueEvents(batchSize = 100) {
  const ids = await redis.eval(delayedPromotionScript, 2, streamKeys.delayed, streamKeys.ready, Date.now(), batchSize)
  if (ids.length) logger.debug({ count: ids.length }, 'promoted delayed events')
  return ids
}

export async function readEvents(consumer, blockMs = 1000) {
  return redis.xreadgroup('GROUP', streamKeys.group, consumer, 'COUNT', 10, 'BLOCK', blockMs, 'STREAMS', streamKeys.ready, '>')
}

export async function acknowledge(streamId) {
  return redis.xack(streamKeys.ready, streamKeys.group, streamId)
}

// Recover messages abandoned by a crashed worker. XAUTOCLAIM is safe to invoke periodically.
export async function claimStaleEvents(consumer, minIdleMs = 30_000) {
  const result = await redis.xautoclaim(streamKeys.ready, streamKeys.group, consumer, minIdleMs, '0-0', 'COUNT', 10)
  return result?.[1] ?? []
}
