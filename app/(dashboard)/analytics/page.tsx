'use client'

import { useEffect, useState } from 'react'
import { createClientBrowser } from '@/lib/supabase/browser-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { BarChart3, TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react'
import type { Database } from '@/types/database'

type Transaction = Database['public']['Tables']['transactions']['Row'] & {
  currency?: string | null
  categories?: Category | null
}
type Category = Database['public']['Tables']['categories']['Row']

export default function AnalyticsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'month' | 'year'>('30d')

  useEffect(() => {
    loadData()
  }, [timeRange])

  async function loadData() {
    try {
      const supabase = createClientBrowser()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Calculate date range
      let startDate: Date
      const endDate = new Date()

      switch (timeRange) {
        case '7d':
          startDate = subDays(endDate, 7)
          break
        case '30d':
          startDate = subDays(endDate, 30)
          break
        case '90d':
          startDate = subDays(endDate, 90)
          break
        case 'month':
          startDate = startOfMonth(endDate)
          break
        case 'year':
          startDate = subMonths(endDate, 12)
          break
        default:
          startDate = subDays(endDate, 30)
      }

      // Load transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*, categories(*)')
        .eq('user_id', user.id)
        .gte('transaction_date', startDate.toISOString().split('T')[0])
        .lte('transaction_date', endDate.toISOString().split('T')[0])
        .order('transaction_date', { ascending: false })

      if (transactionsError) throw transactionsError

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)

      if (categoriesError) throw categoriesError

      setTransactions(transactionsData || [])
      setCategories(categoriesData || [])
    } catch (error) {
      console.error('Error loading analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate totals
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0)

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0)

  const netAmount = totalIncome - totalExpenses

  // Spending by category
  const spendingByCategory = categories.map((category) => {
    const categoryExpenses = transactions
      .filter(
        (t) =>
          t.type === 'expense' &&
          t.category_id === category.id
      )
      .reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0)

    return {
      category,
      amount: categoryExpenses,
      percentage: totalExpenses > 0 ? (categoryExpenses / totalExpenses) * 100 : 0,
    }
  })
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount)

  // Daily spending trend (last 30 days)
  const dailySpending = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i)
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayExpenses = transactions
      .filter(
        (t) =>
          t.type === 'expense' &&
          t.transaction_date === dateStr
      )
      .reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0)

    return {
      date: dateStr,
      dateFormatted: format(date, 'MMM dd'),
      amount: dayExpenses,
    }
  })

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Insights into your spending and income
          </p>
        </div>
        <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="month">This month</SelectItem>
            <SelectItem value="year">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Income</CardDescription>
            <CardTitle className="text-2xl text-green-600 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
              }).format(totalIncome)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Expenses</CardDescription>
            <CardTitle className="text-2xl text-red-600 flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              {new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
              }).format(totalExpenses)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Net Amount</CardDescription>
            <CardTitle
              className={`text-2xl flex items-center gap-2 ${
                netAmount >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              <DollarSign className="h-5 w-5" />
              {new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
              }).format(netAmount)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Transactions</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {transactions.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Spending by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Spending by Category
          </CardTitle>
          <CardDescription>
            Breakdown of expenses by category
          </CardDescription>
        </CardHeader>
        <CardContent>
          {spendingByCategory.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No spending data available for this period
            </p>
          ) : (
            <div className="space-y-4">
              {spendingByCategory.slice(0, 10).map((item, index) => (
                <div key={item.category.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {item.category.icon} {item.category.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <span className="text-sm font-semibold">
                      {new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                      }).format(item.amount)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Spending Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Spending Trend</CardTitle>
          <CardDescription>
            Expenses over the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dailySpending.map((day) => (
              <div key={day.date} className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground w-20">
                  {day.dateFormatted}
                </span>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                    {day.amount > 0 && (
                      <div
                        className="bg-blue-600 h-4 rounded-full"
                        style={{
                          width: `${Math.min((day.amount / Math.max(...dailySpending.map(d => d.amount), 1)) * 100, 100)}%`,
                        }}
                      />
                    )}
                  </div>
                  <span className="text-sm font-medium w-20 text-right">
                    {day.amount > 0
                      ? new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                          maximumFractionDigits: 0,
                        }).format(day.amount)
                      : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Top Expenses</CardTitle>
          <CardDescription>
            Largest expense transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions
            .filter((t) => t.type === 'expense')
            .sort((a, b) => Math.abs(Number(b.amount || 0)) - Math.abs(Number(a.amount || 0)))
            .slice(0, 10)
            .map((transaction) => (
              <div
                key={transaction.id}
                className="flex justify-between items-center py-2 border-b last:border-0"
              >
                <div>
                  <p className="font-medium">{transaction.description || 'Untitled'}</p>
                  <p className="text-sm text-muted-foreground">
                    {transaction.categories?.name || 'Uncategorized'} •{' '}
                    {format(new Date(transaction.transaction_date), 'MMM dd, yyyy')}
                  </p>
                </div>
                <span className="text-red-600 font-semibold">
                  {new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: transaction.currency || 'INR',
                  }).format(Math.abs(Number(transaction.amount || 0)))}
                </span>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  )
}

