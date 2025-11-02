import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkTransactionLimit, checkCategoryLimit, checkBankConnectionLimit, checkReceiptScanLimit } from '@/lib/subscriptions/check-limits'
import {
  getCachedSubscriptionLimits,
  getCachedTransactionCount,
  getCachedCategoryCount,
  getCachedBankConnectionCount,
} from '@/lib/data/cached-subscription-data'

/**
 * Check feature limits for authenticated user
 * GET /api/check-limits?feature=transactions
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const feature = searchParams.get('feature')

    if (!feature) {
      return NextResponse.json({ error: 'Feature parameter required' }, { status: 400 })
    }

    let canUse = false
    let current = 0
    let limit = 0

    switch (feature) {
      case 'transactions':
        canUse = await checkTransactionLimit(user.id)
        // Get current count from cache
        current = await getCachedTransactionCount(user.id)
        // Get limit from cache
        const transactionLimits = await getCachedSubscriptionLimits(user.id)
        limit = transactionLimits?.transactions_limit || 50
        break

      case 'categories':
        canUse = await checkCategoryLimit(user.id)
        // Get current count from cache
        current = await getCachedCategoryCount(user.id)
        // Get limit from cache
        const categoryLimits = await getCachedSubscriptionLimits(user.id)
        limit = categoryLimits?.categories_limit || 10
        break

      case 'bank_connections':
        canUse = await checkBankConnectionLimit(user.id)
        // Get current count from cache
        current = await getCachedBankConnectionCount(user.id)
        // Get limit from cache
        const connectionLimits = await getCachedSubscriptionLimits(user.id)
        limit = connectionLimits?.bank_connections_limit || 1
        break

      case 'receipt_scans':
        canUse = await checkReceiptScanLimit(user.id)
        const { count: scanCount } = await supabase
          .from('external_connections')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('integration_type', 'receipt_scanner')
        current = scanCount || 0
        const { data: scanLimit } = await supabase
          .from('subscription_limits')
          .select('receipt_scans_limit')
          .eq('user_id', user.id)
          .single()
        limit = scanLimit?.receipt_scans_limit || 0
        break

      default:
        return NextResponse.json({ error: 'Invalid feature' }, { status: 400 })
    }

    return NextResponse.json({
      canUse,
      current,
      limit: limit === -1 ? 'unlimited' : limit,
      isUnlimited: limit === -1,
    })
  } catch (error) {
    console.error('Error checking limits:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

