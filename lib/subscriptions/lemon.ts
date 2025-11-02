import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import { invalidateSubscriptionCache } from '@/lib/cache/invalidate'

/**
 * Get customer portal URL from Lemon Squeezy
 */
export async function getCustomerPortalUrl(userId: string): Promise<string | null> {
  const supabase = await createClient()
  
  const result = await supabase
    .from('user_subscriptions')
    .select('lemon_squeezy_customer_id')
    .eq('user_id', userId)
    .single()
  
  const subscription = result.data as Database['public']['Tables']['user_subscriptions']['Row'] | null
  
  if (result.error || !subscription?.lemon_squeezy_customer_id) {
    return null
  }
  
  try {
    const response = await fetch(
      `https://api.lemonsqueezy.com/v1/customers/${subscription.lemon_squeezy_customer_id}`,
      {
        headers: {
          'Accept': 'application/vnd.api+json',
          'Authorization': `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
        },
      }
    )
    
    if (!response.ok) {
      return null
    }
    
    const { data } = await response.json()
    return data.attributes.urls?.customer_portal || null
  } catch (error) {
    console.error('Error fetching customer portal URL:', error)
    return null
  }
}

/**
 * Update subscription limits based on plan type
 */
export async function updateSubscriptionLimits(userId: string, planType: 'free' | 'pro' | 'family') {
  const supabase = await createClient()
  
  const limits = {
    free: {
      transactions_limit: 50,
      categories_limit: 10,
      bank_connections_limit: 1,
      receipt_scans_limit: 0,
      family_members_limit: 0,
    },
    pro: {
      transactions_limit: -1, // unlimited
      categories_limit: -1,
      bank_connections_limit: 5,
      receipt_scans_limit: 10,
      family_members_limit: 0,
    },
    family: {
      transactions_limit: -1,
      categories_limit: -1,
      bank_connections_limit: 10,
      receipt_scans_limit: 20,
      family_members_limit: 5,
    },
  }
  
  const limitData = limits[planType]
  const insertData = {
    user_id: userId,
    transactions_limit: limitData.transactions_limit,
    categories_limit: limitData.categories_limit,
    bank_connections_limit: limitData.bank_connections_limit,
    receipt_scans_limit: limitData.receipt_scans_limit,
    family_members_limit: limitData.family_members_limit,
    updated_at: new Date().toISOString(),
  }
  
  // Type assertion needed until database types are fully generated
  const { error } = await (supabase
    .from('subscription_limits') as any)
    .upsert(insertData)
  
  if (error) {
    console.error('Error updating subscription limits:', error)
    throw error
  }
  
  // Invalidate cache after updating subscription limits
  invalidateSubscriptionCache(userId)
}

/**
 * Get checkout URL for a plan
 */
export function getCheckoutUrl(planType: 'pro' | 'family', userEmail: string, userId: string): string {
  const variantId = planType === 'pro'
    ? process.env.LEMONSQUEEZY_PRO_VARIANT_ID!
    : process.env.LEMONSQUEEZY_FAMILY_VARIANT_ID!
  
  const storeUrl = process.env.LEMONSQUEEZY_STORE_URL!
  
  const params = new URLSearchParams({
    'checkout[email]': userEmail,
    'checkout[custom][user_id]': userId,
  })
  
  return `https://${storeUrl}/checkout/buy/${variantId}?${params.toString()}`
}

