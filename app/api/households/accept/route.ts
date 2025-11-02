import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Accept household invitation
 * POST /api/households/accept
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
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Find invitation by token
    const { data: invitation, error: inviteError } = await supabase
      .from('household_invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single()

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 404 }
      )
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      // Update invitation status to expired
      await supabase
        .from('household_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id)

      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      )
    }

    // Verify email matches
    const { data: userProfile } = await supabase
      .from('users_profile')
      .select('email')
      .eq('id', user.id)
      .single()

    const userEmail = userProfile?.email || user.email

    if (invitation.email.toLowerCase() !== userEmail?.toLowerCase()) {
      return NextResponse.json(
        { error: 'This invitation was sent to a different email address' },
        { status: 403 }
      )
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('household_members')
      .select('id')
      .eq('household_id', invitation.household_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingMember) {
      // Update invitation status to accepted anyway
      await supabase
        .from('household_invitations')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', invitation.id)

      return NextResponse.json({
        success: true,
        message: 'You are already a member of this household',
      })
    }

    // Add user as household member
    const { error: memberError } = await supabase
      .from('household_members')
      .insert({
        household_id: invitation.household_id,
        user_id: user.id,
        role: invitation.role,
      })

    if (memberError) {
      console.error('Error adding household member:', memberError)
      return NextResponse.json(
        { error: 'Failed to join household' },
        { status: 500 }
      )
    }

    // Update invitation status
    await supabase
      .from('household_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invitation.id)

    return NextResponse.json({
      success: true,
      message: 'Successfully joined household',
      householdId: invitation.household_id,
    })
  } catch (error) {
    console.error('Error accepting household invitation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

