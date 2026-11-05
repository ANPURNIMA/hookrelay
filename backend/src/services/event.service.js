import { randomUUID } from 'node:crypto'
import { Types } from 'mongoose'
import { Endpoint } from '../models/endpoint.model.js'
import { Event } from '../models/event.model.js'
import { AppError } from '../lib/errors.js'
import { enqueueEvent } from './stream.service.js'
import { releaseIdempotencyKey, reserveIdempotencyKey } from './idempotency.service.js'

export async function resolveEndpoint({ endpointId, targetUrl, subscriberId }) {
  const endpoint = endpointId
    ? await Endpoint.findOne({ _id: endpointId, subscriberId, isActive: true })
    : await Endpoint.findOne({ targetUrl, subscriberId, isActive: true })
  if (!endpoint) throw new AppError(404, 'Active endpoint not found for this subscriber')
  if (targetUrl && endpoint.targetUrl !== targetUrl) throw new AppError(422, 'targetUrl does not match registered endpoint')
  return endpoint
}

export async function ingestEvent({ endpointId, targetUrl, subscriberId, eventType, payload, idempotencyKey }) {
  const endpoint = await resolveEndpoint({ endpointId, targetUrl, subscriberId })
  const key = idempotencyKey || randomUUID()
  // Allocate before SET NX so a racing duplicate gets the definitive event id immediately.
  const eventId = new Types.ObjectId()
  const response = { eventId: String(eventId), status: 'queued' }
  const reservation = await reserveIdempotencyKey(`${subscriberId}:${endpoint.id}`, key, response)
  if (!reservation.acquired) {
    // Redis is the atomic gate; MongoDB supplies the current state for a meaningful duplicate response.
    const existing = reservation.response?.eventId && await Event.findById(reservation.response.eventId).select('status').lean()
    return { duplicate: true, event: existing ? { eventId: String(existing._id), status: existing.status } : reservation.response }
  }

  try {
    const event = await Event.create({ _id: eventId, endpointId: endpoint.id, eventType, payload, idempotencyKey: key })
    await enqueueEvent(event.id)
    return { duplicate: false, event: response }
  } catch (error) {
    await releaseIdempotencyKey(reservation.redisKey)
    throw error
  }
}

export async function replayDlqEvent(id) {
  const event = await Event.findOneAndUpdate(
    { _id: id, status: 'failed_dlq' },
    { $set: { status: 'queued', attemptCount: 0, lastError: undefined, lastStatusCode: undefined, nextAttemptAt: undefined, failedAt: undefined } },
    { new: true },
  )
  if (!event) throw new AppError(404, 'DLQ event not found')
  await enqueueEvent(event.id)
  return event
}
