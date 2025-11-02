import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmailNotification } from '@/lib/notifications/email'
import { generateHouseholdInvitationEmail } from '@/lib/notifications/email'
import crypto from 'crypto'

/**
 * Send household invitation email
 * POST /api/households/invite
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { householdId, email, role = 'member' } = body

    if (!householdId || !email) {
      return NextResponse.json(
        { error: 'householdId and email are required' },
        { status: 400 }
      )
    }

    // Check if user is the creator or has owner/admin role
    const { data: householdData } = await supabase
      .from('households')
      .select('created_by')
      .eq('id', householdId)
      .single()

    if (!householdData) {
      return NextResponse.json(
        { error: 'Household not found' },
        { status: 404 }
      )
    }

    const isCreator = householdData.created_by === user.id

    // Check if user is a member with owner/admin role
    const { data: memberData } = await supabase
      .from('household_members')
      .select('role')
      .eq('household_id', householdId)
      .eq('user_id', user.id)
      .maybeSingle()

    const canInvite = isCreator || (memberData && ['owner', 'admin'].includes(memberData.role))

    if (!canInvite) {
      return NextResponse.json(
        { error: 'You do not have permission to invite members to this household' },
        { status: 403 }
      )
    }

    // Check if email is already invited (pending invitation)
    const { data: existingInvitation } = await supabase
      .from('household_invitations')
      .select('id')
      .eq('household_id', householdId)
      .eq('email', email)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'An invitation has already been sent to this email' },
        { status: 400 }
      )
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex')

    // Get inviter name
    const { data: inviterProfile } = await supabase
      .from('users_profile')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    const inviterName = inviterProfile?.full_name || inviterProfile?.email || user.email || 'Someone'

    // Get household name
    const { data: householdData } = await supabase
      .from('households')
      .select('name')
      .eq('id', householdId)
      .single()

    const householdName = householdData?.name || 'a household'

    // Create invitation record
    const { data: invitation, error: inviteError } = await supabase
      .from('household_invitations')
      .insert({
        household_id: householdId,
        invited_by: user.id,
        email,
        token,
        role,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })
      .select()
      .single()

    if (inviteError) {
      console.error('Error creating invitation:', inviteError)
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      )
    }

    // Generate invitation URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inviteUrl = `${appUrl}/households/accept?token=${token}`

    // Generate email template
    const { subject, html } = generateHouseholdInvitationEmail(
      inviterName,
      householdName,
      inviteUrl,
      7
    )

    // Send email
    const emailResult = await sendEmailNotification({
      to: email,
      subject,
      html,
    })

    if (!emailResult.success) {
      console.error('Error sending invitation email:', emailResult.error)
      // Don't fail the request if email fails - invitation is still created
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        status: invitation.status,
      },
      emailSent: emailResult.success,
    })
  } catch (error) {
    console.error('Error sending household invitation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

