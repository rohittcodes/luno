import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, validateBody, handleApiError, getRequestBody } from '@/lib/security/api-helpers'
import { rateLimitMiddleware } from '@/lib/security/rate-limit'
import { saveConnection, getConnections, disconnectConnection } from '@/lib/tool-router/connections'
import { z } from 'zod'
import { logger } from '@/lib/utils/logger'

/**
 * POST /api/tool-router/connections
 * Create a new external connection
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
      integrationType: z.enum([
        'bank',
        'payment',
        'receipt_scanner',
        'credit_monitor',
        'investment',
        'tax_service',
      ]),
      toolkitName: z.string(),
      connectionData: z.object({
        connectionId: z.string().optional(),
        entityId: z.string(),
        entityName: z.string(),
        credentials: z.record(z.any()).optional(),
        metadata: z.record(z.any()).optional(),
      }),
    })

    const body = await getRequestBody(request)
    const { integrationType, toolkitName, connectionData } = validateBody(schema, body)

    logger.apiRequest('POST', '/api/tool-router/connections', user.id)

    // Save connection
    const connection = await saveConnection(
      user.id,
      integrationType,
      toolkitName,
      connectionData
    )

    return NextResponse.json({
      success: true,
      connection: {
        id: connection.id,
        integrationType: connection.integration_type,
        toolkitName: connection.toolkit_name,
        entityName: connection.connected_entity_name,
        status: connection.status,
        lastSyncedAt: connection.last_synced_at,
      },
    })
  } catch (error) {
    logger.apiError('POST', '/api/tool-router/connections', error)
    return handleApiError(error)
  }
}

/**
 * GET /api/tool-router/connections
 * Get user's external connections
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimitMiddleware(request, 20, 60 * 1000)
    if (rateLimitResult) return rateLimitResult

    // Authenticate user
    const { user } = await requireAuth()

    logger.apiRequest('GET', '/api/tool-router/connections', user.id)

    // Get connections
    const connections = await getConnections(user.id)

    return NextResponse.json({
      success: true,
      connections: connections.map((conn) => ({
        id: conn.id,
        integrationType: conn.integration_type,
        toolkitName: conn.toolkit_name,
        entityName: conn.connected_entity_name,
        status: conn.status,
        lastSyncedAt: conn.last_synced_at,
        createdAt: conn.created_at,
      })),
    })
  } catch (error) {
    logger.apiError('GET', '/api/tool-router/connections', error)
    return handleApiError(error)
  }
}

/**
 * DELETE /api/tool-router/connections
 * Disconnect an external connection
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
      connectionId: z.string(),
    })

    const body = await getRequestBody(request)
    const { connectionId } = validateBody(schema, body)

    logger.apiRequest('DELETE', '/api/tool-router/connections', user.id)

    // Disconnect
    await disconnectConnection(connectionId)

    return NextResponse.json({
      success: true,
      message: 'Connection disconnected successfully',
    })
  } catch (error) {
    logger.apiError('DELETE', '/api/tool-router/connections', error)
    return handleApiError(error)
  }
}
