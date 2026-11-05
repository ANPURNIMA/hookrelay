-- KEYS[1] = endpoint-specific token bucket hash
-- ARGV = current epoch milliseconds, refill rate/second, bucket capacity, requested tokens
-- Returns {allowed (0|1), wait milliseconds, remaining tokens}
local now = tonumber(ARGV[1])
local refillRate = tonumber(ARGV[2])
local capacity = tonumber(ARGV[3])
local requested = tonumber(ARGV[4])

local storedTokens = tonumber(redis.call('HGET', KEYS[1], 'tokens'))
local lastRefillAt = tonumber(redis.call('HGET', KEYS[1], 'lastRefillAt'))

-- A new bucket starts full, allowing the configured burst immediately.
if not storedTokens then storedTokens = capacity end
if not lastRefillAt then lastRefillAt = now end

local elapsedMs = math.max(0, now - lastRefillAt)
local replenished = math.min(capacity, storedTokens + (elapsedMs / 1000) * refillRate)
local allowed = 0
local waitMs = 0

if replenished >= requested then
  replenished = replenished - requested
  allowed = 1
else
  local missing = requested - replenished
  waitMs = math.ceil((missing / refillRate) * 1000)
end

redis.call('HSET', KEYS[1], 'tokens', replenished, 'lastRefillAt', now)
-- Keep state only long enough for a fully empty bucket to refill, plus a safe cushion.
redis.call('PEXPIRE', KEYS[1], math.max(60000, math.ceil((capacity / refillRate) * 1000) + 5000))

return { allowed, waitMs, replenished }
