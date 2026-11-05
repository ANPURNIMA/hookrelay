const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'

async function request(path, options) {
  const response = await fetch(`${API_URL}${path}`, options)
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? 'Request failed')
  return response.json()
}

export const api = {
  getDlq: () => request('/events/dlq'),
  getEvent: (eventId) => request(`/events/${eventId}`),
  replayEvent: (eventId) => request(`/events/${eventId}/replay`, { method: 'POST' }),
  createEvent: ({ endpointId, subscriberId, eventType, payload, idempotencyKey }) => request('/events', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': idempotencyKey },
    body: JSON.stringify({ endpointId, subscriberId, eventType, payload }),
  }),
  streamUrl: `${API_URL}/events/stream`,
}
