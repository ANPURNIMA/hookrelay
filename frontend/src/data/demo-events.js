export const demoEvents = [
  { eventId: '6720e2…b19a', status: 'delivered', statusCode: 200, eventType: 'invoice.paid', endpoint: 'https://billing.acme.dev/hooks/payments', latencyMs: 184, attemptNumber: 1, emittedAt: new Date(Date.now() - 120).toISOString() },
  { eventId: '6720e1…809f', status: 'retrying', statusCode: 503, eventType: 'project.member_added', endpoint: 'https://api.northstar.io/webhooks/relay', latencyMs: 5002, attemptNumber: 2, emittedAt: new Date(Date.now() - 2100).toISOString() },
  { eventId: '6720df…c7d1', status: 'failed_dlq', statusCode: 422, eventType: 'document.indexed', endpoint: 'https://receiver.example.net/events', latencyMs: 91, attemptNumber: 1, emittedAt: new Date(Date.now() - 4800).toISOString() },
]
