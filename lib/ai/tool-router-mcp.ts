import 'server-only'

import { createToolRouterSession, getActiveSession } from '@/lib/tool-router/client'
import { createClient } from '@/lib/supabase/server'

// Dynamic imports for experimental MCP features
// These may not be available in all AI SDK versions
async function getMCPImports() {
  try {
    const [aiModule, mcpModule] = await Promise.all([
      import('ai'),
      import('@modelcontextprotocol/sdk/client/streamableHTTP.js'),
    ])
    
    return {
      experimental_createMCPClient: (aiModule as any).experimental_createMCPClient,
      StreamableHTTPClientTransport: mcpModule.StreamableHTTPClientTransport,
    }
  } catch (error) {
    console.warn('MCP client imports not available:', error)
    return { experimental_createMCPClient: null, StreamableHTTPClientTransport: null }
  }
}

/**
 * Create MCP client for Composio Tool Router
 * Tool Router provides access to 500+ external integrations (Gmail, GitHub, Slack, banks, etc.)
 * 
 * Note: Uses experimental AI SDK feature. Falls back gracefully if unavailable.
 */
export async function createToolRouterMCPClient(userId: string) {
  try {
    // Get MCP imports dynamically
    const { experimental_createMCPClient, StreamableHTTPClientTransport } = await getMCPImports()
    
    if (!experimental_createMCPClient || !StreamableHTTPClientTransport) {
      console.warn('MCP client not available in this AI SDK version')
      return null
    }

    // Create or get Tool Router session
    const session = await getOrCreateToolRouterSession(userId)

    // Create MCP client with StreamableHTTP transport
    // The URL should be a string or URL object
    const transportUrl = typeof session.url === 'string' ? new URL(session.url) : session.url
    const client = experimental_createMCPClient({
      name: 'tool_router',
      transport: new StreamableHTTPClientTransport({
        url: transportUrl,
      } as any), // Type assertion for experimental API
    })

    return client
  } catch (error) {
    console.error('Error creating Tool Router MCP client:', error)
    // Don't throw - allow chat to work without Tool Router
    return null
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
      sessionId: existingSession.id,
    }
  }

  // Create new session
  return await createToolRouterSession(userId)
}

