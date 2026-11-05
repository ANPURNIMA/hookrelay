import { env } from '../config/env.js'

// attempt is one-based: failed attempt #1 waits base * 2^1 plus bounded jitter.
export function retryDelayMs(attempt) {
  const exponential = Math.min(env.RETRY_MAX_DELAY_MS, env.RETRY_BASE_DELAY_MS * (2 ** attempt))
  const jitter = Math.floor(Math.random() * (env.RETRY_JITTER_MS + 1))
  return Math.min(env.RETRY_MAX_DELAY_MS, exponential + jitter)
}

export function shouldRetry({ statusCode, error }) {
  return Boolean(error) || statusCode === 408 || statusCode === 429 || (statusCode >= 500 && statusCode <= 599)
}
