import 'server-only'

import { streamText, tool, convertToModelMessages, stepCountIs } from 'ai'
import { google } from '@ai-sdk/google'
import { openai } from '@ai-sdk/openai'
import { createClient } from '@/lib/supabase/server'
import { databaseTools } from '@/lib/ai/tools/database-tools'
import { createToolRouterMCPClient } from '@/lib/ai/tool-router-mcp'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 seconds for complex multi-step operations

/**
 * Chat API route with AI agent
 * Supports:
 * - Custom database tools (transactions, accounts, categories, budgets, goals)
 * - Tool Router MCP for external integrations (via Composio)
 * - Multi-step actions and tool calling
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messages, modelId, provider } = body

    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid request: messages array required', { status: 400 })
    }

    // Convert UIMessages to ModelMessages for streamText
    // useChat sends UIMessage[] format (with parts), but streamText needs ModelMessage[] format (with content)
    const modelMessages = convertToModelMessages(messages)

    // Get authenticated user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Get model from request or use default
    const selectedProvider = (provider as 'google' | 'openai') || 'google'
    const selectedModelId = (modelId as string) || 'gemini-2.5-flash-lite'

    // Build database tools
    const dbTools: Record<string, any> = {}
    for (const [name, toolDef] of Object.entries(databaseTools)) {
      dbTools[name] = tool({
        description: toolDef.description,
        parameters: toolDef.parameters as any,
        execute: toolDef.execute as any,
      } as any)
    }
    // Initialize Tool Router MCP client (for external integrations)
    let mcpClient: Awaited<ReturnType<typeof createToolRouterMCPClient>> | null = null
    const toolRouterTools: Record<string, any> = {}

    try {
      console.log('[MCP] Creating Tool Router MCP client for user:', user.id)
      mcpClient = await createToolRouterMCPClient(user.id)

      if (mcpClient) {
        console.log('[MCP] Client created successfully, fetching tools...')
        // Get tools from MCP client (following docs pattern)
        const mcpToolSet = await mcpClient.tools()
        console.log('[MCP] Tools fetched:', Object.keys(mcpToolSet).length, 'tools')

        // MCP tools are already in AI SDK format when returned from client.tools()
        // Combine with existing tools (following docs pattern)
        for (const [toolName, mcpTool] of Object.entries(mcpToolSet)) {
          toolRouterTools[`toolRouter_${toolName}`] = mcpTool
        }
        console.log('[MCP] Tool Router tools loaded:', Object.keys(toolRouterTools).length)
      } else {
        console.warn('[MCP] MCP client is null')
      }
    } catch (error) {
      // Continue without Tool Router tools if unavailable
      console.error('[MCP] Failed to load Tool Router tools:', error)
      if (error instanceof Error) {
        console.error('[MCP] Error details:', error.message, error.stack)
      }
    }

    // Combine all tools (following docs pattern)
    const allTools = {
      ...dbTools,
      ...toolRouterTools,
    } as any

    // System prompt for the financial assistant
    const systemPrompt = `You are Luno, an AI financial assistant helping users manage their finances.

Your capabilities:
1. **Internal Database Tools**: You have access to the user's financial data through custom tools:
   - getTransactions: Query and filter transactions
   - getAccounts: Get account balances and details
   - getCategories: List expense/income categories
   - getBudgets: Check budget status and spending
   - getGoals: Track financial goals progress
   - createTransaction: Add new transactions
   - getSpendingAnalytics: Analyze spending patterns

2. **External Integrations (via Tool Router)**: You can access external services through Composio Tool Router:
   - Banking integrations (Plaid, Yodlee)
   - Email services (Gmail)
   - Receipt scanning (OCR services)
   - Payment processors
   - Investment tracking
   - And 500+ other integrations

**Important Guidelines**:
- Always use database tools first to understand the user's current financial state
- For external actions (sending emails, connecting banks, etc.), use Tool Router tools
- Be proactive: if a user asks "how much did I spend?", query transactions and provide analysis
- For multi-step tasks, break them down and use tools sequentially
- Always format currency amounts clearly
- When creating transactions, ensure all required fields are provided
- If you need account/category IDs, first query the available accounts/categories
- Provide actionable insights and suggestions based on the data

Remember: You can perform complex multi-step operations. For example:
- "Add a $50 expense for groceries" → Use getAccounts, getCategories, then createTransaction
- "Show me my spending this month" → Use getTransactions, then getSpendingAnalytics
- "What's my account balance?" → Use getAccounts
- "How am I doing on my budgets?" → Use getBudgets`

    // Get the appropriate model based on provider and model ID
    let model
    if (selectedProvider === 'openai') {
      // Map OpenAI model IDs to actual model names
      const openaiModelMap: Record<string, string> = {
        'gpt-5-nano': 'gpt-5-nano', // Fastest, most cost-efficient
        'gpt-5-pro': 'gpt-5-pro', // Smarter and more precise
        'gpt-4.1': 'gpt-4.1', // Smartest non-reasoning model
      }
      const modelName = openaiModelMap[selectedModelId] || 'gpt-5-nano'
      model = openai(modelName)
    } else {
      // Gemini models
      // Map model IDs to actual Gemini model names available in @ai-sdk/google
      const geminiModelMap: Record<string, string> = {
        'gemini-2.5-pro': 'gemini-2.5-pro',
        'gemini-2.5-flash': 'gemini-2.5-flash',
        'gemini-2.5-flash-lite': 'gemini-2.5-flash-lite',
        'gemini-2.0-flash': 'gemini-2.0-flash',
        'gemini-2.0-flash-lite': 'gemini-2.0-flash-lite',
      }
      // Fallback to available model if exact match not found
      const modelName = geminiModelMap[selectedModelId] || 'gemini-2.0-flash-exp'
      model = google(modelName)
    }

    // Stream response with proper cleanup (following docs pattern)
    // Use stopWhen: stepCountIs() for multi-step tool calling (as per AI SDK docs)
    const result = await streamText({
      model,
      system: systemPrompt,
      messages: modelMessages,
      tools: allTools,
      stopWhen: stepCountIs(10), // Allow up to 10 steps for complex multi-step operations (e.g., search tools -> manage connections -> execute tools)
      temperature: 0.7,
      // Log tool calls for debugging
      onToolCall: ({ toolCallId, toolName, args }: { toolCallId: string; toolName: string; args: unknown }) => {
        console.log('[Tool] Tool called:', toolName, 'ID:', toolCallId, 'Args:', JSON.stringify(args).substring(0, 100))
      },
      // Log tool results
      onToolResult: ({ toolCallId, toolName, result }: { toolCallId: string; toolName: string; result: unknown }) => {
        console.log('[Tool] Tool result:', toolName, 'ID:', toolCallId, 'Result:', typeof result === 'string' ? result.substring(0, 100) : 'object')
      },
      // When streaming, the client should be closed after the response is finished:
      onFinish: async () => {
        console.log('[Tool] Stream finished, closing MCP client')
        if (mcpClient) {
          await mcpClient.close()
        }
      },
      // Closing clients onError is optional but recommended
      // - Closing: Immediately frees resources, prevents hanging connections
      // - Not closing: Keeps connection open for retries
      onError: async (error: unknown) => {
        console.error('[Tool] Error during streaming:', error)
        if (mcpClient) {
          await mcpClient.close()
        }
      },
    } as any) // maxSteps exists at runtime but may not be in TypeScript types for v5.0.86

    console.log('[Stream] Returning UIMessage stream response')
    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

