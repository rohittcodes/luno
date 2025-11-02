import 'server-only'

import { createClient } from '@/lib/supabase/server'

/**
 * Get user's currency preference from database (Server Component only)
 * Falls back to USD if not set
 */
export async function getUserCurrency(userId: string): Promise<string> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('users_profile')
    .select('currency_preference')
    .eq('id', userId)
    .single()

  return data?.currency_preference || 'USD'
}

/**
 * Get user's locale preference (Server Component only)
 * Falls back to browser locale or 'en-US'
 */
export async function getUserLocale(userId: string): Promise<string> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('users_profile')
    .select('currency_preference')
    .eq('id', userId)
    .single()

  // Map currency to locale (can be enhanced with separate locale field)
  const currency = data?.currency_preference || 'USD'
  
  // Import getLocaleFromCurrency from the shared currency utils
  const { getLocaleFromCurrency } = await import('./currency')
  return getLocaleFromCurrency(currency)
}

/**
 * Format currency for display in server components
 * Gets currency from user profile automatically
 * @param amount - The amount to format
 * @param userId - User ID to fetch currency preference
 * @param fallbackCurrency - Currency to use if user preference not found (default: 'USD')
 */
export async function formatCurrencyForUser(
  amount: number | string,
  userId: string,
  fallbackCurrency: string = 'USD'
): Promise<string> {
  const currency = await getUserCurrency(userId)
  const locale = await getUserLocale(userId)
  
  // Import formatCurrency from the shared currency utils
  const { formatCurrency } = await import('./currency')
  return formatCurrency(amount, currency || fallbackCurrency, locale)
}

