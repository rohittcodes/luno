import { Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { getDashboardSummary } from '@/lib/data/dashboard-data'
import { DashboardSummaryCards } from '@/components/dashboard-summary-cards'
import { DashboardRecentTransactions } from '@/components/dashboard-recent-transactions'
import { DashboardQuickActions } from '@/components/dashboard-quick-actions'
import { DashboardActiveBudgets } from '@/components/dashboard-active-budgets'
import { DashboardSkeleton } from '@/components/skeletons/dashboard-skeleton'

/**
 * Dashboard Page at /dashboard
 * Server Component - Auth handled by layout
 */
export default async function DashboardPage() {
  // Fetch data on the server
  const summary = await getDashboardSummary()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your financial activity
          </p>
        </div>
      </div>

      {/* Summary Cards - Server Component */}
      <DashboardSummaryCards summary={summary} />

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Transactions - Server Component with Suspense */}
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardRecentTransactions transactions={summary.recentTransactions} />
        </Suspense>

        {/* Quick Actions - Client Component */}
        <DashboardQuickActions unreadNotifications={summary.unreadNotifications} />
      </div>

      {/* Active Budgets - Server Component */}
      {summary.budgets.length > 0 && (
        <DashboardActiveBudgets budgets={summary.budgets} />
      )}
    </div>
  )
}

