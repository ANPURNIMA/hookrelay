import { redis, redisSubscriber } from '../config/redis.js'
import { env } from '../config/env.js'
import { logger } from '../config/logger.js'

const clients = new Set()
let started = false

export async function startObservabilityBridge() {
  if (started) return
  started = true
  await redisSubscriber.subscribe(env.REDIS_OBSERVABILITY_CHANNEL)
  redisSubscriber.on('message', (channel, message) => {
    if (channel !== env.REDIS_OBSERVABILITY_CHANNEL) return
    for (const client of clients) client.write(`event: delivery\ndata: ${message}\n\n`)
  })
  logger.info('SSE observability bridge ready')
}

export async function publishDelivery(event) {
  await redis.publish(env.REDIS_OBSERVABILITY_CHANNEL, JSON.stringify({ ...event, emittedAt: new Date().toISOString() }))
}

export function attachSseClient(response) {
  clients.add(response)
  response.write(`event: connected\ndata: ${JSON.stringify({ connectedAt: new Date().toISOString() })}\n\n`)
  const heartbeat = setInterval(() => response.write(': keepalive\n\n'), 25_000)
  return () => { clearInterval(heartbeat); clients.delete(response) }
}
