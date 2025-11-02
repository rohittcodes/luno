import 'server-only'

import { streamText, tool } from 'ai'
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
    const { messages, modelId, provider } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid request: messages array required', { status: 400 })
    }

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
    const dbTools: Record<string, ReturnType<typeof tool>> = {}
    for (const [name, toolDef] of Object.entries(databaseTools)) {
      dbTools[name] = tool({
        description: toolDef.description,
        parameters: toolDef.parameters as any,
        execute: toolDef.execute,
      })
    }

    // Initialize Tool Router MCP client (for external integrations)
    const toolRouterTools: Record<string, ReturnType<typeof tool>> = {}
    try {
      const mcpClient = await createToolRouterMCPClient(user.id)
      
      if (mcpClient) {
        // List available tools from Tool Router
        const availableTools = await mcpClient.listTools()
        
        // Convert MCP tools to AI SDK tool format
        for (const mcpTool of availableTools.tools || []) {
          const toolName = `toolRouter_${mcpTool.name || 'tool'}`
          toolRouterTools[toolName] = tool({
            description: mcpTool.description || '',
            parameters: mcpTool.inputSchema || {},
            execute: async (params: any) => {
              const result = await mcpClient.callTool({
                name: mcpTool.name,
                arguments: params,
              })
              return result.content?.[0]?.text || result.content?.[0]?.data || result
            },
          })
        }
      }
    } catch (error) {
      console.warn('Tool Router MCP client not available:', error)
      // Continue without Tool Router tools if unavailable
    }

    // Combine all tools
    const allTools = {
      ...dbTools,
      ...toolRouterTools,
    }

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

    // Stream response with selected model
    const result = await streamText({
      model,
      system: systemPrompt,
      messages,
      tools: allTools,
      maxSteps: 10, // Allow up to 10 tool calls for complex multi-step operations
      temperature: 0.7,
      maxTokens: 2000,
    })

    return result.toDataStreamResponse()
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

