---
skill: analytics-builder
dependencies:
  - supabase (via Rube MCP)
  - v0 (via Rube MCP)
description: Build financial analytics, charts, and insights for the finance app
tags: [analytics, charts, insights, data-visualization]
---

# Analytics Builder for Finance App

Create comprehensive financial analytics, visualizations, and insights dashboards.

## What this skill does

1. **Design analytics queries** - Create optimized SQL queries for financial metrics
2. **Build chart components** - Generate interactive visualizations
3. **Calculate insights** - Implement financial calculations and trends
4. **Create dashboards** - Build comprehensive analytics views
5. **Optimize performance** - Use materialized views and caching

## When to use this skill

- Building spending analysis features
- Creating income vs expense reports
- Visualizing budget performance
- Showing category breakdowns
- Generating financial insights
- Building dashboard widgets

## Core Analytics Types

### Spending Analysis
- Total spending by period
- Category breakdown
- Merchant analysis
- Payment method distribution
- Spending trends over time
- Day-of-week/hour patterns
- Comparison to previous periods

### Income Analysis
- Total income by period
- Income sources breakdown
- Income regularity
- Income vs expenses ratio
- Income trends
- Projected income

### Budget Analysis
- Budget vs actual spending
- Budget utilization percentage
- Categories over/under budget
- Budget trend prediction
- Alert triggers
- Historical budget performance

### Net Worth Tracking
- Total assets
- Total liabilities
- Net worth over time
- Asset allocation
- Debt-to-income ratio

### Cash Flow Analysis
- Daily/weekly/monthly cash flow
- Cash flow forecast
- Positive/negative cash flow days
- Runway calculation
- Emergency fund status

## Database Queries & Functions

### Spending by Category (Period)
```sql
CREATE OR REPLACE FUNCTION get_spending_by_category(
  user_uuid UUID,
  start_date DATE,
  end_date DATE
)
RETURNS TABLE(
  category_id UUID,
  category_name TEXT,
  category_icon TEXT,
  category_color TEXT,
  total_amount NUMERIC,
  transaction_count INTEGER,
  percentage NUMERIC
) AS $$
  WITH total_spending AS (
    SELECT COALESCE(SUM(amount), 0) as total
    FROM transactions
    WHERE user_id = user_uuid
      AND type = 'expense'
      AND transaction_date BETWEEN start_date AND end_date
  )
  SELECT
    c.id,
    c.name,
    c.icon,
    c.color,
    COALESCE(SUM(t.amount), 0) as total_amount,
    COUNT(t.id)::INTEGER as transaction_count,
    CASE
      WHEN (SELECT total FROM total_spending) > 0
      THEN ROUND((COALESCE(SUM(t.amount), 0) / (SELECT total FROM total_spending)) * 100, 2)
      ELSE 0
    END as percentage
  FROM categories c
  LEFT JOIN transactions t ON c.id = t.category_id
    AND t.user_id = user_uuid
    AND t.type = 'expense'
    AND t.transaction_date BETWEEN start_date AND end_date
  WHERE c.user_id = user_uuid AND c.type = 'expense'
  GROUP BY c.id, c.name, c.icon, c.color
  HAVING COALESCE(SUM(t.amount), 0) > 0
  ORDER BY total_amount DESC;
$$ LANGUAGE SQL STABLE;
```

### Monthly Comparison
```sql
CREATE OR REPLACE FUNCTION get_monthly_comparison(
  user_uuid UUID,
  months_back INTEGER DEFAULT 6
)
RETURNS TABLE(
  month_date DATE,
  month_label TEXT,
  income NUMERIC,
  expenses NUMERIC,
  net NUMERIC,
  savings_rate NUMERIC
) AS $$
  SELECT
    date_trunc('month', transaction_date)::DATE as month_date,
    to_char(date_trunc('month', transaction_date), 'Mon YYYY') as month_label,
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expenses,
    COALESCE(SUM(
      CASE
        WHEN type = 'income' THEN amount
        WHEN type = 'expense' THEN -amount
        ELSE 0
      END
    ), 0) as net,
    CASE
      WHEN SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) > 0
      THEN ROUND((SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) -
                  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END)) /
                  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) * 100, 2)
      ELSE 0
    END as savings_rate
  FROM transactions
  WHERE user_id = user_uuid
    AND transaction_date >= date_trunc('month', CURRENT_DATE) - make_interval(months => months_back)
  GROUP BY date_trunc('month', transaction_date)
  ORDER BY month_date DESC;
$$ LANGUAGE SQL STABLE;
```

