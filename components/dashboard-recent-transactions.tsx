import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Database } from '@/types/database'

type Transaction = Database['public']['Tables']['transactions']['Row']

/**
 * Recent transactions component (Server Component)
 */
export function DashboardRecentTransactions({
  transactions,
}: {
  transactions: Transaction[]
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Recent Transactions</CardTitle>
          <Link href="/transactions">
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No transactions yet</p>
            <Link href="/transactions">
              <Button variant="outline" className="mt-4">
                Add Transaction
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex justify-between items-center py-2 border-b last:border-0"
              >
                <div>
                  <p className="font-medium">
                    {transaction.description || 'Untitled'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(transaction.transaction_date).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`font-semibold ${
                    transaction.type === 'income'
                      ? 'text-green-600'
                      : transaction.type === 'expense'
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}
                >
                  {transaction.type === 'expense' ? '-' : transaction.type === 'income' ? '+' : ''}
                  {new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: transaction.currency || 'INR',
                  }).format(Math.abs(Number(transaction.amount || 0)))}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

