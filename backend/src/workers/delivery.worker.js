import { connectDatabase, disconnectDatabase } from '../config/database.js'
import { closeRedis } from '../config/redis.js'
import { env } from '../config/env.js'
import { logger } from '../config/logger.js'
import { acknowledge, claimStaleEvents, ensureConsumerGroup, promoteDueEvents, readEvents } from '../services/stream.service.js'
import { deliverEvent } from '../services/delivery.service.js'

let stopping = false

function unpack(entries) {
  return (entries ?? []).flatMap(([, messages]) => messages.map(([streamId, fields]) => ({ streamId, eventId: fields[fields.indexOf('eventId') + 1] })))
}

async function handle(message) {
  try {
    await deliverEvent(message.eventId)
    await acknowledge(message.streamId)
  }
  catch (error) { logger.error({ err: error, eventId: message.eventId }, 'delivery processing failed') }
}

async function run() {
  await connectDatabase()
  await ensureConsumerGroup()
  logger.info({ consumer: env.WORKER_CONSUMER_NAME }, 'delivery worker started')
  let lastClaim = 0
  while (!stopping) {
    await promoteDueEvents()
    if (Date.now() - lastClaim > 30_000) {
      const stale = await claimStaleEvents(env.WORKER_CONSUMER_NAME)
      await Promise.all(unpack([['stale', stale]]).map(handle))
      lastClaim = Date.now()
    }
    const messages = unpack(await readEvents(env.WORKER_CONSUMER_NAME))
    await Promise.all(messages.map(handle))
  }
}

run().catch((error) => { logger.fatal({ err: error }, 'worker failed to start'); process.exit(1) })
async function stop(signal) { stopping = true; logger.info({ signal }, 'worker stopping'); await Promise.allSettled([disconnectDatabase(), closeRedis()]); process.exit(0) }
process.once('SIGINT', stop)
process.once('SIGTERM', stop)
