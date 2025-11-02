import { Composio } from '@composio/core'
import { OpenAIAgentsProvider } from '@composio/openai-agents'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

/**
 * Create Tool Router client
 */
export function createToolRouterClient() {
  const apiKey = process.env.COMPOSIO_API_KEY

  if (!apiKey) {
    const errorMsg = 'COMPOSIO_API_KEY environment variable is not set. Please add it to your .env.local file. Get your API key from https://app.composio.dev/settings'
    logger.error(errorMsg)
    throw new Error(errorMsg)
  }

  return new Composio({
    apiKey,
    provider: new OpenAIAgentsProvider(),
  })
}

/**
 * Create Tool Router session for a user
 */
export async function createToolRouterSession(
  userId: string,
  toolkits: string[] = []
) {
  const composio = createToolRouterClient()
  const supabase = await createClient()

  try {
    // Create session via Composio Tool Router
    const session = await composio.experimental.toolRouter.createSession(
      userId,
      { toolkits }
    )

    // Type assertion for Composio session response
    // Composio may return different field names depending on version
    const sessionResponse = session as any

    // Log the session response to debug
    logger.debug('Composio session response:', {
      hasUrl: !!sessionResponse.url,
      hasChatSessionMcpUrl: !!sessionResponse.chat_session_mcp_url,
      hasToolRouterInstanceMcpUrl: !!sessionResponse.tool_router_instance_mcp_url,
      hasSessionId: !!sessionResponse.session_id,
      sessionKeys: Object.keys(sessionResponse),
    })

    const sessionUrl = sessionResponse.url || sessionResponse.chat_session_mcp_url || sessionResponse.tool_router_instance_mcp_url
    const composioSessionId = sessionResponse.session_id || sessionResponse.sessionId || null

    // Store session in database
    const { data, error } = await supabase
      .from('tool_router_sessions')
      .insert({
        user_id: userId,
        session_url: sessionUrl,
        session_id: composioSessionId,
        toolkits: toolkits,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      logger.error('Error storing session in database:', error)
      throw error
    }

    logger.debug('Session stored in database:', { id: data.id, sessionId: data.session_id })

    return {
      url: sessionUrl,
      sessionId: composioSessionId,
    }
  } catch (error) {
    logger.error('Error creating Tool Router session:', error)
    throw error
  }
}

/**
 * Get active Tool Router session for a user
 */
export async function getActiveSession(userId: string) {
  const supabase = await createClient()

  const { data: session } = await supabase
    .from('tool_router_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return session
}

/**
 * Deactivate Tool Router session
 */
export async function deactivateSession(userId: string, sessionId: string) {
  const supabase = await createClient()

  await supabase
    .from('tool_router_sessions')
    .update({ is_active: false } as any)
    .eq('id', sessionId)
    .eq('user_id', userId)
}

