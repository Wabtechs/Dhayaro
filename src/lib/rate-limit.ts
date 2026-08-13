const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function getClientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'
}

export function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterMs: 0 }
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, retryAfterMs: entry.resetAt - now }
  }

  entry.count++
  return { allowed: true, retryAfterMs: 0 }
}

export function getRateLimitKey(request: Request, prefix: string): string {
  return `${prefix}:${getClientIp(request)}`
}

export function getRateLimitConfig(
  envPrefix: string,
  defaultMax: number = 30,
  defaultWindowMs: number = 60_000
): { maxRequests: number; windowMs: number } {
  const max = Number(process.env[`${envPrefix}_MAX`] ?? defaultMax)
  const window = Number(process.env[`${envPrefix}_WINDOW_MS`] ?? defaultWindowMs)
  return {
    maxRequests: Number.isFinite(max) && max > 0 ? Math.floor(max) : defaultMax,
    windowMs: Number.isFinite(window) && window > 0 ? Math.floor(window) : defaultWindowMs,
  }
}

const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

export function cleanupRateLimit() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key)
    }
  }
}
