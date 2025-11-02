'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Target, Bell } from 'lucide-react'

/**
 * Quick actions component (Client Component)
 * Needs to be client component for interactive elements
 */
export function DashboardQuickActions({
  unreadNotifications,
}: {
  unreadNotifications: number
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Link href="/transactions">
          <Button variant="outline" className="w-full justify-start">
            Add Transaction <ArrowRight className="ml-auto h-4 w-4" />
          </Button>
        </Link>
        <Link href="/accounts">
          <Button variant="outline" className="w-full justify-start">
            Manage Accounts <ArrowRight className="ml-auto h-4 w-4" />
          </Button>
        </Link>
        <Link href="/budgets">
          <Button variant="outline" className="w-full justify-start">
            <Target className="mr-2 h-4 w-4" />
            Create Budget <ArrowRight className="ml-auto h-4 w-4" />
          </Button>
        </Link>
        <Link href="/subscriptions">
          <Button variant="outline" className="w-full justify-start">
            Track Bills <ArrowRight className="ml-auto h-4 w-4" />
          </Button>
        </Link>
        <Link href="/analytics">
          <Button variant="outline" className="w-full justify-start">
            View Analytics <ArrowRight className="ml-auto h-4 w-4" />
          </Button>
        </Link>
        <Link href="/notifications">
          <Button variant="outline" className="w-full justify-start">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
            {unreadNotifications > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadNotifications}
              </span>
            )}
            {unreadNotifications === 0 && (
              <ArrowRight className="ml-auto h-4 w-4" />
            )}
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

