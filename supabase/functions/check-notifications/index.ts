// Deno HTTP imports - these work at runtime but TypeScript doesn't recognize them
// @ts-ignore - Deno runtime imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore - Deno ESM imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Deno global type (for Supabase editor)
// @ts-ignore - Deno runtime global
declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPreference {
  user_id: string
  bill_reminder_days: number[]
  subscription_reminder_days: number[]
  trial_reminder_days: number[]
  email_enabled: boolean
  in_app_enabled: boolean
}

interface SubscriptionBill {
  id: string
  user_id: string
  name: string
  type: 'bill' | 'subscription' | 'free_trial'
  due_date: string
  amount?: number
  currency?: string
  last_notified_at?: string | null
  users_profile: {
    email: string
    timezone?: string
  }
}

interface EmailTemplate {
  subject: string
  html: string
}

/**
 * Generate email template for bill due notification
 */
function generateBillDueEmail(
  billName: string,
  dueDate: Date,
  daysUntilDue: number,
  amount?: number,
  currency: string = 'USD'
): EmailTemplate {
  const formattedAmount = amount
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount)
    : null

  const subject = `Reminder: ${billName} is due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a1a;">Bill Due Reminder</h1>
          <p>This is a reminder that <strong>${billName}</strong> is due in <strong>${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}</strong> (${dueDate.toLocaleDateString()}).</p>
          ${formattedAmount ? `<p><strong>Amount:</strong> ${formattedAmount}</p>` : ''}
          <p>Please make sure to pay this bill on time to avoid any late fees.</p>
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            This is an automated notification from Luno Finance Manager.
          </p>
        </div>
      </body>
    </html>
  `

  return { subject, html }
}

/**
 * Generate email template for subscription renewal notification
 */
function generateSubscriptionRenewalEmail(
  subscriptionName: string,
  renewalDate: Date,
  daysUntilDue: number,
  amount?: number,
  currency: string = 'USD'
): EmailTemplate {
  const formattedAmount = amount
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount)
    : null

  const subject = `Subscription Renewal: ${subscriptionName} renews in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a1a;">Subscription Renewal Reminder</h1>
          <p>Your subscription for <strong>${subscriptionName}</strong> will renew in <strong>${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}</strong> (${renewalDate.toLocaleDateString()}).</p>
          ${formattedAmount ? `<p><strong>Amount:</strong> ${formattedAmount}</p>` : ''}
          <p>Make sure you have sufficient funds in your account.</p>
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            This is an automated notification from Luno Finance Manager.
          </p>
        </div>
      </body>
    </html>
  `

  return { subject, html }
}

/**
 * Generate email template for trial expiration notification
 */
function generateTrialExpirationEmail(
  trialName: string,
  expirationDate: Date,
  daysUntilDue: number
): EmailTemplate {
  const subject = `Free Trial Ending: ${trialName} expires in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1a1a;">Free Trial Ending Soon</h1>
          <p>Your free trial for <strong>${trialName}</strong> expires in <strong>${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}</strong> (${expirationDate.toLocaleDateString()}).</p>
          <p>Consider subscribing before the trial ends to continue using the service.</p>
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            This is an automated notification from Luno Finance Manager.
          </p>
        </div>
      </body>
    </html>
  `

  return { subject, html }
}

/**
 * Send email using Resend API
 */
