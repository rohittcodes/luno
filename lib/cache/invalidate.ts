import 'server-only'

import { revalidateTag } from 'next/cache'

/**
 * Cache tag constants for different data types
 * Tags are used to group related cached data for invalidation
 */
export const CACHE_TAGS = {
  // User-specific subscription data
  subscriptionLimits: (userId: string) => `subscription-limits:${userId}`,
  userSubscription: (userId: string) => `user-subscription:${userId}`,
  transactionCount: (userId: string) => `transaction-count:${userId}`,
  categoryCount: (userId: string) => `category-count:${userId}`,
  bankConnectionCount: (userId: string) => `bank-connection-count:${userId}`,
  
  // Categories
  categories: (userId: string) => `categories:${userId}`,
  
  // All user data (for full cache invalidation)
  userData: (userId: string) => `user-data:${userId}`,
} as const

/**
 * Invalidate subscription-related cache for a user
 * Call this when subscription limits or plan changes
 * This forces the cache to be revalidated on the next request
 */
export function invalidateSubscriptionCache(userId: string) {
  // revalidateTag in Next.js 16 takes tag and optional profile
  // Using 'max' profile for stale-while-revalidate behavior (better UX)
  revalidateTag(CACHE_TAGS.subscriptionLimits(userId), 'max')
  revalidateTag(CACHE_TAGS.userSubscription(userId), 'max')
  // Also invalidate counts since limits may have changed
  revalidateTag(CACHE_TAGS.transactionCount(userId), 'max')
  revalidateTag(CACHE_TAGS.categoryCount(userId), 'max')
  revalidateTag(CACHE_TAGS.bankConnectionCount(userId), 'max')
}

/**
 * Invalidate transaction count cache for a user
 * Call this when a transaction is added, updated, or deleted
 * This forces the transaction count to be recalculated
 * Uses 'max' profile for stale-while-revalidate (users see stale data briefly while it refreshes)
 */
export function invalidateTransactionCountCache(userId: string) {
  revalidateTag(CACHE_TAGS.transactionCount(userId), 'max')
}

/**
 * Invalidate category cache for a user
 * Call this when a category is added, updated, or deleted
 * Uses 'max' profile for stale-while-revalidate
 */
export function invalidateCategoryCache(userId: string) {
  revalidateTag(CACHE_TAGS.categories(userId), 'max')
  revalidateTag(CACHE_TAGS.categoryCount(userId), 'max')
}

/**
 * Invalidate bank connection count cache for a user
 * Call this when a bank connection is added, removed, or status changes
 * Uses 'max' profile for stale-while-revalidate
 */
export function invalidateBankConnectionCache(userId: string) {
  revalidateTag(CACHE_TAGS.bankConnectionCount(userId), 'max')
}

/**
 * Invalidate all user-related cache
 * Use sparingly - only when necessary for complete data refresh
 * Uses 'max' profile for stale-while-revalidate
 */
export function invalidateAllUserCache(userId: string) {
  revalidateTag(CACHE_TAGS.userData(userId), 'max')
  // Invalidate all related tags
  invalidateSubscriptionCache(userId)
  invalidateTransactionCountCache(userId)
  invalidateCategoryCache(userId)
  invalidateBankConnectionCache(userId)
}

