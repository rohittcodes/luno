'use client'

import { useEffect, useState } from 'react'
import { createClientBrowser } from '@/lib/supabase/browser-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { format } from 'date-fns'
import { Plus, Trash2, Edit, Target, TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrencyClient, getLocaleFromCurrency } from '@/lib/utils/currency'
import { toast } from 'sonner'
import { CardGridSkeleton } from '@/components/skeletons/card-skeleton'
import type { Database } from '@/types/database'

type Transaction = Database['public']['Tables']['transactions']['Row']
type Budget = Database['public']['Tables']['budgets']['Row'] & {
  name?: string | null
  currency?: string | null
  categories?: Category | null
}
type Category = Database['public']['Tables']['categories']['Row']

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [userCurrency, setUserCurrency] = useState<string>('USD')
  const [userLocale, setUserLocale] = useState<string>('en-US')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const supabase = createClientBrowser()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Load budgets
      const { data: budgetsData, error: budgetsError } = await supabase
        .from('budgets')
        .select('*, categories(*)')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false })

      if (budgetsError) throw budgetsError

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)

      if (categoriesError) throw categoriesError

      // Load transactions for current period
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('transaction_date', startOfMonth.toISOString().split('T')[0])

      if (transactionsError) throw transactionsError

      // Load user currency preference
      const { data: profileData } = await supabase
        .from('users_profile')
        .select('currency_preference')
        .eq('id', user.id)
        .single()

      const currency = profileData?.currency_preference || 'USD'
      const locale = getLocaleFromCurrency(currency)
      setUserCurrency(currency)
      setUserLocale(locale)

      setBudgets(budgetsData || [])
      setCategories(categoriesData || [])
      setTransactions(transactionsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this budget?')) return

    try {
      const supabase = createClientBrowser()
      const { error } = await supabase.from('budgets').delete().eq('id', id)

      if (error) throw error
      await loadData()
    } catch (error) {
      console.error('Error deleting budget:', error)
      toast.error('Failed to delete budget')
    }
  }

  function calculateBudgetProgress(budget: Budget): {
    spent: number
    remaining: number
    percentage: number
    isOverBudget: boolean
  } {
    const budgetCategoryIds = budget.category_id
      ? [budget.category_id]
      : categories.filter((c) => !c.parent_category_id).map((c) => c.id)

    const budgetTransactions = transactions.filter(
      (t) =>
        budgetCategoryIds.includes(t.category_id || '') &&
        new Date(t.transaction_date) >= new Date(budget.start_date) &&
        new Date(t.transaction_date) <= new Date(budget.end_date || budget.start_date)
    )

    const spent = budgetTransactions.reduce(
      (sum, t) => sum + Math.abs(Number(t.amount || 0)),
      0
    )

    const remaining = Number(budget.amount) - spent
    const percentage = Math.min((spent / Number(budget.amount)) * 100, 100)
    const isOverBudget = spent > Number(budget.amount)

    return { spent, remaining, percentage, isOverBudget }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Budgets</h1>
          <p className="text-muted-foreground mt-1">
            Track spending against your budgets
          </p>
        </div>
        <BudgetDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSuccess={loadData}
          editingId={editingId}
          onEditComplete={() => setEditingId(null)}
          categories={categories}
        />
      </div>

      {loading ? (
        <CardGridSkeleton count={3} />
      ) : budgets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              No budgets created yet
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Budget
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => {
            const progress = calculateBudgetProgress(budget)
            return (
              <BudgetCard
                key={budget.id}
                budget={budget}
                progress={progress}
                onDelete={handleDelete}
                onEdit={() => {
                  setEditingId(budget.id)
                  setIsDialogOpen(true)
                }}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function BudgetCard({
  budget,
  progress,
  onDelete,
  onEdit,
}: {
  budget: Budget & { categories?: Category | null }
  progress: { spent: number; remaining: number; percentage: number; isOverBudget: boolean }
  onDelete: (id: string) => void
  onEdit: () => void
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              {budget.categories?.name || `Budget for ${budget.period}`}
            </CardTitle>
            <CardDescription>
              {budget.category_id ? budget.categories?.name || 'Category' : 'All Categories'}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(budget.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Budget</span>
            <span className="font-semibold">
              {formatCurrencyClient(
                Number(budget.amount),
                budget.currency || userCurrency,
                budget.currency ? getLocaleFromCurrency(budget.currency) : userLocale
              )}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Spent</span>
            <span
              className={`font-semibold ${
                progress.isOverBudget ? 'text-red-600' : 'text-gray-900'
              }`}
            >
              {formatCurrencyClient(
                progress.spent,
                budget.currency || userCurrency,
                budget.currency ? getLocaleFromCurrency(budget.currency) : userLocale
              )}
            </span>
          </div>
          <Progress
            value={progress.percentage}
            className={progress.isOverBudget ? 'bg-red-200' : ''}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-muted-foreground">Remaining</span>
            <span
              className={`font-semibold flex items-center gap-1 ${
                progress.remaining < 0
                  ? 'text-red-600'
                  : progress.remaining < Number(budget.amount) * 0.2
                  ? 'text-yellow-600'
                  : 'text-green-600'
              }`}
            >
              {progress.remaining < 0 ? (
                <>
                  <TrendingUp className="h-4 w-4" />
                  {formatCurrencyClient(
                    Math.abs(progress.remaining),
                    budget.currency || userCurrency,
                    budget.currency ? getLocaleFromCurrency(budget.currency) : userLocale
                  )}{' '}
                  over
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4" />
                  {formatCurrencyClient(
                    progress.remaining,
                    budget.currency || userCurrency,
                    budget.currency ? getLocaleFromCurrency(budget.currency) : userLocale
                  )}
                </>
              )}
            </span>
          </div>
        </div>
        {progress.isOverBudget && (
          <Badge variant="destructive" className="w-full justify-center">
            Over Budget
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}

function BudgetDialog({
  open,
  onOpenChange,
  onSuccess,
  editingId,
  onEditComplete,
  categories,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  editingId: string | null
  onEditComplete: () => void
  categories: Category[]
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    amount: '',
    currency: 'USD',
    period: 'monthly' as 'monthly' | 'yearly' | 'custom',
    start_date: new Date(),
    end_date: new Date(),
  })
  
  const [userCurrency, setUserCurrency] = useState<string>('USD')

  const supabase = createClientBrowser()

  useEffect(() => {
    async function loadUserCurrency() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profileData } = await supabase
          .from('users_profile')
          .select('currency_preference')
          .eq('id', user.id)
          .single()

        const currency = profileData?.currency_preference || 'USD'
        setUserCurrency(currency)
      }
    }

    if (open) {
      loadUserCurrency()
    }
  }, [open])

  useEffect(() => {
    if (editingId && open) {
      loadBudget(editingId)
    } else if (!editingId && open) {
      resetForm()
    }
  }, [editingId, open])

  async function loadBudget(id: string) {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      if (data) {
        const budget = data as Budget
        setFormData({
          name: '', // Budgets don't have a name field
          category_id: budget.category_id || '',
          amount: budget.amount?.toString() || '',
          currency: userCurrency, // Budgets don't store currency
          period: 'custom', // Can enhance to detect period type
          start_date: new Date(budget.start_date),
          end_date: new Date(budget.end_date || budget.start_date),
        })
      }
    } catch (error) {
      console.error('Error loading budget:', error)
    }
  }

  function resetForm() {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    setFormData({
      name: '',
      category_id: '',
      amount: '',
      currency: userCurrency,
      period: 'monthly',
      start_date: startOfMonth,
      end_date: endOfMonth,
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      // Calculate end date based on period
      let endDate = formData.end_date
      let period: 'weekly' | 'monthly' | 'yearly' = 'monthly'
      
      if (formData.period === 'monthly') {
        endDate = new Date(formData.start_date)
        endDate.setMonth(endDate.getMonth() + 1)
        endDate.setDate(0) // Last day of month
        period = 'monthly'
      } else if (formData.period === 'yearly') {
        endDate = new Date(formData.start_date)
        endDate.setFullYear(endDate.getFullYear() + 1)
        endDate.setDate(endDate.getDate() - 1)
        period = 'yearly'
      } else if (formData.period === 'custom') {
        // For custom, use the selected end_date but default period to monthly
        period = 'monthly'
      }

      const budgetData = {
        user_id: user.id,
        name: formData.name || null,
        category_id: formData.category_id || null,
        amount: parseFloat(formData.amount),
        currency: formData.currency || 'USD',
        period: period,
        start_date: format(formData.start_date, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
      }

      // TypeScript doesn't know about budgets table in Database type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const budgetsTable = supabase.from('budgets') as any

      if (editingId) {
        const { error } = await budgetsTable
          .update(budgetData)
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await budgetsTable
          .insert(budgetData)

        if (error) throw error
      }

      onSuccess()
      onOpenChange(false)
      onEditComplete()
      resetForm()
    } catch (error: any) {
      console.error('Error saving budget:', error)
      toast.error(error.message || 'Failed to save budget')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Budget
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingId ? 'Edit Budget' : 'Create Budget'}
          </DialogTitle>
          <DialogDescription>
            Set spending limits for categories or overall spending
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Budget Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Groceries Budget"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category (Optional)</Label>
              <Select
                value={formData.category_id || 'none'}
                onValueChange={(value) =>
                  setFormData({ ...formData, category_id: value === 'none' ? '' : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="period">Period *</Label>
              <Select
                value={formData.period}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, period: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Budget Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) =>
                  setFormData({ ...formData, currency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false)
                onEditComplete()
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