async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'Luno <noreply@yourdomain.com>'

  if (!resendApiKey) {
    console.warn('RESEND_API_KEY not configured, skipping email')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject,
        html,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Resend API error:', errorData)
      return { success: false, error: JSON.stringify(errorData) }
    }

    const data = await response.json()
    console.log('Email sent successfully:', data.id)
    return { success: true }
  } catch (error) {
    console.error('Error sending email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all active subscriptions/bills with upcoming due dates
    const today = new Date().toISOString().split('T')[0]
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
    const sevenDaysFromNowStr = sevenDaysFromNow.toISOString().split('T')[0]

    // Find subscriptions/bills due in the next 7 days
    const { data: upcomingItems, error: itemsError } = await supabase
      .from('subscriptions_bills')
      .select('*, users_profile!inner(email, timezone)')
      .eq('is_active', true)
      .gte('due_date', today)
      .lte('due_date', sevenDaysFromNowStr)

    if (itemsError) {
      throw itemsError
    }

    if (!upcomingItems || upcomingItems.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No upcoming items to notify', processed: 0 }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Get all users' notification preferences
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('*')

    // Type assertion for Supabase query result
    // Supabase returns unknown type, so we need to cast it explicitly
    // Cast to any first, then to our type to satisfy strict editors
    const typedPreferences: NotificationPreference[] = ((preferences as any) || []) as NotificationPreference[]
    
    const preferencesMap = new Map<string, NotificationPreference>()
    for (const pref of typedPreferences) {
      if (pref && pref.user_id) {
        preferencesMap.set(pref.user_id, pref as NotificationPreference)
      }
    }

    let notificationsCreated = 0
    let emailsSent = 0
    const now = new Date()

    // Process each upcoming item
    for (const item of upcomingItems as SubscriptionBill[]) {
      const userId = item.user_id
      const dueDate = new Date(item.due_date)
      const daysUntilDue = Math.ceil(
        (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      // Get user's notification preferences
      const savedPrefs: NotificationPreference | undefined = preferencesMap.get(userId)
      const defaultPrefs: NotificationPreference = {
        user_id: userId,
        bill_reminder_days: [7, 3, 1],
        subscription_reminder_days: [7, 3, 1],
        trial_reminder_days: [7, 3, 1],
        email_enabled: true,
        in_app_enabled: true,
      }
      // Use saved preferences if available, otherwise use defaults
      const userPrefs: NotificationPreference = savedPrefs ? savedPrefs : defaultPrefs

      // Determine which reminder days to use based on type
      let reminderDays: number[] = []
      if (item.type === 'bill') {
        reminderDays = userPrefs.bill_reminder_days || [7, 3, 1]
      } else if (item.type === 'subscription') {
        reminderDays = userPrefs.subscription_reminder_days || [7, 3, 1]
      } else if (item.type === 'free_trial') {
        reminderDays = userPrefs.trial_reminder_days || [7, 3, 1]
      }

      // Check if we should send a reminder today
      if (!reminderDays.includes(daysUntilDue)) {
        continue
      }

      // Check if we already notified for this day
      const lastNotified = item.last_notified_at
        ? new Date(item.last_notified_at)
        : null
      const daysSinceLastNotification = lastNotified
        ? Math.floor((now.getTime() - lastNotified.getTime()) / (1000 * 60 * 60 * 24))
        : null

      if (daysSinceLastNotification === 0) {
        // Already notified today
        continue
      }

      // Create notification based on type
      let title = ''
      let message = ''

      if (item.type === 'bill') {
        title = `Bill Due: ${item.name}`
        message = `${item.name} is due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}.`
        if (item.amount) {
          message += ` Amount: ${item.currency || 'USD'} ${item.amount}`
        }
      } else if (item.type === 'subscription') {
        title = `Subscription Renewal: ${item.name}`
        message = `${item.name} will renew in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}.`
        if (item.amount) {
          message += ` Amount: ${item.currency || 'USD'} ${item.amount}`
        }
      } else if (item.type === 'free_trial') {
        title = `Free Trial Ending: ${item.name}`
        message = `Your free trial for ${item.name} expires in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}.`
      }

      // Create in-app notification
      if (userPrefs.in_app_enabled !== false) {
        const { error: notifError } = await supabase.from('notifications').insert({
          user_id: userId,
          type:
            item.type === 'bill'
              ? 'bill_due'
              : item.type === 'subscription'
              ? 'subscription_renewal'
              : 'trial_expiring',
          title,
          message,
          related_entity_type: 'subscriptions_bills',
          related_entity_id: item.id,
          is_read: false,
        } as any)

        if (notifError) {
          console.error('Error creating notification:', notifError)
          continue
        }

        notificationsCreated++
      }

      // Send email if email_enabled is true
      if (userPrefs.email_enabled !== false && item.users_profile?.email) {
        let emailTemplate: EmailTemplate

        if (item.type === 'bill') {
          emailTemplate = generateBillDueEmail(
            item.name,
            dueDate,
            daysUntilDue,
            item.amount,
            item.currency || 'USD'
          )
        } else if (item.type === 'subscription') {
          emailTemplate = generateSubscriptionRenewalEmail(
            item.name,
            dueDate,
            daysUntilDue,
            item.amount,
            item.currency || 'USD'
          )
        } else {
          emailTemplate = generateTrialExpirationEmail(
            item.name,
            dueDate,
            daysUntilDue
          )
        }

        const emailResult = await sendEmail(
          item.users_profile.email,
          emailTemplate.subject,
          emailTemplate.html
        )

        if (emailResult.success) {
          emailsSent++
          console.log(`Email sent to ${item.users_profile.email} for ${item.name}`)
        } else {
          console.error(`Failed to send email to ${item.users_profile.email}:`, emailResult.error)
        }
      }

      // Update last_notified_at
      await supabase
        .from('subscriptions_bills')
        .update({ last_notified_at: now.toISOString() })
        .eq('id', item.id)
    }

    return new Response(
      JSON.stringify({
        message: 'Notifications processed successfully',
        processed: notificationsCreated,
        emails_sent: emailsSent,
        items_checked: upcomingItems.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error processing notifications:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
