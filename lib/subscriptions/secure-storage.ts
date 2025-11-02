import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { encrypt, decrypt, encryptJSON, decryptJSON } from '@/lib/encryption/encrypt'
import type { Database } from '@/types/database'

type UserSubscriptionInsert = Database['public']['Tables']['user_subscriptions']['Insert']
type UserSubscriptionUpdate = Database['public']['Tables']['user_subscriptions']['Update']
type UserSubscriptionRow = Database['public']['Tables']['user_subscriptions']['Row']

/**
 * Securely store subscription data with encryption
 * 
 * Marked with 'server-only' to prevent client-side access to sensitive data
 */

export interface SecureSubscriptionData {
  lemon_squeezy_subscription_id: string
  lemon_squeezy_customer_id: string
  lemon_squeezy_order_id?: string
  payment_method_last_four?: string
  payment_method_brand?: string
}

/**
 * Store subscription data with encrypted sensitive fields
 */
export async function storeSubscriptionData(
  userId: string,
  subscriptionData: SecureSubscriptionData
) {
  const supabase = await createClient()
  
  // Encrypt sensitive metadata
  const paymentMetadata: Record<string, string | undefined> = {}
  if (subscriptionData.payment_method_last_four) {
    paymentMetadata.payment_method_last_four = subscriptionData.payment_method_last_four
  }
  if (subscriptionData.payment_method_brand) {
    paymentMetadata.payment_method_brand = subscriptionData.payment_method_brand
  }
  
  const encryptedMetadata = Object.keys(paymentMetadata).length > 0
    ? encryptJSON(paymentMetadata)
    : null
  
  // First, check if subscription exists
  const { data: existing } = await supabase
    .from('user_subscriptions')
    .select('id')
    .eq('user_id', userId)
    .single()
  
  const subscriptionDataToUpdate: UserSubscriptionUpdate = {
    lemon_squeezy_subscription_id: subscriptionData.lemon_squeezy_subscription_id,
    lemon_squeezy_customer_id: subscriptionData.lemon_squeezy_customer_id,
    lemon_squeezy_order_id: subscriptionData.lemon_squeezy_order_id,
    secure_metadata: encryptedMetadata,
    updated_at: new Date().toISOString(),
  }
  
  if (existing) {
    const { error } = await (supabase
      .from('user_subscriptions') as any)
      .update(subscriptionDataToUpdate)
      .eq('user_id', userId)
    
    if (error) {
      console.error('Error updating subscription data:', error)
      throw error
    }
  } else {
    const insertData: UserSubscriptionInsert = {
      user_id: userId,
      plan_type: 'free', // Will be updated by webhook
      ...subscriptionDataToUpdate,
    }
    
    const { error } = await (supabase
      .from('user_subscriptions') as any)
      .insert(insertData)
    
    if (error) {
      console.error('Error creating subscription data:', error)
      throw error
    }
  }
}

/**
 * Retrieve and decrypt subscription data
 */
export async function getSubscriptionData(userId: string): Promise<SubscriptionDataWithMetadata | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (error || !data) {
    return null
  }
  
  // Type assertion for Supabase query result
  const subscription = data as UserSubscriptionRow
  
  // Decrypt metadata if present
  let paymentMetadata: Record<string, string> | null = null
  if (subscription.secure_metadata) {
    try {
      paymentMetadata = decryptJSON(subscription.secure_metadata)
    } catch (err) {
      console.error('Error decrypting metadata:', err)
    }
  }
  
      return {
        id: subscription.id,
        user_id: subscription.user_id,
        plan_type: subscription.plan_type,
        status: subscription.status || 'active',
    lemon_squeezy_subscription_id: subscription.lemon_squeezy_subscription_id,
    lemon_squeezy_customer_id: subscription.lemon_squeezy_customer_id,
    lemon_squeezy_order_id: subscription.lemon_squeezy_order_id,
    current_period_start: subscription.current_period_start,
    current_period_end: subscription.current_period_end,
    cancel_at_period_end: subscription.cancel_at_period_end ?? false,
    created_at: subscription.created_at || new Date().toISOString(),
    updated_at: subscription.updated_at || new Date().toISOString(),
    payment_metadata: paymentMetadata,
  }
}

/**
 * Encrypt external connection metadata
 */
export function encryptConnectionMetadata(metadata: Record<string, any>): string {
  return encryptJSON(metadata)
}

/**
 * Decrypt external connection metadata
 */
export function decryptConnectionMetadata(encryptedMetadata: string): Record<string, any> {
  return decryptJSON(encryptedMetadata)
}

/**
 * Get subscription data with decrypted metadata
 */
export interface SubscriptionDataWithMetadata {
  id: string
  user_id: string
  plan_type: string
  status: string
  lemon_squeezy_subscription_id: string | null
  lemon_squeezy_customer_id: string | null
  lemon_squeezy_order_id: string | null
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
  payment_metadata: Record<string, string> | null
}

