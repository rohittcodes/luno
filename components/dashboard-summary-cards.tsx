import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, TrendingUp } from 'lucide-react'
import type { DashboardSummary } from '@/lib/data/dashboard-data'

/**
 * Summary cards component (Server Component)
 */
export function DashboardSummaryCards({ summary }: { summary: DashboardSummary }) {
  const netAmount = summary.totalIncome - summary.totalExpenses

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Balance</CardDescription>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
            }).format(summary.accountBalance)}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>This Month Income</CardDescription>
          <CardTitle className="text-2xl text-green-600 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
            }).format(summary.totalIncome)}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>This Month Expenses</CardDescription>
          <CardTitle className="text-2xl text-red-600 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
            }).format(summary.totalExpenses)}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Net This Month</CardDescription>
          <CardTitle
            className={`text-2xl flex items-center gap-2 ${
              netAmount >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            <TrendingUp className={`h-5 w-5 ${netAmount < 0 ? 'rotate-180' : ''}`} />
            {new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR',
            }).format(netAmount)}
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  )
}

