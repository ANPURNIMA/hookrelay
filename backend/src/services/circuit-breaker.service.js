import { redis } from '../config/redis.js'
import { env } from '../config/env.js'
import { streamKeys } from '../lib/stream-keys.js'

const canExecuteScript = `
  local state = redis.call('HGET', KEYS[1], 'state') or 'CLOSED'
  local now = tonumber(ARGV[1])
  local baseCooldown = tonumber(ARGV[2])
  local probeLease = tonumber(ARGV[3])
  if state == 'CLOSED' then return {1, 'CLOSED', 0} end

  local openedAt = tonumber(redis.call('HGET', KEYS[1], 'openedAt')) or now
  local cooldown = tonumber(redis.call('HGET', KEYS[1], 'cooldownMs')) or baseCooldown
  if state == 'OPEN' then
    local remaining = (openedAt + cooldown) - now
    if remaining > 0 then return {0, 'OPEN', remaining} end
    -- This caller wins the atomic transition and owns the only probe lease.
    redis.call('HSET', KEYS[1], 'state', 'HALF_OPEN', 'probeLeaseUntil', now + probeLease)
    return {1, 'HALF_OPEN', 0}
  end

  local probeLeaseUntil = tonumber(redis.call('HGET', KEYS[1], 'probeLeaseUntil')) or 0
  if now >= probeLeaseUntil then
    -- The previous worker died while probing; safely lease the probe to this worker.
    redis.call('HSET', KEYS[1], 'probeLeaseUntil', now + probeLease)
    return {1, 'HALF_OPEN', 0}
  end
  return {0, 'HALF_OPEN', probeLeaseUntil - now}
`

const successScript = `
  redis.call('HSET', KEYS[1], 'state', 'CLOSED', 'failureCount', 0, 'windowStartedAt', ARGV[1], 'cooldownMs', ARGV[2])
  redis.call('HDEL', KEYS[1], 'openedAt', 'probeLeaseUntil')
  redis.call('PEXPIRE', KEYS[1], ARGV[3])
  return {'CLOSED', 0}
`

const failureScript = `
  local now = tonumber(ARGV[1])
  local threshold = tonumber(ARGV[2])
  local windowMs = tonumber(ARGV[3])
  local baseCooldown = tonumber(ARGV[4])
  local maxCooldown = tonumber(ARGV[5])
  local currentState = redis.call('HGET', KEYS[1], 'state') or 'CLOSED'
  local failures = tonumber(redis.call('HGET', KEYS[1], 'failureCount')) or 0
  local startedAt = tonumber(redis.call('HGET', KEYS[1], 'windowStartedAt')) or now
  local cooldown = tonumber(redis.call('HGET', KEYS[1], 'cooldownMs')) or baseCooldown

  -- A failed HALF_OPEN probe reopens immediately with a longer cooldown.
  if currentState == 'HALF_OPEN' then
    cooldown = math.min(maxCooldown, cooldown * 2)
    redis.call('HSET', KEYS[1], 'state', 'OPEN', 'openedAt', now, 'cooldownMs', cooldown, 'failureCount', threshold, 'windowStartedAt', now)
    redis.call('HDEL', KEYS[1], 'probeLeaseUntil')
    redis.call('PEXPIRE', KEYS[1], math.max(windowMs * 2, cooldown * 2))
    return {'OPEN', cooldown, threshold}
  end

  if now - startedAt > windowMs then failures = 0; startedAt = now end
  failures = failures + 1
  if failures >= threshold then
    redis.call('HSET', KEYS[1], 'state', 'OPEN', 'openedAt', now, 'cooldownMs', baseCooldown, 'failureCount', failures, 'windowStartedAt', startedAt)
    redis.call('PEXPIRE', KEYS[1], math.max(windowMs * 2, baseCooldown * 2))
    return {'OPEN', baseCooldown, failures}
  end
  redis.call('HSET', KEYS[1], 'state', 'CLOSED', 'failureCount', failures, 'windowStartedAt', startedAt, 'cooldownMs', baseCooldown)
  redis.call('PEXPIRE', KEYS[1], windowMs * 2)
  return {'CLOSED', 0, failures}
`

export async function canExecute(endpointId) {
  const [allowed, state, retryAfterMs] = await redis.eval(
    canExecuteScript, 1, streamKeys.circuit(endpointId), Date.now(), env.CIRCUIT_BASE_COOLDOWN_MS, env.CIRCUIT_PROBE_LEASE_MS,
  )
  return { allowed: Number(allowed) === 1, state, retryAfterMs: Math.max(0, Number(retryAfterMs)) }
}

export async function recordSuccess(endpointId) {
  await redis.eval(successScript, 1, streamKeys.circuit(endpointId), Date.now(), env.CIRCUIT_BASE_COOLDOWN_MS, env.CIRCUIT_FAILURE_WINDOW_MS * 2)
}

export async function recordFailure(endpointId) {
  const [state, retryAfterMs, failureCount] = await redis.eval(
    failureScript, 1, streamKeys.circuit(endpointId), Date.now(), env.CIRCUIT_FAILURE_THRESHOLD,
    env.CIRCUIT_FAILURE_WINDOW_MS, env.CIRCUIT_BASE_COOLDOWN_MS, env.CIRCUIT_MAX_COOLDOWN_MS,
  )
  return { state, retryAfterMs: Number(retryAfterMs), failureCount: Number(failureCount) }
}

/** Dashboard-safe state query: it never acquires the HALF_OPEN probe lease. */
export async function getCircuitState(endpointId) {
  const values = await redis.hgetall(streamKeys.circuit(endpointId))
  if (!values.state || values.state === 'CLOSED') return { state: 'CLOSED', failureCount: Number(values.failureCount ?? 0), retryAfterMs: 0 }
  const now = Date.now()
  const cooldownEndsAt = Number(values.openedAt ?? now) + Number(values.cooldownMs ?? env.CIRCUIT_BASE_COOLDOWN_MS)
  if (values.state === 'OPEN' && now >= cooldownEndsAt) return { state: 'HALF_OPEN', failureCount: Number(values.failureCount ?? 0), retryAfterMs: 0 }
  return { state: values.state, failureCount: Number(values.failureCount ?? 0), retryAfterMs: Math.max(0, cooldownEndsAt - now) }
}
