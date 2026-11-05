# EventStream / HookRelay — Backend

The backend core for EventStream / HookRelay: a fault-tolerant webhook and asynchronous task delivery engine built with Express, Redis Streams, and MongoDB. The HTTP API only persists and enqueues; the dedicated `src/workers/delivery.worker.js` process executes outbound delivery.

## Architecture

```text
POST /events
  -> Redis SET NX EX (24h idempotency reservation)
  -> MongoDB Event (source of truth)
  -> Redis Stream `hookrelay:events`
  -> worker consumer group
  -> signed POST (5s deadline)
  -> MongoDB DeliveryAttempt + Event state
       | success -> Redis Pub/Sub -> SSE clients
       | retry   -> Redis sorted-set delay queue -> stream
       | final   -> Event.status = failed_dlq -> replay API
```

The delayed queue is a Redis sorted set. Workers atomically promote due IDs into the stream with Lua, so retry scheduling survives worker restarts. Redis consumer groups retain unacknowledged messages; workers reclaim abandoned messages with `XAUTOCLAIM`.

## Setup

```bash
cp .env.example .env
npm install
npm run seed:endpoint -- acme https://webhook.site/your-id a-long-random-subscriber-secret
npm run dev
npm run worker
```

Create an event using the endpoint id printed by the seed command. `subscriberId` is shown in the body only to keep this standalone example runnable; in production, derive it from authenticated tenant context instead.

```bash
curl -X POST http://localhost:3000/api/v1/events \
  -H 'content-type: application/json' \
  -H 'idempotency-key: invoice-1042' \
  -d '{
    "subscriberId":"acme",
    "endpointId":"<endpoint-id>",
    "eventType":"invoice.paid",
    "payload":{"invoiceId":"inv_1042","amount":4999}
  }'
```

To stream delivery state, connect an `EventSource` to `GET /api/v1/events/stream`. The stream receives `delivery` events with a terminal or retry status, latency, endpoint, and attempt number.

## API

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/endpoints` | Register a subscriber endpoint; secrets are excluded from normal reads. |
| `GET` | `/api/v1/endpoints/:id/circuit` | Shared circuit state and remaining cooldown for an endpoint. |
| `POST` | `/api/v1/events` | Accept and enqueue an event. A repeated idempotency key returns the original event id without enqueueing. |
| `GET` | `/api/v1/events/stream` | SSE delivery feed backed by Redis Pub/Sub. |
| `GET` | `/api/v1/events/:id` | Event and chronological delivery-attempt history. |
| `GET` | `/api/v1/events/dlq` | Most recent quarantined events. |
| `POST` | `/api/v1/events/:id/replay` | Reset a DLQ event and enqueue it for delivery. |

## Delivery contract

Each outbound request is JSON `POST` with:

- `X-HookRelay-Event`
- `X-HookRelay-Timestamp` (Unix seconds)
- `X-HookRelay-Signature: v1=<hex hmac>` where the signed message is `<timestamp>.<raw JSON body>`
- `X-Idempotency-Key`

The worker retries timeouts, 408, 429, and 5xx responses. Delay is `min(maxDelay, baseDelay * 2^attempt) + randomJitter`, with five total attempts by default. Other 4xx responses go straight to the DLQ, preserving their response body and all prior attempt records.

## Traffic shaping and circuit protection

Each logical endpoint has a Redis-backed token bucket and circuit breaker shared by every worker instance.

- The bucket uses atomic Lua and honours `rateLimitPerSecond` (default `50`) plus `burstCapacity` (default `10`). A denied token schedules the event back into the delayed Redis queue; no delivery attempt is recorded.
- A circuit opens after five 5xx/network-timeout failures within 60 seconds. It fast-fails queued work while cooling down, then leases exactly one HALF_OPEN probe across all workers. A failed probe doubles the cooldown up to the configured maximum.
- The dashboard can poll `GET /api/v1/endpoints/:id/circuit` for `CLOSED`, `OPEN` plus remaining cooldown, or `HALF_OPEN` state.

## Production integration notes

- Put tenant authentication/authorization in front of the endpoint and event routes; never trust a body-supplied subscriber ID in a multi-tenant deployment.
- Restrict CORS, validate endpoint DNS/IP addresses against private and link-local ranges, and route outbound calls through controlled egress to prevent SSRF.
- Run the API and worker as separate replicated processes. All state coordination is through MongoDB and Redis; SSE works across API replicas through Redis Pub/Sub.
- Protect Redis and MongoDB with TLS, use a secret manager for endpoint keys, and configure retention/TTL for delivery history to suit compliance requirements.
