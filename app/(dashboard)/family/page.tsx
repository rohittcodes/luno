'use client'

import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { createClientBrowser } from '@/lib/supabase/browser-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Users, UserPlus, Crown, Mail, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { PageSkeleton } from '@/components/skeletons/page-skeleton'
import { useSubscription } from '@/lib/hooks/queries/use-subscription'
import type { Database } from '@/types/database'

type Household = Database['public']['Tables']['households']['Row']
type HouseholdMember = Database['public']['Tables']['household_members']['Row'] & {
  users_profile?: {
    email: string
    full_name: string | null
  } | null
}

export default function FamilyPage() {
  const [household, setHousehold] = useState<Household | null>(null)
  const [members, setMembers] = useState<HouseholdMember[]>([])
  const [loading, setLoading] = useState(true)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')

  const { data: subscriptionData } = useSubscription()

  useEffect(() => {
    loadHouseholdData()
  }, [])

  async function loadHouseholdData() {
    try {
      const supabase = createClientBrowser()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Get user's household
      const { data: householdData } = await supabase
        .from('households')
        .select('*')
        .or(`created_by.eq.${user.id},id.in.(select household_id from household_members where user_id.eq.${user.id})`)
        .maybeSingle()

      if (householdData) {
        const household = householdData as Household
        setHousehold(household)

        // Get household members with user profiles
        // Join through user_id -> users_profile.id
        const { data: membersData } = await supabase
          .from('household_members')
          .select(`
            *,
            users_profile:users_profile!user_id(email, full_name)
          `)
          .eq('household_id', household.id)

        if (membersData) {
          // Transform the data to match our type
          const transformed = (membersData || []).map((member: any) => ({
            ...member,
            users_profile: member.users_profile || null,
          }))
          setMembers(transformed as unknown as HouseholdMember[])
        }
      }
    } catch (error: any) {
      console.error('Error loading household:', error)
      toast.error('Failed to load household data')
    } finally {
      setLoading(false)
    }
  }

  const createHouseholdMutation = useMutation({
    mutationFn: async () => {
      const supabase = createClientBrowser()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('User not authenticated')
      }

      // Check if user has family sharing feature (Family plan required)
      if (subscriptionData?.subscription?.plan_type !== 'family') {
        throw new Error('Family sharing is only available on the Family plan. Please upgrade to create a household.')
      }

      // TypeScript doesn't know about households table in Database type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const householdsTable = supabase.from('households') as any
      const { data, error } = await householdsTable
        .insert({
          created_by: user.id,
          name: `${user.email?.split('@')[0]}'s Household`,
        })
        .select()
        .single()

      if (error) {
        console.error('Supabase error creating household:', error)
        throw error
      }

      // Add owner as member
      // TypeScript doesn't know about household_members table in Database type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const membersTable = supabase.from('household_members') as any
      const household = data as Household
      const { error: memberError } = await membersTable.insert({
        household_id: household.id,
        user_id: user.id,
        role: 'owner',
      })

      if (memberError) {
        console.error('Supabase error adding member:', memberError)
        throw memberError
      }

      return household
    },
    onSuccess: () => {
      toast.success('Household created successfully')
      loadHouseholdData()
    },
    onError: (error: any) => {
      console.error('Error creating household:', error)
      
      // Extract error message from various possible formats
      let errorMessage = 'Failed to create household'
      if (error?.message) {
        errorMessage = error.message
      } else if (error?.error_description) {
        errorMessage = error.error_description
      } else if (error?.hint) {
        errorMessage = error.hint
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error) {
        errorMessage = JSON.stringify(error)
      }
      
      toast.error(errorMessage)
    },
  })

  function createHousehold() {
    createHouseholdMutation.mutate()
  }

  const sendInviteMutation = useMutation({
    mutationFn: async (email: string) => {
      if (!household) throw new Error('No household selected')

      const response = await fetch('/api/households/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          householdId: household.id,
          email,
          role: 'member',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to send invitation')
      }

      return response.json()
    },
    onSuccess: (data, email) => {
      setIsInviteDialogOpen(false)
      setInviteEmail('')
      if (data.emailSent) {
        toast.success(`Invitation sent to ${email}`)
      } else {
        toast.success(`Invitation created for ${email}, but email could not be sent`)
      }
    },
    onError: (error: Error) => {
      console.error('Error sending invite:', error)
      toast.error(error.message || 'Failed to send invitation')
    },
  })

  async function sendInvite() {
    if (!inviteEmail || !household) return
    sendInviteMutation.mutate(inviteEmail)
  }

  async function removeMember(memberId: string) {
    if (!confirm('Are you sure you want to remove this member?')) return

    try {
      const supabase = createClientBrowser()
      const { error } = await supabase
        .from('household_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error
      toast.success('Member removed successfully')
      loadHouseholdData()
    } catch (error: any) {
      console.error('Error removing member:', error)
      toast.error(error.message || 'Failed to remove member')
    }
  }

  if (loading) {
    return <PageSkeleton />
  }

  const currentUser = members.find((m) => m.role === 'owner')
  const isOwner = currentUser?.role === 'owner'

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Family & Sharing
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your household and share finances with family members
          </p>
        </div>
        {!household && (
          <Button onClick={createHousehold}>
            <UserPlus className="mr-2 h-4 w-4" />
            Create Household
          </Button>
        )}
      </div>

      {!household ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Household Created</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Create a household to share finances with family members. You'll be able to
              share accounts, split expenses, and collaborate on budgets.
            </p>
            <Button onClick={createHousehold}>
              <UserPlus className="mr-2 h-4 w-4" />
              Create Your Household
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Household Info */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{household.name}</CardTitle>
                <Badge variant="outline">Active Household</Badge>
              </div>
              <CardDescription>
                Household ID: {household.id}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Total Members</p>
                  <p className="text-2xl font-bold">{members.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-sm">
                    {household.created_at ? new Date(household.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <Badge className="mt-1">
                    {isOwner ? (
                      <>
                        <Crown className="mr-1 h-3 w-3" />
                        Owner
                      </>
                    ) : (
                      'Member'
                    )}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Members */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Household Members</CardTitle>
                {isOwner && (
                  <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Invite Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite Family Member</DialogTitle>
                        <DialogDescription>
                          Send an invitation to join your household. They'll receive an email
                          with instructions to accept the invitation.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="family.member@example.com"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={sendInvite}>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Invitation
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No members yet</p>
                  {isOwner && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setIsInviteDialogOpen(true)}
                    >
                      Invite Your First Member
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex justify-between items-center p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {member.users_profile?.full_name?.[0]?.toUpperCase() ||
                            member.users_profile?.email?.[0]?.toUpperCase() ||
                            'U'}
                        </div>
                        <div>
                          <p className="font-medium">
                            {member.users_profile?.full_name ||
                              member.users_profile?.email ||
                              'Unknown User'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {member.users_profile?.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={member.role === 'owner' ? 'default' : 'secondary'}>
                          {member.role === 'owner' && (
                            <Crown className="mr-1 h-3 w-3" />
                          )}
                          {member.role}
                        </Badge>
                        {isOwner && member.role !== 'owner' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMember(member.id)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shared Accounts Info */}
          <Card>
            <CardHeader>
              <CardTitle>Shared Accounts</CardTitle>
              <CardDescription>
                Accounts shared with household members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Shared accounts feature allows household members to view and manage
                shared financial accounts together.
              </p>
              <Button variant="outline" className="mt-4" disabled>
                <Calendar className="mr-2 h-4 w-4" />
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

