import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Database } from '@/types/database'

type Budget = Database['public']['Tables']['budgets']['Row']

/**
 * Active budgets component (Server Component)
 */
export function DashboardActiveBudgets({ budgets }: { budgets: Budget[] }) {
  if (budgets.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Active Budgets</CardTitle>
          <Link href="/budgets">
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {budgets.map((budget) => (
            <div key={budget.id} className="flex justify-between items-center">
              <div>
                <p className="font-medium">{budget.name}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(budget.start_date).toLocaleDateString()} -{' '}
                  {budget.end_date
                    ? new Date(budget.end_date).toLocaleDateString()
                    : 'Ongoing'}
                </p>
              </div>
              <span className="font-semibold">
                {new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: budget.currency || 'INR',
                }).format(Number(budget.amount))}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

