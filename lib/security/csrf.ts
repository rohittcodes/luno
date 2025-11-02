import 'server-only'

import { cookies } from 'next/headers'
import crypto from 'crypto'

const CSRF_SECRET = process.env.CSRF_SECRET || 'change-me-in-production'

/**
 * Generate CSRF token
 */
export async function generateCSRFToken(): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex')
  const cookieStore = await cookies()
  
  // Hash token before storing
  const hashedToken = crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(token)
    .digest('hex')

  cookieStore.set('csrf-token', hashedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
  })

  return token
}

/**
 * Verify CSRF token
 */
export async function verifyCSRFToken(token: string): Promise<boolean> {
  const cookieStore = await cookies()
  const storedHash = cookieStore.get('csrf-token')?.value

  if (!storedHash || !token) {
    return false
  }

  // Hash the provided token
  const tokenHash = crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(token)
    .digest('hex')

  // Compare hashes
  return crypto.timingSafeEqual(
    Buffer.from(tokenHash),
    Buffer.from(storedHash)
  )
}

