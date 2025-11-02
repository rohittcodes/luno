import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getCachedTransactionCount,
  getCachedCategoryCount,
  getCachedBankConnectionCount,
} from '@/lib/data/cached-subscription-data'

/**
 * Get user usage counts for all features
 * GET /api/usage
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all usage counts in parallel
    const [
      transactionsCount,
      categoriesCount,
      bankConnectionsCount,
      receiptScansCount,
      familyMembersCount,
    ] = await Promise.all([
      getCachedTransactionCount(user.id),
      getCachedCategoryCount(user.id),
      getCachedBankConnectionCount(user.id),
      // Count receipt scans (transactions with receipt_url this month)
      (async () => {
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)

        const { count } = await supabase
          .from('transactions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .not('receipt_url', 'is', null)
          .gte('created_at', startOfMonth.toISOString())

        return count || 0
      })(),
      // Count household members (if user is in a household)
      (async () => {
        const { count } = await supabase
          .from('household_members')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)

        return count || 0
      })(),
    ])

    return NextResponse.json({
      transactions: transactionsCount,
      categories: categoriesCount,
      bankConnections: bankConnectionsCount,
      receiptScans: receiptScansCount,
      familyMembers: familyMembersCount,
    })
  } catch (error) {
    console.error('Error fetching usage:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
