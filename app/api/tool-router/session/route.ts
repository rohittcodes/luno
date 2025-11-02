import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, validateBody, handleApiError, getRequestBody } from '@/lib/security/api-helpers'
import { rateLimitMiddleware } from '@/lib/security/rate-limit'
import { createToolRouterSession, getActiveSession, deactivateSession } from '@/lib/tool-router/client'
import { z } from 'zod'
import { logger } from '@/lib/utils/logger'

/**
 * POST /api/tool-router/session
 * Create a new tool router session
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimitMiddleware(request, 10, 60 * 1000)
    if (rateLimitResult) return rateLimitResult

    // Authenticate user
    const { user } = await requireAuth()

    // Validate request body
    const schema = z.object({
      toolkits: z.array(z.string()).optional().default([]),
    })

    const body = await getRequestBody(request)
    const { toolkits } = validateBody(schema, body)

    logger.apiRequest('POST', '/api/tool-router/session', user.id)

    // Create session
    const session = await createToolRouterSession(user.id, toolkits)

    return NextResponse.json({
      success: true,
      session: {
        url: session.url,
        sessionId: session.sessionId,
      },
    })
  } catch (error) {
    logger.apiError('POST', '/api/tool-router/session', error)
    return handleApiError(error)
  }
}

/**
 * GET /api/tool-router/session
 * Get active tool router session
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimitMiddleware(request, 20, 60 * 1000)
    if (rateLimitResult) return rateLimitResult

    // Authenticate user
    const { user } = await requireAuth()

    logger.apiRequest('GET', '/api/tool-router/session', user.id)

    // Get active session
    const session = await getActiveSession(user.id)

    if (!session) {
      return NextResponse.json(
        { error: 'No active session found' },
        { status: 404 }
      )
    }

    // Log session data for debugging
    logger.debug('Retrieved session from database:', {
      id: session.id,
      hasSessionId: !!session.session_id,
      hasUrl: !!session.session_url,
    })

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        url: session.session_url,
        sessionId: session.session_id || null, // Handle null case
        toolkits: session.toolkits || [],
        expiresAt: session.expires_at,
        isActive: session.is_active,
      },
    })
  } catch (error) {
    logger.apiError('GET', '/api/tool-router/session', error)
    return handleApiError(error)
  }
}

/**
 * DELETE /api/tool-router/session
 * Deactivate tool router session
 */
export async function DELETE(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimitMiddleware(request, 10, 60 * 1000)
    if (rateLimitResult) return rateLimitResult

    // Authenticate user
    const { user } = await requireAuth()

    // Validate request body
    const schema = z.object({
      sessionId: z.string(),
    })

    const body = await getRequestBody(request)
    const { sessionId } = validateBody(schema, body)

    logger.apiRequest('DELETE', '/api/tool-router/session', user.id)

    // Deactivate session
    await deactivateSession(user.id, sessionId)

    return NextResponse.json({
      success: true,
      message: 'Session deactivated successfully',
    })
  } catch (error) {
    logger.apiError('DELETE', '/api/tool-router/session', error)
    return handleApiError(error)
  }
}
