import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, TrendingUp } from 'lucide-react'
import { formatCurrencyForUser } from '@/lib/utils/currency-server'
import { createClient } from '@/lib/supabase/server'
import type { DashboardSummary } from '@/lib/data/dashboard-data'

/**
 * Summary cards component (Server Component)
 */
export async function DashboardSummaryCards({ summary }: { summary: DashboardSummary }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const currency = await formatCurrencyForUser(summary.accountBalance, user.id)
  const incomeFormatted = await formatCurrencyForUser(summary.totalIncome, user.id)
  const expensesFormatted = await formatCurrencyForUser(summary.totalExpenses, user.id)
  
  const netAmount = summary.totalIncome - summary.totalExpenses
  const netFormatted = await formatCurrencyForUser(netAmount, user.id)

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Balance</CardDescription>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {currency}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>This Month Income</CardDescription>
          <CardTitle className="text-2xl text-green-600 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {incomeFormatted}
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>This Month Expenses</CardDescription>
          <CardTitle className="text-2xl text-red-600 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {expensesFormatted}
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
            {netFormatted}
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  )
}

