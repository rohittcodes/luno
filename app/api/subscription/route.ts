import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserSubscription } from '@/lib/subscriptions/check-limits'
import { getCachedSubscriptionLimits } from '@/lib/data/cached-subscription-data'

/**
 * Get user subscription information
 * GET /api/subscription
 * Uses cached subscription data for better performance
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

    const subscription = await getUserSubscription(user.id)
    const limits = await getCachedSubscriptionLimits(user.id)

    return NextResponse.json({
      subscription,
      limits: limits || null,
    })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

