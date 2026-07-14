import IORedis from "ioredis"
import { NextResponse } from "next/server"
import { log } from "@/lib/posthog-server"

// Per-org rate limiting for cost-incurring endpoints (Gmail sync, CSV import,
// reconcile). Backed by the same Redis that BullMQ already uses — no extra
// infrastructure. The limiter is a fixed window counter kept atomic with a small
// Lua script (INCR + PEXPIRE on first hit), so concurrent requests can't race
// past the limit or lose the expiry.

// Lazily create one shared connection. `maxRetriesPerRequest: null` matches the
// BullMQ connection contract and stops ioredis from throwing on transient blips.
let client: IORedis | null = null
function redis(): IORedis {
  if (!client) {
    client = new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null })
    client.on("error", (err) => log.error("rate-limit redis error", { error: err.message }))
  }
  return client
}

const INCR_WINDOW = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('PTTL', KEYS[1])
return {current, ttl}
`

export type RateLimitResult = {
  allowed: boolean
  limit: number
  remaining: number
  retryAfterMs: number
}

// Consume one token for `key` in a fixed window. Fails OPEN: if Redis is
// unreachable we allow the request rather than take the app down — this is a
// cost/DoS guard, not an auth control.
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  try {
    const [current, ttl] = (await redis().eval(
      INCR_WINDOW,
      1,
      `ratelimit:${key}`,
      windowMs
    )) as [number, number]

    const remaining = Math.max(0, limit - current)
    return {
      allowed: current <= limit,
      limit,
      remaining,
      retryAfterMs: current <= limit ? 0 : Math.max(0, ttl),
    }
  } catch (err) {
    log.error("rate-limit check failed; allowing request", {
      error: err instanceof Error ? err.message : String(err),
    })
    return { allowed: true, limit, remaining: limit, retryAfterMs: 0 }
  }
}

// Convenience wrapper for route handlers. Returns a 429 NextResponse when the
// caller is over budget, or null to proceed. Scope keys per org + action so one
// tenant can't exhaust another's budget.
export async function enforceRateLimit(
  scope: string,
  limit: number,
  windowMs: number
): Promise<NextResponse | null> {
  const result = await checkRateLimit(scope, limit, windowMs)
  if (result.allowed) return null

  const retryAfterSec = Math.ceil(result.retryAfterMs / 1000)
  return NextResponse.json(
    { error: "Rate limit exceeded. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": "0",
      },
    }
  )
}
