import Redis from 'ioredis'
import { env } from './env.js'

const options = {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  retryStrategy: (attempt) => Math.min(attempt * 100, 2000),
}

export const redis = new Redis(env.REDIS_URL, options)
export const redisSubscriber = new Redis(env.REDIS_URL, options)

export async function closeRedis() {
  await Promise.allSettled([redis.quit(), redisSubscriber.quit()])
}
