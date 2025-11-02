import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type Transaction = Database['public']['Tables']['transactions']['Row']
type Account = Database['public']['Tables']['accounts']['Row']
type Budget = Database['public']['Tables']['budgets']['Row']

export interface DashboardSummary {
  totalIncome: number
  totalExpenses: number
  accountBalance: number
  recentTransactions: Transaction[]
  accounts: Account[]
  budgets: Budget[]
  unreadNotifications: number
}

/**
 * Fetch dashboard summary data (Server Component)
 * Uses server-side data fetching with caching
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Fetch data in parallel
  const [
    transactionsResult,
    accountsResult,
    budgetsResult,
    notificationsResult,
  ] = await Promise.all([
    supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .gte('transaction_date', startOfMonth.toISOString().split('T')[0])
      .order('transaction_date', { ascending: false })
      .limit(5),
    supabase.from('accounts').select('*').eq('user_id', user.id),
    supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false),
  ])

  // Type assertions for Supabase query results
  const transactions = (transactionsResult.data || []) as Transaction[]
  const accounts = (accountsResult.data || []) as Account[]
  const budgets = (budgetsResult.data || []) as Budget[]
  const unreadCount = notificationsResult.count || 0

  // Calculate totals
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0)

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0)

  const accountBalance = accounts.reduce(
    (sum, a) => sum + Number(a.balance || 0),
    0
  )

  return {
    totalIncome,
    totalExpenses,
    accountBalance,
    recentTransactions: transactions,
    accounts: accounts,
    budgets: budgets,
    unreadNotifications: unreadCount,
  }
}

