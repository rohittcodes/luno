import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCustomerPortalUrl } from '@/lib/subscriptions/lemon'

/**
 * Get customer portal URL for subscription management
 * GET /api/billing/portal?userId=xxx
 * Note: API routes are dynamic by default, so no need for dynamic export
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url || 'http://localhost')
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Verify user is authenticated
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const portalUrl = await getCustomerPortalUrl(userId)

    if (!portalUrl) {
      return NextResponse.json(
        { error: 'No subscription found or portal unavailable' },
        { status: 404 }
      )
    }

    return NextResponse.json({ url: portalUrl })
  } catch (error) {
    console.error('Error getting portal URL:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

