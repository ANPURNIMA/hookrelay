import { Event } from '../models/event.model.js'
import { DeliveryAttempt } from '../models/delivery-attempt.model.js'
import { signPayload } from '../lib/signature.js'
import { retryDelayMs, shouldRetry } from '../lib/retry.js'
import { scheduleEvent } from './stream.service.js'
import { publishDelivery } from './observability.service.js'
import { env } from '../config/env.js'
import { acquireToken } from './rate-limiter.service.js'
import { canExecute, recordFailure, recordSuccess } from './circuit-breaker.service.js'

async function postWebhook(event, endpoint) {
  const body = JSON.stringify(event.payload)
  const timestamp = String(Math.floor(Date.now() / 1000))
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), env.DELIVERY_TIMEOUT_MS)
  const started = performance.now()
  const requestHeaders = {
    'content-type': 'application/json', 'user-agent': 'HookRelay/1.0',
    'x-hookrelay-event': event.eventType, 'x-hookrelay-timestamp': timestamp,
    'x-hookrelay-signature': signPayload(endpoint.secretKey, timestamp, body),
    'x-idempotency-key': event.idempotencyKey,
  }
  try {
    const response = await fetch(endpoint.targetUrl, {
      method: 'POST', signal: controller.signal,
      headers: requestHeaders, body,
    })
    return { statusCode: response.status, responseBody: (await response.text()).slice(0, 16_384), requestHeaders, latencyMs: Math.round(performance.now() - started) }
  } catch (cause) {
    const error = cause.name === 'AbortError' ? `Delivery timed out after ${env.DELIVERY_TIMEOUT_MS}ms` : cause.message
    return { error, requestHeaders, latencyMs: Math.round(performance.now() - started) }
  } finally { clearTimeout(timer) }
}

async function deferDelivery(event, endpoint, delayMs, reason, metadata = {}) {
  const nextAttemptAt = new Date(Date.now() + Math.max(1, delayMs))
  // Deferrals are not delivery attempts: do not burn retry budget or create a failed attempt row.
  event.set({ status: 'queued', nextAttemptAt, lastError: reason })
  await event.save()
  await scheduleEvent(event.id, nextAttemptAt)
  await publishDelivery({
    eventId: event.id, eventType: event.eventType, status: 'queued', endpoint: endpoint.targetUrl,
    nextAttemptAt, deferred: true, deferReason: reason, ...metadata,
  })
}

export async function deliverEvent(eventId) {
  const event = await Event.findById(eventId).populate({ path: 'endpointId', select: '+secretKey' })
  if (!event || ['delivered', 'failed_dlq'].includes(event.status)) return
  const endpoint = event.endpointId
  if (!endpoint?.isActive) {
    event.set({ status: 'failed_dlq', lastError: 'Endpoint is inactive or no longer exists', failedAt: new Date() })
    await event.save()
    await publishDelivery({ eventId: event.id, status: 'failed_dlq', error: event.lastError, endpoint: endpoint?.targetUrl })
    return
  }

  // Both gates are distributed. A successful return from either one is a lease to this worker.
  const token = await acquireToken(endpoint)
  if (!token.allowed) {
    await deferDelivery(event, endpoint, token.retryAfterMs, 'Endpoint rate limit exhausted', {
      rateLimit: { remainingTokens: token.remainingTokens, retryAfterMs: token.retryAfterMs },
    })
    return
  }

  const circuit = await canExecute(endpoint.id)
  if (!circuit.allowed) {
    await deferDelivery(event, endpoint, circuit.retryAfterMs || env.CIRCUIT_PROBE_LEASE_MS, `Circuit ${circuit.state}`, {
      circuit: { state: circuit.state, retryAfterMs: circuit.retryAfterMs },
    })
    return
  }

  const attemptNumber = event.attemptCount + 1
  const result = await postWebhook(event, endpoint)
  await DeliveryAttempt.create({ eventId: event.id, attemptNumber, ...result, executedAt: new Date() })
  const delivered = result.statusCode >= 200 && result.statusCode < 300

  if (delivered) {
    await recordSuccess(endpoint.id)
    event.set({ status: 'delivered', attemptCount: attemptNumber, lastStatusCode: result.statusCode, deliveredAt: new Date(), nextAttemptAt: undefined })
    await event.save()
    await publishDelivery({ eventId: event.id, eventType: event.eventType, status: 'delivered', statusCode: result.statusCode, latencyMs: result.latencyMs, endpoint: endpoint.targetUrl, attemptNumber })
    return
  }

  // Only faults that indicate an unhealthy receiver trip the circuit. A 4xx is a bad event,
  // not a failed endpoint, so it proceeds to normal DLQ handling without touching the breaker.
  const circuitFailure = Boolean(result.error) || (result.statusCode >= 500 && result.statusCode <= 599)
  const circuitResult = circuitFailure ? await recordFailure(endpoint.id) : null
  const retryable = shouldRetry(result)
  const exhausted = attemptNumber >= event.maxAttempts
  if (retryable && !exhausted) {
    // If this failure opened the circuit, skip the normal short retry and wait for its cooldown.
    const delay = Math.max(retryDelayMs(attemptNumber), circuitResult?.retryAfterMs ?? 0)
    const nextAttemptAt = new Date(Date.now() + delay)
    event.set({ status: 'retrying', attemptCount: attemptNumber, lastStatusCode: result.statusCode, lastError: result.error, nextAttemptAt })
    await event.save()
    await scheduleEvent(event.id, nextAttemptAt)
    await publishDelivery({ eventId: event.id, eventType: event.eventType, status: 'retrying', statusCode: result.statusCode, error: result.error, latencyMs: result.latencyMs, endpoint: endpoint.targetUrl, attemptNumber, nextAttemptAt, retryDelayMs: delay })
    return
  }

  event.set({ status: 'failed_dlq', attemptCount: attemptNumber, lastStatusCode: result.statusCode, lastError: result.error || `Non-retryable HTTP ${result.statusCode}`, failedAt: new Date(), nextAttemptAt: undefined })
  await event.save()
  await publishDelivery({ eventId: event.id, eventType: event.eventType, status: 'failed_dlq', statusCode: result.statusCode, error: event.lastError, latencyMs: result.latencyMs, endpoint: endpoint.targetUrl, attemptNumber })
}
