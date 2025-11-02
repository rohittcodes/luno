import { z } from 'zod'

/**
 * Validation schemas for financial data
 * Using Zod for runtime type validation and security
 */

/**
 * Transaction validation schema
 */
export const transactionSchema = z.object({
  description: z.string().min(1).max(500),
  type: z.enum(['income', 'expense']),
  amount: z.number().positive().max(999999999), // Max 999M
  currency: z.string().length(3).default('USD'),
  account_id: z.string().uuid().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  notes: z.string().max(1000).nullable().optional(),
})

/**
 * Category validation schema
 */
export const categorySchema = z.object({
  name: z.string().min(1).max(100),
  parent_id: z.string().uuid().nullable().optional(),
  icon: z.string().max(50).nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
})

/**
 * Account validation schema
 */
export const accountSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['checking', 'savings', 'credit', 'investment', 'other']),
  balance: z.number().max(999999999),
  currency: z.string().length(3).default('USD'),
  description: z.string().max(500).nullable().optional(),
})

/**
 * Budget validation schema
 */
export const budgetSchema = z.object({
  name: z.string().min(1).max(100),
  category_id: z.string().uuid().nullable(),
  amount: z.number().positive().max(999999999),
  currency: z.string().length(3).default('USD'),
  period: z.enum(['weekly', 'monthly', 'yearly']),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
})

/**
 * Subscription/Bill validation schema
 */
export const subscriptionBillSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['bill', 'subscription', 'free_trial']),
  amount: z.number().positive().max(999999999).nullable().optional(),
  currency: z.string().length(3).default('USD').nullable().optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  renewal_frequency: z.enum(['weekly', 'monthly', 'yearly', 'quarterly', 'annually']).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
})

/**
 * Validate and sanitize transaction data
 */
export function validateTransaction(data: unknown) {
  return transactionSchema.parse(data)
}

/**
 * Validate and sanitize category data
 */
export function validateCategory(data: unknown) {
  return categorySchema.parse(data)
}

/**
 * Validate and sanitize account data
 */
export function validateAccount(data: unknown) {
  return accountSchema.parse(data)
}

/**
 * Validate and sanitize budget data
 */
export function validateBudget(data: unknown) {
  return budgetSchema.parse(data)
}

/**
 * Validate and sanitize subscription/bill data
 */
export function validateSubscriptionBill(data: unknown) {
  return subscriptionBillSchema.parse(data)
}

/**
 * Validate UUID format
 */
export function validateUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

/**
 * Sanitize string input - remove potentially dangerous characters
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  return input
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .trim()
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

