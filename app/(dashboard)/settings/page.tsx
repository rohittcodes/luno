'use client'

import { useEffect, useState } from 'react'
import { createClientBrowser } from '@/lib/supabase/browser-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, CreditCard, Bell, Globe } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)', symbol: '$' },
  { value: 'EUR', label: 'EUR (€)', symbol: '€' },
  { value: 'GBP', label: 'GBP (£)', symbol: '£' },
  { value: 'INR', label: 'INR (₹)', symbol: '₹' },
  { value: 'JPY', label: 'JPY (¥)', symbol: '¥' },
  { value: 'CNY', label: 'CNY (¥)', symbol: '¥' },
  { value: 'CAD', label: 'CAD ($)', symbol: '$' },
  { value: 'AUD', label: 'AUD ($)', symbol: '$' },
  { value: 'NZD', label: 'NZD ($)', symbol: '$' },
  { value: 'SGD', label: 'SGD ($)', symbol: '$' },
  { value: 'HKD', label: 'HKD ($)', symbol: '$' },
  { value: 'CHF', label: 'CHF (CHF)', symbol: 'CHF' },
  { value: 'SEK', label: 'SEK (kr)', symbol: 'kr' },
  { value: 'NOK', label: 'NOK (kr)', symbol: 'kr' },
  { value: 'DKK', label: 'DKK (kr)', symbol: 'kr' },
  { value: 'PLN', label: 'PLN (zł)', symbol: 'zł' },
  { value: 'MXN', label: 'MXN ($)', symbol: '$' },
  { value: 'BRL', label: 'BRL (R$)', symbol: 'R$' },
  { value: 'ZAR', label: 'ZAR (R)', symbol: 'R' },
]

const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'America/New_York (Eastern Time)' },
  { value: 'America/Chicago', label: 'America/Chicago (Central Time)' },
  { value: 'America/Denver', label: 'America/Denver (Mountain Time)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (Pacific Time)' },
  { value: 'Europe/London', label: 'Europe/London (GMT)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai (CST)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEDT)' },
  { value: 'Australia/Melbourne', label: 'Australia/Melbourne (AEDT)' },
]

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    currency_preference: 'USD',
    timezone: 'UTC',
  })

  const router = useRouter()

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      const supabase = createClientBrowser()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Load profile from users_profile
      const { data: profileData, error: profileError } = await supabase
        .from('users_profile')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is okay for new users
        throw profileError
      }

      setProfile({
        full_name: profileData?.full_name || user.user_metadata?.full_name || '',
        email: user.email || profileData?.email || '',
        currency_preference: profileData?.currency_preference || 'USD',
        timezone: profileData?.timezone || 'UTC',
      })
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('Failed to load profile settings')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const supabase = createClientBrowser()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('You must be logged in to save settings')
        return
      }

      // Update or insert profile
      // First try to update, then insert if no rows affected
      const { data: existingProfile, error: selectError } = await supabase
        .from('users_profile')
        .select('id')
        .eq('id', user.id)
        .single()

      if (selectError && selectError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is okay
        throw selectError
      }

      const profileData = {
        id: user.id,
        full_name: profile.full_name || null,
        email: profile.email || user.email || null,
        currency_preference: profile.currency_preference || 'USD',
        timezone: profile.timezone || 'UTC',
      }

      let error
      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('users_profile')
          .update(profileData)
          .eq('id', user.id)
        error = updateError
      } else {
        // Insert new profile
        const { error: insertError } = await supabase
          .from('users_profile')
          .insert(profileData)
        error = insertError
      }

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      // If currency changed, refresh the page to update all currency displays
      router.refresh()
      toast.success('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving profile:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('Error details:', {
        message: errorMessage,
        error: error,
        stack: error instanceof Error ? error.stack : undefined,
      })
      toast.error(`Failed to save settings: ${errorMessage}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Update your personal information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={profile.full_name}
                  onChange={(e) =>
                    setProfile({ ...profile, full_name: e.target.value })
                  }
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed here. Contact support if you need to change your email.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency Preference</Label>
                <Select
                  value={profile.currency_preference}
                  onValueChange={(value) =>
                    setProfile({ ...profile, currency_preference: value })
                  }
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This currency will be used as the default for all your transactions and accounts.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={profile.timezone}
                  onValueChange={(value) =>
                    setProfile({ ...profile, timezone: value })
                  }
                >
                  <SelectTrigger id="timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Used for date and time displays throughout the application.
                </p>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing & Subscription</CardTitle>
              <CardDescription>
                Manage your subscription and billing information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-medium">Subscription Management</p>
                  <p className="text-sm text-muted-foreground">
                    View and manage your subscription plan, payment methods, and billing history
                  </p>
                </div>
                <Link href="/settings/billing">
                  <Button variant="outline">
                    Go to Billing
                    <CreditCard className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

