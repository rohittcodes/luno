import { Composio } from '@composio/core'
import { OpenAIAgentsProvider } from '@composio/openai-agents'
import { createClient } from '@/lib/supabase/server'

/**
 * Create Tool Router client
 */
export function createToolRouterClient() {
  const apiKey = process.env.COMPOSIO_API_KEY

  if (!apiKey) {
    throw new Error('COMPOSIO_API_KEY environment variable is required')
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

    // Store session in database
    await supabase.from('tool_router_sessions').insert({
      user_id: userId,
      session_url: session.url || session.chat_session_mcp_url || session.tool_router_instance_mcp_url,
      session_id: session.session_id,
      toolkits: toolkits,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
      is_active: true,
    } as any)

    return {
      url: session.url || session.chat_session_mcp_url || session.tool_router_instance_mcp_url,
      sessionId: session.session_id,
    }
  } catch (error) {
    console.error('Error creating Tool Router session:', error)
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

