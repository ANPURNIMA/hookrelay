import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../lib/async-handler.js'
import { AppError } from '../lib/errors.js'
import { attachSseClient } from '../services/observability.service.js'
import { ingestEvent, replayDlqEvent } from '../services/event.service.js'
import { Event } from '../models/event.model.js'
import { DeliveryAttempt } from '../models/delivery-attempt.model.js'

const router = Router()

const eventSchema = z.object({
  endpointId: z.string().optional(),
  targetUrl: z.string().url().optional(),
  subscriberId: z.string().min(1),
  eventType: z.string().min(1).max(160),
  payload: z.unknown(),
}).refine((input) => input.endpointId || input.targetUrl, { message: 'endpointId or targetUrl is required' })

router.post('/', asyncHandler(async (req, res) => {
  const input = eventSchema.parse(req.body)
  const idempotencyKey = req.get('Idempotency-Key') || req.body.idempotencyKey
  const result = await ingestEvent({ ...input, idempotencyKey })
  res.status(result.duplicate ? 200 : 202).json({ duplicate: result.duplicate, ...result.event })
}))

router.get('/stream', (req, res) => {
  res.status(200).set({
    'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive', 'X-Accel-Buffering': 'no',
  })
  res.flushHeaders()
  const detach = attachSseClient(res)
  req.on('close', detach)
})

router.get('/dlq', asyncHandler(async (req, res) => {
  const events = await Event.find({ status: 'failed_dlq' }).sort({ failedAt: -1 }).limit(100).lean()
  res.json({ data: events })
}))

router.get('/:id', asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).populate('endpointId', 'subscriberId targetUrl').lean()
  if (!event) throw new AppError(404, 'Event not found')
  const attempts = await DeliveryAttempt.find({ eventId: event._id }).sort({ attemptNumber: 1 }).lean()
  res.json({ data: { ...event, attempts } })
}))

router.post('/:id/replay', asyncHandler(async (req, res) => {
  const event = await replayDlqEvent(req.params.id)
  res.status(202).json({ eventId: event.id, status: event.status })
}))

export default router
