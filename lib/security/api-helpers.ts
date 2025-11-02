import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

/**
 * API route helper utilities for security and validation
 */

/**
 * Ensure user is authenticated
 * Returns user object or throws 401 error
 */
export async function requireAuth() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return { user, supabase }
}

/**
 * Validate request body with Zod schema
 */
export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  try {
    return schema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${error.issues.map((e) => e.message).join(', ')}`)
    }
    throw error
  }
}

/**
 * Validate query parameters with Zod schema
 */
export function validateQuery<T>(schema: z.ZodSchema<T>, searchParams: URLSearchParams): T {
  const params = Object.fromEntries(searchParams.entries())
  try {
    return schema.parse(params)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${error.issues.map((e) => e.message).join(', ')}`)
    }
    throw error
  }
}

/**
 * Safe error handler for API routes
 * Returns appropriate error response
 */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof Error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error.message.includes('Validation failed')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }

  console.error('Unknown error:', error)
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}

/**
 * Extract JSON body safely from request
 */
export async function getRequestBody(request: NextRequest): Promise<unknown> {
  try {
    return await request.json()
  } catch (error) {
    throw new Error('Invalid JSON in request body')
  }
}

