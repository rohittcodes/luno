import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireAuth, validateQuery } from '@/lib/security/api-helpers'
import { validateEmail } from '@/lib/security/validation'
import { getCheckoutUrl } from '@/lib/subscriptions/lemon'

/**
 * Checkout Route - Redirects to Lemon Squeezy checkout
 * GET /api/checkout?plan=pro&email=user@example.com
 * 
 * Security: Validates plan type and email on server-side using Zod schemas
 * Note: API routes are dynamic by default, so no need for dynamic export
 */
const checkoutQuerySchema = z.object({
  plan: z.enum(['pro', 'family']),
  email: z.string().email().max(254).optional(),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url || 'http://localhost')
    
    // Validate query parameters with Zod schema
    const query = validateQuery(checkoutQuerySchema, searchParams)
    
    // Require authentication (validates user on server-side)
    const { user } = await requireAuth()

    // Use user's email or provided email (validate both)
    const email = query.email || user.email || ''
    if (!email || !validateEmail(email)) {
      return redirect('/settings/billing?error=no_email')
    }

    // Generate checkout URL
    const checkoutUrl = getCheckoutUrl(query.plan, email, user.id)

    return redirect(checkoutUrl)
  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error && error.message === 'Unauthorized') {
      return redirect('/login?redirectTo=/settings/billing')
    }
    // Handle validation errors
    if (error instanceof Error && error.message.includes('Validation failed')) {
      return redirect('/settings/billing?error=invalid_plan')
    }
    console.error('Checkout error:', error)
    return redirect('/settings/billing?error=checkout_failed')
  }
}