### Spending Trends (with MoM growth)
```sql
CREATE OR REPLACE FUNCTION get_spending_trends(
  user_uuid UUID,
  category_uuid UUID DEFAULT NULL
)
RETURNS TABLE(
  current_month NUMERIC,
  last_month NUMERIC,
  month_over_month_change NUMERIC,
  month_over_month_percentage NUMERIC,
  three_month_average NUMERIC,
  trend_direction TEXT
) AS $$
  WITH monthly_spending AS (
    SELECT
      date_trunc('month', transaction_date)::DATE as month,
      SUM(amount) as total
    FROM transactions
    WHERE user_id = user_uuid
      AND type = 'expense'
      AND (category_uuid IS NULL OR category_id = category_uuid)
    GROUP BY date_trunc('month', transaction_date)
  )
  SELECT
    COALESCE((SELECT total FROM monthly_spending WHERE month = date_trunc('month', CURRENT_DATE)), 0) as current_month,
    COALESCE((SELECT total FROM monthly_spending WHERE month = date_trunc('month', CURRENT_DATE - interval '1 month')), 0) as last_month,
    COALESCE((SELECT total FROM monthly_spending WHERE month = date_trunc('month', CURRENT_DATE)), 0) -
    COALESCE((SELECT total FROM monthly_spending WHERE month = date_trunc('month', CURRENT_DATE - interval '1 month')), 0) as month_over_month_change,
    CASE
      WHEN COALESCE((SELECT total FROM monthly_spending WHERE month = date_trunc('month', CURRENT_DATE - interval '1 month')), 0) > 0
      THEN ROUND((
        (COALESCE((SELECT total FROM monthly_spending WHERE month = date_trunc('month', CURRENT_DATE)), 0) -
         COALESCE((SELECT total FROM monthly_spending WHERE month = date_trunc('month', CURRENT_DATE - interval '1 month')), 0)) /
        COALESCE((SELECT total FROM monthly_spending WHERE month = date_trunc('month', CURRENT_DATE - interval '1 month')), 0)
      ) * 100, 2)
      ELSE 0
    END as month_over_month_percentage,
    COALESCE((
      SELECT AVG(total)
      FROM monthly_spending
      WHERE month >= date_trunc('month', CURRENT_DATE - interval '3 months')
        AND month < date_trunc('month', CURRENT_DATE)
    ), 0) as three_month_average,
    CASE
      WHEN COALESCE((SELECT total FROM monthly_spending WHERE month = date_trunc('month', CURRENT_DATE)), 0) >
           COALESCE((SELECT total FROM monthly_spending WHERE month = date_trunc('month', CURRENT_DATE - interval '1 month')), 0)
      THEN 'up'
      WHEN COALESCE((SELECT total FROM monthly_spending WHERE month = date_trunc('month', CURRENT_DATE)), 0) <
           COALESCE((SELECT total FROM monthly_spending WHERE month = date_trunc('month', CURRENT_DATE - interval '1 month')), 0)
      THEN 'down'
      ELSE 'stable'
    END as trend_direction;
$$ LANGUAGE SQL STABLE;
```

### Top Merchants
```sql
CREATE OR REPLACE FUNCTION get_top_merchants(
  user_uuid UUID,
  start_date DATE,
  end_date DATE,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE(
  merchant_name TEXT,
  total_spent NUMERIC,
  transaction_count INTEGER,
  average_transaction NUMERIC,
  last_transaction_date DATE
) AS $$
  SELECT
    description as merchant_name,
    SUM(amount) as total_spent,
    COUNT(*)::INTEGER as transaction_count,
    ROUND(AVG(amount), 2) as average_transaction,
    MAX(transaction_date)::DATE as last_transaction_date
  FROM transactions
  WHERE user_id = user_uuid
    AND type = 'expense'
    AND transaction_date BETWEEN start_date AND end_date
    AND description IS NOT NULL
    AND description != ''
  GROUP BY description
  ORDER BY total_spent DESC
  LIMIT limit_count;
$$ LANGUAGE SQL STABLE;
```

