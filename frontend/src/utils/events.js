export function normalizeEvent(event) {
  return {
    ...event,
    eventId: event.eventId ?? event._id ?? event.id,
    endpoint: event.endpoint ?? event.endpointId?.targetUrl ?? 'Unknown destination',
    eventType: event.eventType ?? 'unknown.event',
    emittedAt: event.emittedAt ?? event.updatedAt ?? event.createdAt ?? new Date().toISOString(),
    attemptNumber: event.attemptNumber ?? event.attemptCount ?? 0,
  }
}

export function statusLabel(status, statusCode, attempt) {
  if (status === 'delivered') return `${statusCode ?? 200} DELIVERED`
  if (status === 'retrying') return `${statusCode ?? 500} RETRYING (ATTEMPT ${attempt}/5)`
  if (status === 'failed_dlq') return 'TIMEOUT FAILED (DLQ)'
  return 'QUEUED'
}
