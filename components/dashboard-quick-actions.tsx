'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Plus, 
  Wallet, 
  Target, 
  Calendar,
  BarChart3,
  Bell,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface QuickAction {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  badge?: string | number
}

/**
 * Quick actions component (Client Component)
 * Clean, consistent design with grouped actions and proper visual hierarchy
 */
export function DashboardQuickActions({
  unreadNotifications,
}: {
  unreadNotifications: number
}) {
  const primaryActions: QuickAction[] = [
    {
      href: '/transactions',
      label: 'Add Transaction',
      icon: Plus,
      description: 'Record income or expense',
    },
    {
      href: '/budgets',
      label: 'Create Budget',
      icon: Target,
      description: 'Set spending limits',
    },
    {
      href: '/accounts',
      label: 'Manage Accounts',
      icon: Wallet,
      description: 'View or edit accounts',
    },
  ]

  const secondaryActions: QuickAction[] = [
    {
      href: '/analytics',
      label: 'View Analytics',
      icon: BarChart3,
      description: 'Financial insights',
    },
    {
      href: '/subscriptions',
      label: 'Track Bills',
      icon: Calendar,
      description: 'Manage subscriptions',
    },
    {
      href: '/notifications',
      label: 'Notifications',
      icon: Bell,
      description: 'View updates',
      badge: unreadNotifications > 0 ? unreadNotifications : undefined,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Actions */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Primary
          </h3>
          <div className="grid gap-2">
            {primaryActions.map((action) => (
              <QuickActionButton key={action.href} action={action} />
            ))}
          </div>
        </div>

        {/* Secondary Actions */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Explore
          </h3>
          <div className="grid gap-2">
            {secondaryActions.map((action) => (
              <QuickActionButton key={action.href} action={action} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function QuickActionButton({ action }: { action: QuickAction }) {
  const Icon = action.icon

  return (
    <Link href={action.href} className="group">
      <Button
        variant="outline"
        className={cn(
          "w-full justify-start h-auto py-3 px-4",
          "hover:bg-accent hover:border-accent-foreground/20",
          "transition-colors duration-200"
        )}
      >
        <div className="flex items-center gap-3 w-full">
          <div className={cn(
            "flex items-center justify-center h-9 w-9 rounded-lg",
            "bg-primary/10 text-primary",
            "group-hover:bg-primary/20 transition-colors"
          )}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className="font-medium text-sm">{action.label}</div>
            <div className="text-xs text-muted-foreground truncate">
              {action.description}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {action.badge !== undefined && (
              <Badge 
                variant="destructive" 
                className="h-5 px-1.5 text-xs font-semibold"
              >
                {action.badge}
              </Badge>
            )}
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </Button>
    </Link>
  )
}

