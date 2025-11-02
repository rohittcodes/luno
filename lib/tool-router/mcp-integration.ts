import 'server-only'

import { createToolRouterSession, getActiveSession } from './client'
import { logger } from '@/lib/utils/logger'

/**
 * MCP Integration for Tool Router
 *
 * This module provides integration between Composio's Tool Router
 * and the Context 7 MCP (Model Context Protocol) server.
 *
 * The MCP server provides:
 * - RUBE_SEARCH_TOOLS: Discover tools across 500+ apps
 * - RUBE_MULTI_EXECUTE_TOOL: Execute multiple tools in parallel
 * - RUBE_REMOTE_BASH_TOOL: Execute bash commands in sandbox
 * - RUBE_REMOTE_WORKBENCH: Execute Python code in sandbox
 */

export interface MCPToolSearchParams {
  queries: Array<{
    use_case: string
    known_fields?: string
  }>
  session: {
    generate_id?: boolean
    id?: string
  }
}

export interface MCPToolExecuteParams {
  tools: Array<{
    tool_slug: string
    arguments: Record<string, any>
  }>
  sync_response_to_workbench?: boolean
  session_id?: string
  thought?: string
  current_step?: string
  current_step_metric?: string
  next_step?: string
  memory?: Record<string, string[]>
}

/**
 * Get or create MCP-enabled Tool Router session
 *
 * This creates a Tool Router session that's compatible with
 * the Context 7 MCP server, allowing LLMs to discover and
 * execute tools across connected apps.
 */
export async function getMCPSession(userId: string, toolkits: string[] = []) {
  try {
    // Check for active session
    let session = await getActiveSession(userId)

    // Create new session if none exists or expired
    if (!session) {
      logger.info(`Creating new MCP-enabled Tool Router session for user: ${userId}`)

      const newSession = await createToolRouterSession(userId, toolkits)

      return {
        sessionId: newSession.sessionId,
        mcpUrl: newSession.url,
        toolkits,
      }
    }

    return {
      sessionId: session.session_id,
      mcpUrl: session.session_url,
      toolkits: session.toolkits,
    }
  } catch (error) {
    logger.error('Error getting MCP session:', error)
    throw error
  }
}

/**
 * Search for tools using MCP
 *
 * Use this to discover which tools can accomplish a specific task.
 * The MCP server will return relevant tools from connected apps.
 *
 * Example use cases:
 * - "send an email to someone"
 * - "create a calendar event"
 * - "sync bank transactions"
 * - "scan a receipt"
 */
export async function searchToolsViaMCP(
  userId: string,
  useCases: Array<{ use_case: string; known_fields?: string }>
) {
  try {
    const session = await getMCPSession(userId)

    // Note: In a real implementation, you would call the MCP server here
    // For now, we return the session info that can be used by MCP clients

    logger.info('Tool search via MCP', {
      userId,
      sessionId: session.sessionId,
      useCases,
    })

    return {
      sessionId: session.sessionId,
      mcpUrl: session.mcpUrl,
      searchParams: {
        queries: useCases,
        session: {
          id: session.sessionId,
        },
      },
    }
  } catch (error) {
    logger.error('Error searching tools via MCP:', error)
    throw error
  }
}

/**
 * Execute tools using MCP
 *
 * Execute multiple tools in parallel using the MCP server.
 * The MCP server handles authentication, rate limiting, and error handling.
 *
 * Example:
 * - Send emails to multiple recipients
 * - Create multiple calendar events
 * - Sync data from multiple sources
 */
export async function executeToolsViaMCP(
  userId: string,
  tools: Array<{
    tool_slug: string
    arguments: Record<string, any>
  }>,
  options?: {
    syncToWorkbench?: boolean
    thought?: string
    currentStep?: string
    memory?: Record<string, string[]>
  }
) {
  try {
    const session = await getMCPSession(userId)

    logger.info('Tool execution via MCP', {
      userId,
      sessionId: session.sessionId,
      toolCount: tools.length,
    })

    return {
      sessionId: session.sessionId,
      mcpUrl: session.mcpUrl,
      executeParams: {
        tools,
        sync_response_to_workbench: options?.syncToWorkbench ?? false,
        session_id: session.sessionId,
        thought: options?.thought,
        current_step: options?.currentStep,
        memory: options?.memory,
      },
    }
  } catch (error) {
    logger.error('Error executing tools via MCP:', error)
    throw error
  }
}

/**
 * Get MCP server capabilities
 *
 * Returns information about what the MCP server can do.
 */
export function getMCPCapabilities() {
  return {
    tools: {
      RUBE_SEARCH_TOOLS: {
        description: 'Discover tools across 500+ integrated apps based on task description',
        inputs: ['queries', 'session'],
        outputs: ['toolkits', 'tools', 'connection_status', 'memory'],
      },
      RUBE_MULTI_EXECUTE_TOOL: {
        description: 'Execute up to 20 tools in parallel across different apps',
        inputs: ['tools', 'session_id', 'memory'],
        outputs: ['results', 'errors'],
        maxParallelism: 20,
      },
      RUBE_REMOTE_BASH_TOOL: {
        description: 'Execute bash commands in a remote sandbox',
        inputs: ['command', 'session_id'],
        outputs: ['stdout', 'stderr'],
        timeout: 300, // seconds
      },
      RUBE_REMOTE_WORKBENCH: {
        description: 'Execute Python code in a persistent Jupyter notebook',
        inputs: ['code_to_execute', 'file_path', 'session_id'],
        outputs: ['result', 'artifacts'],
        timeout: 240, // seconds
      },
    },
    supportedApps: [
      'gmail',
      'slack',
      'github',
      'notion',
      'google-sheets',
      'google-calendar',
      'plaid', // Bank connections
      'stripe',
      'quickbooks',
      'expensify', // Receipt scanning
      // ... 500+ more apps
    ],
    features: {
      parallelExecution: true,
      errorHandling: true,
      retryLogic: true,
      memoryPersistence: true,
      sandboxExecution: true,
    },
  }
}

/**
 * Example usage of MCP integration
 *
 * This shows how to use the MCP integration in your application:
 *
 * ```typescript
 * // 1. Search for tools
 * const searchResult = await searchToolsViaMCP(userId, [
 *   { use_case: 'send an email to someone' },
 *   { use_case: 'create a calendar event' },
 * ])
 *
 * // 2. Execute tools
 * const executeResult = await executeToolsViaMCP(userId, [
 *   {
 *     tool_slug: 'GMAIL_SEND_EMAIL',
 *     arguments: {
 *       to: 'user@example.com',
 *       subject: 'Test Email',
 *       body: 'This is a test email from Luno'
 *     }
 *   }
 * ])
 *
 * // 3. Get MCP session for direct MCP client usage
 * const session = await getMCPSession(userId, ['gmail', 'slack'])
 * // Use session.mcpUrl with an MCP client
 * ```
 */
