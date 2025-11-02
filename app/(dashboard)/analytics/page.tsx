'use client'

import { useEffect, useState } from 'react'
import { createClientBrowser } from '@/lib/supabase/browser-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { BarChart3, TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { logger } from '@/lib/utils/logger'
import { formatCurrencyClient, getLocaleFromCurrency } from '@/lib/utils/currency'
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
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '30d' | '90d' | 'month' | 'year'>('30d')
  const [userCurrency, setUserCurrency] = useState<string>('USD')
  const [userLocale, setUserLocale] = useState<string>('en-US')

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

      // Load user currency preference
      const { data: profileData } = await supabase
        .from('users_profile')
        .select('currency_preference')
        .eq('id', user.id)
        .single()

      const currency = profileData?.currency_preference || 'USD'
      const locale = getLocaleFromCurrency(currency)

      setTransactions(transactionsData || [])
      setCategories(categoriesData || [])
      setUserCurrency(currency)
      setUserLocale(locale)
    } catch (error) {
      logger.error('Error loading analytics data:', error)
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

  // Income vs Expenses trend (last 30 days)
  const incomeVsExpensesTrend = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i)
    const dateStr = format(date, 'yyyy-MM-dd')

    const dayIncome = transactions
      .filter((t) => t.type === 'income' && t.transaction_date === dateStr)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0)

    const dayExpenses = transactions
      .filter((t) => t.type === 'expense' && t.transaction_date === dateStr)
      .reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0)

    return {
      date: dateStr,
      dateFormatted: format(date, 'MMM dd'),
      income: dayIncome,
      expenses: dayExpenses,
      net: dayIncome - dayExpenses,
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
              {formatCurrencyClient(totalIncome, userCurrency, userLocale)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Expenses</CardDescription>
            <CardTitle className="text-2xl text-red-600 flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              {formatCurrencyClient(totalExpenses, userCurrency, userLocale)}
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
              {formatCurrencyClient(netAmount, userCurrency, userLocale)}
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

      {/* Income vs Expenses Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Income vs Expenses
          </CardTitle>
          <CardDescription>
            Daily comparison over the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {incomeVsExpensesTrend.every(d => d.income === 0 && d.expenses === 0) ? (
            <p className="text-muted-foreground text-center py-8">
              No transaction data available for this period
            </p>
          ) : (
            <ChartContainer
              config={{
                income: {
                  label: "Income",
                  color: "hsl(142, 76%, 36%)",
                },
                expenses: {
                  label: "Expenses",
                  color: "hsl(0, 84%, 60%)",
                },
              }}
              className="h-[350px]"
            >
              <LineChart data={incomeVsExpensesTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="dateFormatted"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) =>
                    new Intl.NumberFormat(userLocale, {
                      notation: 'compact',
                      compactDisplay: 'short',
                      style: 'currency',
                      currency: userCurrency,
                    }).format(value)
                  }
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold mb-2">{data.dateFormatted}</p>
                          <div className="space-y-1">
                            <p className="text-sm flex items-center justify-between gap-4">
                              <span className="text-green-600 font-medium">Income:</span>
                              <span>
                                {formatCurrencyClient(data.income, userCurrency, userLocale)}
                              </span>
                            </p>
                            <p className="text-sm flex items-center justify-between gap-4">
                              <span className="text-red-600 font-medium">Expenses:</span>
                              <span>
                                {formatCurrencyClient(data.expenses, userCurrency, userLocale)}
                              </span>
                            </p>
                            <div className="pt-1 border-t">
                              <p className={`text-sm flex items-center justify-between gap-4 font-semibold ${
                                data.net >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                <span>Net:</span>
                                <span>
                                  {formatCurrencyClient(data.net, userCurrency, userLocale)}
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="hsl(142, 76%, 36%)"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(142, 76%, 36%)', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="hsl(0, 84%, 60%)"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(0, 84%, 60%)', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Spending by Category */}
      <div className="grid gap-4 md:grid-cols-2">
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
              <ChartContainer
                config={{
                  amount: {
                    label: "Amount",
                    color: "hsl(var(--primary))",
                  },
                }}
                className="h-[300px]"
              >
                <RechartsPieChart>
                  <Pie
                    data={spendingByCategory.slice(0, 8)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name.substring(0, 15)} (${percentage.toFixed(1)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                    nameKey="category.name"
                  >
                    {spendingByCategory.slice(0, 8).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`hsl(${(index * 360) / 8}, 70%, 50%)`}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-semibold">{data.category.icon} {data.category.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrencyClient(data.amount, userCurrency, userLocale)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {data.percentage.toFixed(1)}% of total
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                </RechartsPieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown Table */}
        <Card>
          <CardHeader>
            <CardTitle>Category Details</CardTitle>
            <CardDescription>
              Detailed spending breakdown
            </CardDescription>
          </CardHeader>
          <CardContent>
            {spendingByCategory.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No spending data available
              </p>
            ) : (
              <div className="space-y-4">
                {spendingByCategory.slice(0, 8).map((item, index) => (
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
                        {formatCurrencyClient(item.amount, userCurrency, userLocale)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: `hsl(${(index * 360) / 8}, 70%, 50%)`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily Spending Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Daily Spending Trend
          </CardTitle>
          <CardDescription>
            Expenses over the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dailySpending.every(d => d.amount === 0) ? (
            <p className="text-muted-foreground text-center py-8">
              No spending data available for this period
            </p>
          ) : (
            <ChartContainer
              config={{
                amount: {
                  label: "Amount",
                  color: "hsl(var(--primary))",
                },
              }}
              className="h-[300px]"
            >
              <BarChart data={dailySpending}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="dateFormatted"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) =>
                    new Intl.NumberFormat(userLocale, {
                      notation: 'compact',
                      compactDisplay: 'short',
                      style: 'currency',
                      currency: userCurrency,
                    }).format(value)
                  }
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                          <p className="font-semibold">{data.dateFormatted}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrencyClient(data.amount, userCurrency, userLocale)}
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar
                  dataKey="amount"
                  fill="hsl(var(--primary))"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
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
                  {formatCurrencyClient(
                    Math.abs(Number(transaction.amount || 0)),
                    transaction.currency || userCurrency,
                    transaction.currency ? getLocaleFromCurrency(transaction.currency) : userLocale
                  )}
                </span>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  )
}

