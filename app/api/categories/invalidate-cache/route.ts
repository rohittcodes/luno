import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { invalidateCategoryCache } from '@/lib/cache/invalidate'

/**
 * Invalidate category cache for the current user
 * POST /api/categories/invalidate-cache
 * 
 * This route is called after category mutations to ensure
 * cache is refreshed with the latest categories and count
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

    // Invalidate category cache
    invalidateCategoryCache(user.id)

    return NextResponse.json({ success: true, message: 'Cache invalidated' })
  } catch (error) {
    console.error('Error invalidating cache:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