## Chart Components

### Spending by Category (Pie/Donut Chart)
```typescript
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface CategorySpending {
  category_name: string
  category_color: string
  total_amount: number
  percentage: number
}

export function SpendingByCategoryChart({ data }: { data: CategorySpending[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total_amount"
          nameKey="category_name"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          label={(entry) => `${entry.percentage}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.category_color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
```

### Income vs Expenses Timeline (Line/Area Chart)
```typescript
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface MonthlyData {
  month_label: string
  income: number
  expenses: number
  net: number
}

export function IncomeExpensesChart({ data }: { data: MonthlyData[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month_label" />
        <YAxis />
        <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
        <Legend />
        <Area
          type="monotone"
          dataKey="income"
          stackId="1"
          stroke="#22c55e"
          fill="#22c55e"
          fillOpacity={0.6}
        />
        <Area
          type="monotone"
          dataKey="expenses"
          stackId="2"
          stroke="#ef4444"
          fill="#ef4444"
          fillOpacity={0.6}
        />
        <Line
          type="monotone"
          dataKey="net"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
```

### Budget Progress Bars
```typescript
interface BudgetProgress {
  category_name: string
  budget_amount: number
  spent_amount: number
  percentage: number
  status: 'safe' | 'warning' | 'danger'
}

export function BudgetProgressList({ budgets }: { budgets: BudgetProgress[] }) {
  return (
    <div className="space-y-4">
      {budgets.map((budget) => (
        <div key={budget.category_name} className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{budget.category_name}</span>
            <span className={cn(
              budget.status === 'danger' && 'text-red-600',
              budget.status === 'warning' && 'text-yellow-600',
              budget.status === 'safe' && 'text-green-600'
            )}>
              ${budget.spent_amount.toFixed(2)} / ${budget.budget_amount.toFixed(2)}
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all",
                budget.status === 'danger' && 'bg-red-500',
                budget.status === 'warning' && 'bg-yellow-500',
                budget.status === 'safe' && 'bg-green-500'
              )}
              style={{ width: `${Math.min(budget.percentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">
            {budget.percentage}% used
            {budget.percentage > 100 && ` (${(budget.percentage - 100).toFixed(0)}% over)`}
          </p>
        </div>
      ))}
    </div>
  )
}
```

## Insight Calculations

### Generate Financial Insights
```typescript
interface FinancialInsights {
  topSpendingCategory: string
  averageDailySpending: number
  savingsRate: number
  unusualSpending: boolean
  projectedMonthlySpending: number
  recommendations: string[]
}

export async function generateInsights(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<FinancialInsights> {
  const supabase = createClient()

  // Get spending by category
  const { data: categorySpending } = await supabase
    .rpc('get_spending_by_category', {
      user_uuid: userId,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    })

  // Get monthly comparison
  const { data: monthlyData } = await supabase
    .rpc('get_monthly_comparison', {
      user_uuid: userId,
      months_back: 3
    })

  // Calculate insights
  const topCategory = categorySpending?.[0]?.category_name || 'Unknown'
  const daysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const totalSpending = categorySpending?.reduce((sum, cat) => sum + cat.total_amount, 0) || 0
  const avgDailySpending = totalSpending / daysInPeriod

  const currentMonth = monthlyData?.[0]
  const savingsRate = currentMonth?.savings_rate || 0

  // Detect unusual spending (more than 50% above 3-month average)
  const threeMonthAvg = monthlyData?.slice(1, 4).reduce((sum, m) => sum + m.expenses, 0) / 3 || 0
  const unusualSpending = currentMonth && currentMonth.expenses > threeMonthAvg * 1.5

  // Project end of month
  const daysInMonth = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate()
  const currentDay = endDate.getDate()
  const projectedMonthlySpending = (totalSpending / currentDay) * daysInMonth

  // Generate recommendations
  const recommendations: string[] = []

  if (savingsRate < 20) {
    recommendations.push('Consider increasing your savings rate to at least 20%')
  }

  if (unusualSpending) {
    recommendations.push(`Your spending this month is unusually high. You've spent $${currentMonth.expenses.toFixed(2)} compared to your 3-month average of $${threeMonthAvg.toFixed(2)}`)
  }

  if (categorySpending && categorySpending[0].percentage > 40) {
    recommendations.push(`${topCategory} accounts for ${categorySpending[0].percentage}% of your spending. Consider if this aligns with your priorities`)
  }

  return {
    topSpendingCategory: topCategory,
    averageDailySpending: avgDailySpending,
    savingsRate,
    unusualSpending,
    projectedMonthlySpending,
    recommendations
  }
}
```

## Performance Optimization

### Materialized Views for Dashboard
```sql
-- Create materialized view for current month stats
CREATE MATERIALIZED VIEW user_monthly_stats AS
SELECT
  user_id,
  date_trunc('month', CURRENT_DATE)::DATE as month,
  COUNT(*) FILTER (WHERE type = 'expense') as expense_count,
  COUNT(*) FILTER (WHERE type = 'income') as income_count,
  COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) as total_expenses,
  COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0) as total_income,
  COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0) -
    COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) as net_income
FROM transactions
WHERE transaction_date >= date_trunc('month', CURRENT_DATE)
GROUP BY user_id;

CREATE UNIQUE INDEX ON user_monthly_stats(user_id);

-- Refresh daily via cron
```

### Caching Strategy
```typescript
// Use React Query with appropriate stale times
export function useSpendingByCategory(userId: string, dateRange: { start: Date, end: Date }) {
  return useQuery({
    queryKey: ['spending-by-category', userId, dateRange],
    queryFn: () => fetchSpendingByCategory(userId, dateRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Real-time updates for current month data
export function useRealtimeMonthlyStats(userId: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('monthly-stats')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions',
        filter: `user_id=eq.${userId}`
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['monthly-stats', userId] })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, queryClient])
}
```

## Dashboard Layouts

### Main Analytics Dashboard
```
┌─────────────────────────────────────────────────┐
│  Period Selector: [This Month ▼]  [Export ↓]  │
├──────────────────┬──────────────────────────────┤
│  Current Balance │  Monthly Income              │
│  $12,450.00      │  $5,200.00  ↑ 5%             │
├──────────────────┼──────────────────────────────┤
│  Monthly Expenses│  Savings Rate                │
│  $3,890.50       │  25.2%  ↑                    │
├──────────────────┴──────────────────────────────┤
│  Income vs Expenses (6 months)                  │
│  [Line/Area Chart]                              │
├─────────────────────────────────────────────────┤
│  Spending by Category        │  Budget Status   │
│  [Pie Chart]                 │  [Progress Bars] │
├─────────────────────────────────────────────────┤
│  Top Merchants                                  │
│  [List with amounts]                            │
├─────────────────────────────────────────────────┤
│  Insights & Recommendations                     │
│  • Your dining out spending is 40% higher...    │
│  • You're on track to save $1,300 this month    │
└─────────────────────────────────────────────────┘
```

## Workflow Steps

1. **Identify analytics need** - Understand what insights are required
2. **Design SQL queries** - Create optimized database queries
3. **Test with sample data** - Verify calculations are correct
4. **Build chart components** - Create visualizations
5. **Calculate insights** - Implement business logic
6. **Optimize performance** - Add caching and materialized views
7. **Add real-time updates** - Subscribe to relevant changes
8. **Test edge cases** - No data, negative values, large numbers

## Output Format

Provide:
1. SQL functions for data queries
2. React components for charts
3. TypeScript types
4. Insight calculation logic
5. Performance optimization suggestions
6. Sample data for testing

## Example Usage

"Build a spending trends analytics dashboard showing category breakdown and monthly comparisons"

Expected output:
- SQL functions for trend calculations
- Chart components (pie, line, area)
- Dashboard layout component
- Insight generation logic
- Caching configuration
