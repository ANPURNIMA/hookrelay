import { createHmac, timingSafeEqual } from 'node:crypto'

export function signPayload(secret, timestamp, body) {
  const signature = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')
  return `v1=${signature}`
}

// Useful to consumers of HookRelay and intentionally exported for contract tests.
export function verifySignature(secret, timestamp, body, receivedSignature) {
  const expected = signPayload(secret, timestamp, body)
  if (expected.length !== receivedSignature.length) return false
  return timingSafeEqual(Buffer.from(expected), Buffer.from(receivedSignature))
}
