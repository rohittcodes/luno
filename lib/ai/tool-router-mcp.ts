import 'server-only'

import { experimental_createMCPClient } from '@ai-sdk/mcp'
import { createToolRouterSession } from '@/lib/tool-router/client'
import { createClient } from '@/lib/supabase/server'

/**
 * Create MCP client for Composio Tool Router
 * Tool Router provides access to 500+ external integrations (Gmail, GitHub, Slack, banks, etc.)
 * 
 * Tool Router uses Streamable HTTP transport for MCP communication.
 * Following the pattern from AI SDK documentation for MCP tools with HTTP transport.
 */
export async function createToolRouterMCPClient(userId: string) {
  // Get or create Tool Router session
  const session = await getOrCreateToolRouterSession(userId)
  
  console.log('[MCP] Creating client with URL:', session.url.substring(0, 50) + '...')
  console.log('[MCP] Session ID:', session.sessionId ? 'present' : 'missing')

  try {
    // Create MCP client with HTTP transport (Streamable HTTP)
    // Tool Router docs specify: "Tool Router uses Streamable HTTP transport for MCP communication"
    // Following docs pattern: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling
    const mcpClient = await experimental_createMCPClient({
      transport: {
        type: 'http',
        url: session.url,
        // Optional: configure headers for session ID
        headers: session.sessionId
          ? {
              'X-Session-Id': session.sessionId,
            }
          : undefined,
      },
    })

    console.log('[MCP] Client created successfully')
    return mcpClient
  } catch (error) {
    console.error('[MCP] Error creating MCP client:', error)
    if (error instanceof Error) {
      console.error('[MCP] Error message:', error.message)
      console.error('[MCP] Error stack:', error.stack)
    }
    throw error
  }
}

/**
 * Get or create Tool Router session for user
 */
export async function getOrCreateToolRouterSession(userId: string) {
  const supabase = await createClient()
  
  // Check for existing active session
  const { data: existingSession } = await supabase
    .from('tool_router_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (existingSession?.session_url) {
    return {
      url: existingSession.session_url,
      sessionId: existingSession.session_id, // Use Composio session ID, not database ID
    }
  }

  // Create new session
  return await createToolRouterSession(userId)
}

