import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'
import crypto from 'crypto'

/**
 * Proxy for Next.js 16
 * - Refreshes Supabase auth sessions
 * - Protects routes
 * - Adds security headers with CSP nonces
 * 
 * Note: In Next.js 16, middleware has been renamed to proxy.
 * The proxy function runs in Node.js runtime (not Edge).
 */
export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next()
  }

  // Generate CSP nonce for this request
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const isDev = process.env.NODE_ENV === 'development'

  // Build CSP header with nonces
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${isDev ? "'unsafe-eval'" : ''};
    style-src 'self' ${isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`};
    img-src 'self' blob: data: https:;
    font-src 'self' data:;
    connect-src 'self' https://*.supabase.co https://*.lemonsqueezy.com https://api.composio.dev https://api.resend.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim()

  // Create response object with nonce in headers
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Create Supabase client for proxy
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value)
        })
        response = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        })
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected route patterns
  const protectedPaths = ['/dashboard', '/settings', '/billing', '/transactions', '/accounts', '/categories', '/budgets', '/analytics', '/subscriptions', '/notifications']
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  // Redirect to login if accessing protected route without auth
  if (isProtectedPath && !user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('x-nonce', nonce)
  response.headers.set('Content-Security-Policy', cspHeader)

  // Permissions-Policy header (formerly Feature-Policy)
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )

  // Rate limiting headers (can be enhanced with Redis/memory store)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _rateLimitKey = `ratelimit:${request.headers.get('x-forwarded-for') || 'unknown'}:${request.nextUrl.pathname}`
  // TODO: Implement actual rate limiting with store

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - API routes that don't need auth (webhooks, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/webhooks).*)',
  ],
}
