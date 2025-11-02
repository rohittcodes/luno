import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface EmailNotification {
  to: string
  subject: string
  html: string
}

/**
 * Send email notification
 */
export async function sendEmailNotification(notification: EmailNotification) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping email')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Luno <noreply@yourdomain.com>',
      to: notification.to,
      subject: notification.subject,
      html: notification.html,
    })

    if (error) {
      console.error('Error sending email:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error }
  }
}

/**
 * Generate email template for bill due notification
 */
export function generateBillDueEmail(
  billName: string,
  dueDate: Date,
  amount?: number,
  currency: string = 'USD'
): { subject: string; html: string } {
  const formattedAmount = amount
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount)
    : null

  const subject = `Reminder: ${billName} is due soon`
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
          <p>This is a reminder that <strong>${billName}</strong> is due on <strong>${dueDate.toLocaleDateString()}</strong>.</p>
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
export function generateSubscriptionRenewalEmail(
  subscriptionName: string,
  renewalDate: Date,
  amount: number,
  currency: string = 'USD'
): { subject: string; html: string } {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount)

  const subject = `Subscription Renewal: ${subscriptionName}`
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
          <p>Your subscription for <strong>${subscriptionName}</strong> will renew on <strong>${renewalDate.toLocaleDateString()}</strong>.</p>
          <p><strong>Amount:</strong> ${formattedAmount}</p>
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
export function generateTrialExpirationEmail(
  trialName: string,
  expirationDate: Date
): { subject: string; html: string } {
  const subject = `Free Trial Ending: ${trialName}`
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
          <p>Your free trial for <strong>${trialName}</strong> expires on <strong>${expirationDate.toLocaleDateString()}</strong>.</p>
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
 * Generate email template for household invitation
 */
export function generateHouseholdInvitationEmail(
  inviterName: string,
  householdName: string,
  inviteUrl: string,
  expiresIn: number = 7
): { subject: string; html: string } {
  const subject = `${inviterName} invited you to join ${householdName} on Luno`
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h1 style="color: #1a1a1a; margin-top: 0;">You've been invited!</h1>
            <p><strong>${inviterName}</strong> has invited you to join <strong>${householdName}</strong> on Luno Finance Manager.</p>
            <p>Collaborate on finances, share accounts, and split expenses together.</p>
            <div style="margin: 30px 0; text-align: center;">
              <a href="${inviteUrl}" style="display: inline-block; background-color: #5553ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                Accept Invitation
              </a>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              This invitation will expire in ${expiresIn} days.<br>
              If you didn't expect this invitation, you can safely ignore this email.
            </p>
          </div>
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">
            This is an automated email from Luno Finance Manager.
          </p>
        </div>
      </body>
    </html>
  `

  return { subject, html }
}

