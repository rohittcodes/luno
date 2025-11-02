import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'
import type { Database } from '@/types/database'

type SubscriptionLimits = Database['public']['Tables']['subscription_limits']['Row']
type UserSubscription = Database['public']['Tables']['user_subscriptions']['Row']

/**
 * Get user subscription limits with caching
 * Uses React cache for request-level memoization
 */
export const getCachedSubscriptionLimits = cache(async (userId: string): Promise<SubscriptionLimits | null> => {

  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('subscription_limits')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return null
  }

  return data as SubscriptionLimits
})

/**
 * Get user subscription with caching
 * Uses React cache for request-level memoization
 */
export const getCachedUserSubscription = cache(async (userId: string): Promise<UserSubscription | null> => {

  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return null
  }

  return data as UserSubscription
})

/**
 * Get count of user's transactions with caching
 * Uses React cache for request-level memoization
 */
export const getCachedTransactionCount = cache(async (userId: string): Promise<number> => {

  const supabase = await createClient()
  
  const { count } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  return count || 0
})

/**
 * Get count of user's categories with caching
 * Uses React cache for request-level memoization
 */
export const getCachedCategoryCount = cache(async (userId: string): Promise<number> => {

  const supabase = await createClient()
  
  const { count } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  return count || 0
})

/**
 * Get count of user's bank connections with caching
 * Uses React cache for request-level memoization
 */
export const getCachedBankConnectionCount = cache(async (userId: string): Promise<number> => {

  const supabase = await createClient()
  
  const { count } = await supabase
    .from('external_connections')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('integration_type', 'bank')
    .eq('status', 'active')

  return count || 0
})