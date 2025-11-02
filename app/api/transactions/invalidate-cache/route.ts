import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { invalidateTransactionCountCache } from '@/lib/cache/invalidate'

/**
 * Invalidate transaction count cache for the current user
 * POST /api/transactions/invalidate-cache
 * 
 * This route is called after transaction mutations to ensure
 * cache is refreshed with the latest count
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Invalidate transaction count cache
    invalidateTransactionCountCache(user.id)

    return NextResponse.json({ success: true, message: 'Cache invalidated' })
  } catch (error) {
    console.error('Error invalidating cache:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

