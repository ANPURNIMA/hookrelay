import { createApp } from './app.js'
import { env } from './config/env.js'
import { connectDatabase, disconnectDatabase } from './config/database.js'
import { closeRedis } from './config/redis.js'
import { startObservabilityBridge } from './services/observability.service.js'
import { logger } from './config/logger.js'

await connectDatabase()
await startObservabilityBridge()
const server = createApp().listen(env.PORT, () => logger.info({ port: env.PORT }, 'HTTP server listening'))

async function shutdown(signal) {
  logger.info({ signal }, 'shutting down server')
  server.close(async () => { await Promise.allSettled([disconnectDatabase(), closeRedis()]); process.exit(0) })
}
process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
