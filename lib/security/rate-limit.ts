import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'

/**
 * Simple in-memory rate limiting for API routes
 * For production, consider using Redis or a dedicated service
 */

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

/**
 * Check if request exceeds rate limit
 * @param identifier - Unique identifier (IP, user ID, etc.)
 * @param limit - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns {allowed: boolean, remaining: number, resetAt: number}
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60 * 1000 // 1 minute default
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const key = identifier

  const record = store[key]

  // No record or expired window
  if (!record || now > record.resetTime) {
    store[key] = {
      count: 1,
      resetTime: now + windowMs,
    }
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: now + windowMs,
    }
  }

  // Check if limit exceeded
  if (record.count >= limit) {
    logger.warn(`Rate limit exceeded for identifier: ${identifier}`)
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetTime,
    }
  }

  // Increment count
  record.count++

  return {
    allowed: true,
    remaining: limit - record.count,
    resetAt: record.resetTime,
  }
}

/**
 * Clear rate limit for an identifier (useful for testing)
 */
export function clearRateLimit(identifier: string): void {
  delete store[identifier]
}

/**
 * Clean up expired entries (run periodically)
 */
export function cleanupRateLimits(): void {
  const now = Date.now()
  Object.keys(store).forEach((key) => {
    if (now > store[key].resetTime) {
      delete store[key]
    }
  })
}

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimits, 5 * 60 * 1000)
}

/**
 * Rate limit middleware for Next.js API routes
 * @example
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const rateLimitResult = await rateLimitMiddleware(request)
 *   if (rateLimitResult) return rateLimitResult
 *   // ... handle request
 * }
 * ```
 */
export async function rateLimitMiddleware(
  request: NextRequest,
  limit: number = 100,
  windowMs: number = 60 * 1000
): Promise<NextResponse | null> {
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown'

  const identifier = `${ip}:${request.nextUrl.pathname}`
  const result = checkRateLimit(identifier, limit, windowMs)

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000)
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': String(result.remaining),
          'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000))
        }
      }
    )
  }

  return null
}

