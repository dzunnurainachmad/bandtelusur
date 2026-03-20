import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Persistent sliding window rate limiter backed by Upstash Redis.
// Works across all Vercel serverless instances.

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// One limiter per route, keyed by IP
const limiters: Record<string, Ratelimit> = {}

function getLimiter(max: number, windowSeconds: number): Ratelimit {
  const key = `${max}:${windowSeconds}`
  if (!limiters[key]) {
    limiters[key] = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(max, `${windowSeconds} s`),
      prefix: 'bt:rl',
    })
  }
  return limiters[key]
}

export async function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const limiter = getLimiter(max, Math.round(windowMs / 1000))
  const { success, remaining } = await limiter.limit(key)
  return { allowed: success, remaining }
}

export function getIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

export function rateLimitResponse() {
  return Response.json(
    { error: 'Terlalu banyak permintaan. Coba lagi dalam satu menit.' },
    { status: 429 },
  )
}
