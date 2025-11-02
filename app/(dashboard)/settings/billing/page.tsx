'use client'

import { useEffect, useState } from 'react'
import { createClientBrowser } from '@/lib/supabase/browser-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Check, X, ExternalLink } from 'lucide-react'
import { CardSkeleton } from '@/components/skeletons/card-skeleton'

export default function BillingPage() {
  const [subscription, setSubscription] = useState<any>(null)
  const [limits, setLimits] = useState<any>(null)
  const [usage, setUsage] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSubscriptionData()
  }, [])

  async function loadSubscriptionData() {
    try {
      const [subscriptionResponse, usageResponse] = await Promise.all([
        fetch('/api/subscription'),
        fetch('/api/usage'),
      ])

      const subscriptionData = await subscriptionResponse.json()
      const usageData = await usageResponse.json()

      setSubscription(subscriptionData.subscription)
      setLimits(subscriptionData.limits)
      setUsage(usageData)
    } catch (error) {
      console.error('Error loading subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpgrade(planType: 'pro' | 'family') {
    try {
      const supabase = createClientBrowser()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Redirect to checkout
      window.location.href = `/api/checkout?plan=${planType}&email=${encodeURIComponent(user.email || '')}`
    } catch (error) {
      console.error('Error initiating checkout:', error)
    }
  }

  async function handleManageSubscription() {
    try {
      const supabase = createClientBrowser()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Get customer portal URL
      const response = await fetch(`/api/billing/portal?userId=${user.id}`)
      const { url } = await response.json()

      if (url) {
        window.open(url, '_blank')
      }
    } catch (error) {
      console.error('Error opening customer portal:', error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6 max-w-4xl">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  const planType = subscription?.plan_type || 'free'
  const isPro = planType === 'pro'
  const isFamily = planType === 'family'
  const isFree = planType === 'free'

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription and billing information
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                {isFree && 'Free tier - upgrade to unlock more features'}
                {isPro && 'Pro plan - enjoy unlimited transactions and more'}
                {isFamily && 'Family plan - share with up to 5 family members'}
              </CardDescription>
            </div>
            <Badge variant={isFree ? 'secondary' : 'default'} className="text-lg px-4 py-2">
              {planType.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isFree && (
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-semibold">
                  {subscription?.status === 'active' ? (
                    <span className="text-green-600 flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Active
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-2">
                      <X className="h-4 w-4" />
                      {subscription?.status || 'Inactive'}
                    </span>
                  )}
                </p>
              </div>
              {subscription?.current_period_end && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Renews on</p>
                  <p className="font-semibold">
                    {new Date(subscription.current_period_end).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          )}

          {!isFree && (
            <Button onClick={handleManageSubscription} variant="outline" className="w-full">
              <ExternalLink className="mr-2 h-4 w-4" />
              Manage Subscription
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Feature Limits */}
      {limits && (
        <Card>
          <CardHeader>
            <CardTitle>Feature Usage</CardTitle>
            <CardDescription>
              Your current usage and limits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FeatureLimitRow
              feature="Transactions"
              current={limits.transactions_limit === -1 ? '∞' : (usage?.transactions ?? 0).toString()}
              limit={limits.transactions_limit === -1 ? 'Unlimited' : limits.transactions_limit.toString()}
              isUnlimited={limits.transactions_limit === -1}
            />
            <FeatureLimitRow
              feature="Categories"
              current={limits.categories_limit === -1 ? '∞' : (usage?.categories ?? 0).toString()}
              limit={limits.categories_limit === -1 ? 'Unlimited' : limits.categories_limit.toString()}
              isUnlimited={limits.categories_limit === -1}
            />
            <FeatureLimitRow
              feature="Bank Connections"
              current={limits.bank_connections_limit === -1 ? '∞' : (usage?.bankConnections ?? 0).toString()}
              limit={limits.bank_connections_limit === -1 ? 'Unlimited' : limits.bank_connections_limit.toString()}
              isUnlimited={limits.bank_connections_limit === -1}
            />
            <FeatureLimitRow
              feature="Receipt Scans"
              current={limits.receipt_scans_limit === -1 ? '∞' : (usage?.receiptScans ?? 0).toString()}
              limit={limits.receipt_scans_limit === -1 ? 'Unlimited' : limits.receipt_scans_limit.toString()}
              isUnlimited={limits.receipt_scans_limit === -1}
            />
            {isFamily && (
              <FeatureLimitRow
                feature="Family Members"
                current={limits.family_members_limit === -1 ? '∞' : (usage?.familyMembers ?? 0).toString()}
                limit={limits.family_members_limit === -1 ? 'Unlimited' : limits.family_members_limit.toString()}
                isUnlimited={limits.family_members_limit === -1}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Upgrade Options */}
      {isFree && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Pro Plan</CardTitle>
              <CardDescription>₹749/month or $9.99/month</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Unlimited transactions
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Unlimited categories
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Multiple bank connections
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Receipt scanning (10/month)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Advanced analytics
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Budget alerts
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Export to CSV/PDF
                </li>
              </ul>
              <Button
                onClick={() => handleUpgrade('pro')}
                className="w-full"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Upgrade to Pro
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Family Plan</CardTitle>
              <CardDescription>₹1499/month or $19.99/month</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Everything in Pro
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Up to 5 family members
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Shared budgets
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Bill splitting
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Shared accounts
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Collaborative goals
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Household analytics
                </li>
              </ul>
              <Button
                onClick={() => handleUpgrade('family')}
                className="w-full"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Upgrade to Family
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {isPro && (
        <Card>
          <CardHeader>
            <CardTitle>Upgrade to Family</CardTitle>
            <CardDescription>Get family sharing features</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => handleUpgrade('family')}
              className="w-full"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Upgrade to Family Plan
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function FeatureLimitRow({
  feature,
  current,
  limit,
  isUnlimited,
}: {
  feature: string
  current: string
  limit: string
  isUnlimited: boolean
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm font-medium">{feature}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {isUnlimited ? (
            <span className="text-green-600 font-semibold">Unlimited</span>
          ) : (
            <span>
              {current} / {limit}
            </span>
          )}
        </span>
      </div>
    </div>
  )
}

