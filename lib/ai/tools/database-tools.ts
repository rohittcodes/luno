import 'server-only'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type Transaction = Database['public']['Tables']['transactions']['Row']
type Account = Database['public']['Tables']['accounts']['Row']
type Category = Database['public']['Tables']['categories']['Row']
type Budget = Database['public']['Tables']['budgets']['Row']
type Goal = Database['public']['Tables']['goals']['Row']

/**
 * Custom database tools for the AI agent
 * These handle internal database operations (transactions, accounts, categories, budgets, goals)
 */
export const databaseTools = {
  /**
   * Get user's transactions with optional filters
   */
  getTransactions: {
    description: "Get user's transactions. Can filter by date range, type, category, or account. Use this to analyze spending, find specific transactions, or get transaction history.",
    parameters: z.object({
      startDate: z.string().optional().describe('Start date in ISO format (YYYY-MM-DD). Defaults to 30 days ago.'),
      endDate: z.string().optional().describe('End date in ISO format (YYYY-MM-DD). Defaults to today.'),
      type: z.enum(['income', 'expense', 'transfer']).optional().describe('Filter by transaction type'),
      categoryId: z.string().uuid().optional().describe('Filter by category ID'),
      accountId: z.string().uuid().optional().describe('Filter by account ID'),
      limit: z.number().int().min(1).max(100).optional().default(50).describe('Maximum number of transactions to return'),
    }),
    execute: async ({ startDate, endDate, type, categoryId, accountId, limit = 50 }: {
      startDate?: string
      endDate?: string
      type?: 'income' | 'expense' | 'transfer'
      categoryId?: string
      accountId?: string
      limit?: number
    }) => {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Unauthorized')

      const end = endDate || new Date().toISOString().split('T')[0]
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      let query = supabase
        .from('transactions')
        .select('*, accounts(*), categories(*)')
        .eq('user_id', user.id)
        .gte('transaction_date', start)
        .lte('transaction_date', end)
        .order('transaction_date', { ascending: false })
        .limit(limit)

      if (type) query = query.eq('type', type)
      if (categoryId) query = query.eq('category_id', categoryId)
      if (accountId) query = query.eq('account_id', accountId)

      const { data, error } = await query

      if (error) throw error
      return { transactions: data || [] }
    },
  },

  /**
   * Get user's accounts
   */
  getAccounts: {
    description: "Get user's accounts (checking, savings, credit cards, etc.). Use this to check balances, list accounts, or get account details.",
    parameters: z.object({
      includeInactive: z.boolean().optional().default(false).describe('Include inactive accounts'),
    }),
    execute: async ({ includeInactive = false }: { includeInactive?: boolean }) => {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Unauthorized')

      let query = supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      if (!includeInactive) {
        query = query.eq('is_active', true)
      }

      const { data, error } = await query

      if (error) throw error

      const totalBalance = (data || []).reduce((sum, acc) => sum + Number(acc.balance || 0), 0)

      return {
        accounts: data || [],
        totalBalance,
        count: (data || []).length,
      }
    },
  },

  /**
   * Get user's categories
   */
  getCategories: {
    description: "Get user's categories for expenses and income. Use this to see available categories, check category hierarchy, or find category IDs.",
    parameters: z.object({}),
    execute: async () => {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Unauthorized')

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      if (error) throw error

      const rootCategories = (data || []).filter(c => !c.parent_category_id)
      const subCategories = (data || []).filter(c => c.parent_category_id)

      return {
        categories: data || [],
        rootCategories,
        subCategories,
        count: (data || []).length,
      }
    },
  },

  /**
   * Get user's budgets
   */
  getBudgets: {
    description: "Get user's budgets with spending progress. Use this to check budget status, see spending against budgets, or analyze budget performance.",
    parameters: z.object({
      activeOnly: z.boolean().optional().default(true).describe('Return only active budgets'),
    }),
    execute: async ({ activeOnly = true }: { activeOnly?: boolean }) => {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Unauthorized')

      let query = supabase
        .from('budgets')
        .select('*, categories(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (activeOnly) {
        query = query.eq('is_active', true)
      }

      const { data: budgets, error } = await query

      if (error) throw error

      // Calculate spending for each budget
      const now = new Date()
      const budgetsWithSpending = await Promise.all(
        (budgets || []).map(async (budget) => {
          const budgetStart = new Date(budget.start_date)
          const budgetEnd = budget.end_date ? new Date(budget.end_date) : now

          let spendingQuery = supabase
            .from('transactions')
            .select('amount')
            .eq('user_id', user.id)
            .eq('type', 'expense')
            .gte('transaction_date', budgetStart.toISOString().split('T')[0])
            .lte('transaction_date', budgetEnd.toISOString().split('T')[0])

          if (budget.category_id) {
            spendingQuery = spendingQuery.eq('category_id', budget.category_id)
          }

          const { data: transactions } = await spendingQuery
          const spent = (transactions || []).reduce((sum, t) => sum + Number(t.amount || 0), 0)
          const remaining = Number(budget.amount) - spent
          const percentage = (spent / Number(budget.amount)) * 100

          return {
            ...budget,
            spent,
            remaining,
            percentage: Math.round(percentage),
            isOverBudget: spent > Number(budget.amount),
          }
        })
      )

      return {
        budgets: budgetsWithSpending,
        count: budgetsWithSpending.length,
      }
    },
  },

  /**
   * Get user's goals
   */
  getGoals: {
    description: "Get user's financial goals with progress. Use this to check goal progress, see active goals, or analyze goal completion.",
    parameters: z.object({
      status: z.enum(['active', 'completed', 'cancelled']).optional().describe('Filter by goal status'),
    }),
    execute: async ({ status }: { status?: 'active' | 'completed' | 'cancelled' }) => {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Unauthorized')

      let query = supabase
        .from('goals')
        .select('*, categories(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) throw error

      const goalsWithProgress = (data || []).map((goal) => {
        const current = Number(goal.current_amount || 0)
        const target = Number(goal.target_amount)
        const progress = (current / target) * 100
        const remaining = target - current

        return {
          ...goal,
          progress: Math.round(progress),
          remaining,
          daysRemaining: goal.deadline
            ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : null,
        }
      })

      return {
        goals: goalsWithProgress,
        count: goalsWithProgress.length,
      }
    },
  },

  /**
   * Create a new transaction
   */
  createTransaction: {
    description: 'Create a new transaction (expense, income, or transfer). Use this when the user wants to add a transaction manually.',
    parameters: z.object({
      amount: z.number().positive().describe('Transaction amount'),
      type: z.enum(['income', 'expense', 'transfer']).describe('Transaction type'),
      description: z.string().describe('Transaction description'),
      accountId: z.string().uuid().describe('Account ID'),
      categoryId: z.string().uuid().optional().describe('Category ID (optional)'),
      transactionDate: z.string().describe('Transaction date in ISO format (YYYY-MM-DD)'),
      notes: z.string().optional().describe('Additional notes'),
    }),
    execute: async ({
      amount,
      type,
      description,
      accountId,
      categoryId,
      transactionDate,
      notes,
    }: {
      amount: number
      type: 'income' | 'expense' | 'transfer'
      description: string
      accountId: string
      categoryId?: string
      transactionDate: string
      notes?: string
    }) => {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Unauthorized')

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          account_id: accountId,
          category_id: categoryId || null,
          amount,
          type,
          description,
          transaction_date: transactionDate,
          notes: notes || null,
        })
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        transaction: data,
        message: `${type} transaction of ${amount} created successfully`,
      }
    },
  },

  /**
   * Get spending analytics
   */
  getSpendingAnalytics: {
    description: 'Get spending analytics and insights. Use this to analyze spending patterns, category breakdowns, trends, and financial summaries.',
    parameters: z.object({
      startDate: z.string().optional().describe('Start date in ISO format (YYYY-MM-DD). Defaults to 30 days ago.'),
      endDate: z.string().optional().describe('End date in ISO format (YYYY-MM-DD). Defaults to today.'),
      groupBy: z.enum(['category', 'day', 'week', 'month']).optional().default('category').describe('Group results by category, day, week, or month'),
    }),
    execute: async ({
      startDate,
      endDate,
      groupBy = 'category',
    }: {
      startDate?: string
      endDate?: string
      groupBy?: 'category' | 'day' | 'week' | 'month'
    }) => {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Unauthorized')

      const end = endDate || new Date().toISOString().split('T')[0]
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*, categories(*)')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('transaction_date', start)
        .lte('transaction_date', end)

      if (error) throw error

      const totalExpenses = (transactions || []).reduce((sum, t) => sum + Number(t.amount || 0), 0)

      // Group by category
      const byCategory: Record<string, number> = {}
      transactions?.forEach((t) => {
        const categoryName = t.categories?.name || 'Uncategorized'
        byCategory[categoryName] = (byCategory[categoryName] || 0) + Number(t.amount || 0)
      })

      const categoryBreakdown = Object.entries(byCategory)
        .map(([name, amount]) => ({
          category: name,
          amount,
          percentage: (amount / totalExpenses) * 100,
        }))
        .sort((a, b) => b.amount - a.amount)

      return {
        totalExpenses,
        categoryBreakdown,
        transactionCount: transactions?.length || 0,
        period: { start, end },
      }
    },
  },
} as const

