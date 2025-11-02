import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { updateSubscriptionLimits } from '@/lib/subscriptions/lemon'
import { storeSubscriptionData } from '@/lib/subscriptions/secure-storage'
import type { Database } from '@/types/database'

/**
 * Lemon Squeezy Webhook Handler
 * Handles subscription events from Lemon Squeezy
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-signature') || ''
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET

    if (!secret) {
      console.error('LEMONSQUEEZY_WEBHOOK_SECRET not configured')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    // Verify webhook signature
    const hmac = crypto.createHmac('sha256', secret)
    const digest = hmac.update(body).digest('hex')

    if (signature !== digest) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(body)
    const eventName = event.meta?.event_name

    if (!eventName) {
      return NextResponse.json({ error: 'Invalid event format' }, { status: 400 })
    }

    console.log(`Processing Lemon Squeezy event: ${eventName}`)

    // Handle different event types
    switch (eventName) {
      case 'subscription_created':
        await handleSubscriptionCreated(event)
        break
      case 'subscription_updated':
        await handleSubscriptionUpdated(event)
        break
      case 'subscription_cancelled':
        await handleSubscriptionCancelled(event)
        break
      case 'subscription_expired':
        await handleSubscriptionExpired(event)
        break
      case 'subscription_payment_success':
        await handlePaymentSuccess(event)
        break
      case 'subscription_payment_failed':
        await handlePaymentFailed(event)
        break
      case 'subscription_payment_recovered':
        await handlePaymentRecovered(event)
        break
      case 'order_created':
        await handleOrderCreated(event)
        break
      default:
        console.log(`Unhandled event type: ${eventName}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleSubscriptionCreated(event: any) {
  const supabase = await createClient()
  const { data } = event.data // Lemon Squeezy uses JSON:API format

  // Extract user_id from custom data or order metadata
  let userId: string | null = null
  
  // Try to get from custom data first
  if (data.attributes.custom_data?.user_id) {
    userId = data.attributes.custom_data.user_id
  } else {
    // Fallback: try to get from order custom data
    // We may need to fetch the order to get custom data
    console.log('No user_id in subscription custom_data, attempting to fetch from order')
    // For now, we'll need to handle this case - might need to store order_id -> user_id mapping
  }

  if (!userId) {
    console.error('Could not determine user_id for subscription:', data.id)
    return
  }

  // Determine plan type from variant_id or product name
  const variantId = data.attributes.variant_id?.toString()
  const planType = variantId === process.env.LEMONSQUEEZY_PRO_VARIANT_ID
    ? 'pro'
    : variantId === process.env.LEMONSQUEEZY_FAMILY_VARIANT_ID
    ? 'family'
    : 'pro' // default

  // Store subscription data with encryption (includes payment metadata)
  await storeSubscriptionData(userId, {
    lemon_squeezy_subscription_id: data.id.toString(),
    lemon_squeezy_customer_id: data.attributes.customer_id?.toString() || '',
    lemon_squeezy_order_id: data.attributes.order_id?.toString(),
    payment_method_last_four: data.attributes.card_last_four,
    payment_method_brand: data.attributes.card_brand,
  })

  // Update subscription record with plan and status
  const { error: updateError } = await supabase
    .from('user_subscriptions')
    .update({
      plan_type: planType,
      status: data.attributes.status || 'active',
      current_period_start: data.attributes.created_at
        ? new Date(data.attributes.created_at).toISOString()
        : new Date().toISOString(),
      current_period_end: data.attributes.renews_at
        ? new Date(data.attributes.renews_at).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    } as any)
    .eq('user_id', userId)

  if (updateError) {
    console.error('Error updating subscription:', updateError)
    throw updateError
  }

  // Update subscription limits
  await updateSubscriptionLimits(userId, planType)
}

async function handleSubscriptionUpdated(event: any) {
  const supabase = await createClient()
  const { data } = event.data

  const subscriptionId = data.id.toString()

  // Find subscription by Lemon Squeezy ID
  const { data: existingSubscription } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('lemon_squeezy_subscription_id', subscriptionId)
    .single()

  if (!existingSubscription) {
    console.error('Subscription not found:', subscriptionId)
    return
  }

  // Update subscription status and dates
  await supabase
    .from('user_subscriptions')
    .update({
      status: data.attributes.status || 'active',
      current_period_end: data.attributes.renews_at
        ? new Date(data.attributes.renews_at).toISOString()
        : null,
      cancel_at_period_end: data.attributes.cancelled || false,
      updated_at: new Date().toISOString(),
    })
    .eq('lemon_squeezy_subscription_id', subscriptionId)

  // Update payment method if changed
  if (data.attributes.card_last_four || data.attributes.card_brand) {
    await storeSubscriptionData(existingSubscription.user_id, {
      lemon_squeezy_subscription_id: subscriptionId,
      lemon_squeezy_customer_id: data.attributes.customer_id?.toString() || '',
      payment_method_last_four: data.attributes.card_last_four,
      payment_method_brand: data.attributes.card_brand,
    })
  }
}

async function handleSubscriptionCancelled(event: any) {
  const supabase = await createClient()
  const { data } = event.data

  const subscriptionId = data.id.toString()

  await supabase
    .from('user_subscriptions')
    .update({
      status: 'canceled',
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    })
    .eq('lemon_squeezy_subscription_id', subscriptionId)

  // Optionally downgrade to free tier after period ends
  // This will be handled when subscription actually expires
}

async function handleSubscriptionExpired(event: any) {
  const supabase = await createClient()
  const { data } = event.data

  const subscriptionId = data.id.toString()

  // Downgrade to free tier
  await supabase
    .from('user_subscriptions')
    .update({
      plan_type: 'free',
      status: 'expired',
      updated_at: new Date().toISOString(),
    })
    .eq('lemon_squeezy_subscription_id', subscriptionId)

  // Get user_id to update limits
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('lemon_squeezy_subscription_id', subscriptionId)
    .single()

  if (subscription) {
    await updateSubscriptionLimits(subscription.user_id, 'free')
  }
}

async function handlePaymentSuccess(event: any) {
  const supabase = await createClient()
  const { data } = event.data

  const subscriptionId = data.id.toString()

  await supabase
    .from('user_subscriptions')
    .update({
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('lemon_squeezy_subscription_id', subscriptionId)
}

async function handlePaymentFailed(event: any) {
  const supabase = await createClient()
  const { data } = event.data

  const subscriptionId = data.id.toString()

  await supabase
    .from('user_subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('lemon_squeezy_subscription_id', subscriptionId)
}

async function handlePaymentRecovered(event: any) {
  await handlePaymentSuccess(event)
}

async function handleOrderCreated(event: any) {
  // Store order information if needed
  // This can be used to map orders to users when custom_data is missing
  const { data } = event.data
  
  // Store order -> user_id mapping for future reference
  // This helps when subscription_created doesn't have custom_data
  console.log('Order created:', data.id, data.attributes)
}

