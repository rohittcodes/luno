import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import {
  getCachedSubscriptionLimits,
  getCachedTransactionCount,
  getCachedCategoryCount,
  getCachedBankConnectionCount,
  getCachedUserSubscription,
} from '@/lib/data/cached-subscription-data'

/**
 * Check if user has reached transaction limit
 * Uses cached subscription limits and transaction count for better performance
 */
export async function checkTransactionLimit(userId: string): Promise<boolean> {
  const limits = await getCachedSubscriptionLimits(userId)
  
  if (!limits) {
    // Default to free tier limits if not set
    return false
  }
  
  // -1 means unlimited
  if (limits.transactions_limit === -1) {
    return true
  }
  
  const count = await getCachedTransactionCount(userId)
  const limit = limits.transactions_limit ?? 50 // Default to 50 if null
  
  return count < limit
}

/**
 * Check if user has reached category limit
 * Uses cached subscription limits and category count for better performance
 */
export async function checkCategoryLimit(userId: string): Promise<boolean> {
  const limits = await getCachedSubscriptionLimits(userId)
  
  if (!limits) {
    return false
  }
  
  if (limits.categories_limit === -1) {
    return true
  }
  
  const count = await getCachedCategoryCount(userId)
  const limit = limits.categories_limit ?? 10 // Default to 10 if null
  
  return count < limit
}

/**
 * Check if user can add more bank connections
 * Uses cached subscription limits and connection count for better performance
 */
export async function checkBankConnectionLimit(userId: string): Promise<boolean> {
  const limits = await getCachedSubscriptionLimits(userId)
  
  if (!limits) {
    return false
  }
  
  if (limits.bank_connections_limit === -1) {
    return true
  }
  
  const count = await getCachedBankConnectionCount(userId)
  const limit = limits.bank_connections_limit ?? 1 // Default to 1 if null
  
  return count < limit
}

/**
 * Check if user can scan more receipts
 */
export async function checkReceiptScanLimit(userId: string): Promise<boolean> {
  const supabase = await createClient()
  
  const result = await supabase
    .from('subscription_limits')
    .select('receipt_scans_limit')
    .eq('user_id', userId)
    .single()
  
  const limits = result.data as Database['public']['Tables']['subscription_limits']['Row'] | null
  
  if (result.error || !limits || limits.receipt_scans_limit === 0) {
    return false
  }
  
  if (limits.receipt_scans_limit === -1) {
    return true
  }
  
  // Count receipt scans this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  
  const { count } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('receipt_url', 'is', null)
    .gte('created_at', startOfMonth.toISOString())
  
  const limit = limits.receipt_scans_limit ?? 0 // Default to 0 if null
  
  return (count || 0) < limit
}

/**
 * Get user's subscription plan
 * Uses cached subscription data for better performance
 */
export async function getUserSubscription(userId: string) {
  const subscription = await getCachedUserSubscription(userId)
  
  if (!subscription) {
    return { plan_type: 'free' as const, status: 'active' as const }
  }
  
  return subscription
}

/**
 * Check if user has a specific feature enabled
 */
export async function hasFeature(userId: string, feature: 'receipt_scanning' | 'investment_tracking' | 'family_sharing'): Promise<boolean> {
  const subscription = await getUserSubscription(userId)
  
  switch (feature) {
    case 'receipt_scanning':
    case 'investment_tracking':
      return subscription.plan_type !== 'free'
    case 'family_sharing':
      return subscription.plan_type === 'family'
    default:
      return false
  }
}

