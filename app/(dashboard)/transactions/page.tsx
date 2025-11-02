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
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { CalendarIcon, Plus, Trash2, Edit, Search, Filter } from 'lucide-react'
import { ExportButton } from './export-button'
import { ListSkeleton } from '@/components/skeletons/list-skeleton'
import { formatCurrencyClient, getLocaleFromCurrency } from '@/lib/utils/currency'
import { toast } from 'sonner'
import type { Database } from '@/types/database'

type Transaction = Database['public']['Tables']['transactions']['Row'] & {
  currency?: string | null
}
type Account = Database['public']['Tables']['accounts']['Row']
type Category = Database['public']['Tables']['categories']['Row']

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all')
  const [userCurrency, setUserCurrency] = useState<string>('USD')
  const [userLocale, setUserLocale] = useState<string>('en-US')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const supabase = createClientBrowser()
      
      // Load transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*, accounts(*), categories(*)')
        .order('transaction_date', { ascending: false })

      if (transactionsError) throw transactionsError

      // Load accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .order('name')

      if (accountsError) throw accountsError

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (categoriesError) throw categoriesError

      // Load user currency preference
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
        const locale = getLocaleFromCurrency(currency)
        setUserCurrency(currency)
        setUserLocale(locale)
      }

      setTransactions(transactionsData || [])
      setAccounts(accountsData || [])
      setCategories(categoriesData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this transaction?')) return

    try {
      const supabase = createClientBrowser()
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadData()
    } catch (error) {
      console.error('Error deleting transaction:', error)
      toast.error('Failed to delete transaction')
    }
  }

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || t.type === filterType
    return matchesSearch && matchesType
  })

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0)

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground mt-1">
            Manage your income, expenses, and transfers
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton />
          <TransactionDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            onSuccess={loadData}
            editingId={editingId}
            onEditComplete={() => setEditingId(null)}
            accounts={accounts}
            categories={categories}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Income</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {formatCurrencyClient(totalIncome, userCurrency, userLocale)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Expenses</CardDescription>
            <CardTitle className="text-2xl text-red-600">
              {formatCurrencyClient(totalExpenses, userCurrency, userLocale)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Net</CardDescription>
            <CardTitle className={`text-2xl ${totalIncome - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrencyClient(totalIncome - totalExpenses, userCurrency, userLocale)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      {loading ? (
        <ListSkeleton items={5} />
      ) : filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              No transactions found
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Transaction
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredTransactions.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                userCurrency={userCurrency}
                userLocale={userLocale}
                onDelete={handleDelete}
                onEdit={() => {
                  setEditingId(transaction.id)
                  setIsDialogOpen(true)
                }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TransactionCard({
  transaction,
  userCurrency,
  userLocale,
  onDelete,
  onEdit,
}: {
  transaction: Transaction & { accounts?: Account; categories?: Category }
  userCurrency: string
  userLocale: string
  onDelete: (id: string) => void
  onEdit: () => void
}) {
  const getTypeBadge = (type: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      income: 'default',
      expense: 'destructive',
      transfer: 'secondary',
    }
    return variants[type] || 'default'
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold">{transaction.description || 'Untitled'}</h3>
              <Badge variant={getTypeBadge(transaction.type)}>
                {transaction.type}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              {transaction.accounts && (
                <p>Account: {transaction.accounts.name}</p>
              )}
              {transaction.categories && (
                <p>Category: {transaction.categories.name}</p>
              )}
              <p>Date: {format(new Date(transaction.transaction_date), 'PPP')}</p>
              {transaction.notes && <p>{transaction.notes}</p>}
            </div>
          </div>
          <div className="text-right">
            <p className={`text-xl font-bold ${
              transaction.type === 'income' ? 'text-green-600' :
              transaction.type === 'expense' ? 'text-red-600' :
              'text-gray-600'
            }`}>
              {transaction.type === 'expense' ? '-' : transaction.type === 'income' ? '+' : ''}
              {formatCurrencyClient(
                Math.abs(Number(transaction.amount)),
                transaction.currency || userCurrency,
                transaction.currency ? getLocaleFromCurrency(transaction.currency) : userLocale
              )}
            </p>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(transaction.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TransactionDialog({
  open,
  onOpenChange,
  onSuccess,
  editingId,
  onEditComplete,
  accounts,
  categories,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  editingId: string | null
  onEditComplete: () => void
  accounts: Account[]
  categories: Category[]
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    type: 'expense' as 'income' | 'expense' | 'transfer',
    amount: '',
    currency: 'USD', // Will be updated when userCurrency is loaded
    account_id: '',
    category_id: '',
    transaction_date: new Date(),
    notes: '',
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
      loadTransaction(editingId)
    } else if (!editingId && open) {
      resetForm()
    }
  }, [editingId, open])

  async function loadTransaction(id: string) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      if (data) {
        setFormData({
          description: data.description || '',
          type: data.type as 'income' | 'expense' | 'transfer',
          amount: data.amount?.toString() || '',
          currency: data.currency || userCurrency,
          account_id: data.account_id || '',
          category_id: data.category_id || '',
          transaction_date: new Date(data.transaction_date),
          notes: data.notes || '',
        })
      }
    } catch (error) {
      console.error('Error loading transaction:', error)
    }
  }

  function resetForm() {
    setFormData({
      description: '',
      type: 'expense',
      amount: '',
      currency: userCurrency,
      account_id: accounts[0]?.id || '',
      category_id: '',
      transaction_date: new Date(),
      notes: '',
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

      // Check transaction limit
      if (!editingId) {
        const limitResponse = await fetch(`/api/check-limits?feature=transactions`)
        const limitData = await limitResponse.json()
        if (!limitData.canUse) {
          toast.error(`Transaction limit reached (${limitData.current}/${limitData.limit === 'unlimited' ? '∞' : limitData.limit}). Please upgrade to add more transactions.`)
          setLoading(false)
          return
        }
      }

      const transactionData = {
        user_id: user.id,
        description: formData.description,
        type: formData.type,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        account_id: formData.account_id || null,
        category_id: formData.category_id || null,
        transaction_date: format(formData.transaction_date, 'yyyy-MM-dd'),
        notes: formData.notes || null,
      }

      if (editingId) {
        const { error } = await supabase
          .from('transactions')
          .update(transactionData as any)
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('transactions')
          .insert(transactionData as any)

        if (error) throw error
      }

      onSuccess()
      onOpenChange(false)
      onEditComplete()
      resetForm()
    } catch (error: any) {
      console.error('Error saving transaction:', error)
      toast.error(error.message || 'Failed to save transaction')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingId ? 'Edit Transaction' : 'Add Transaction'}
          </DialogTitle>
          <DialogDescription>
            Record income, expenses, or transfers
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Transaction description"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'income' | 'expense' | 'transfer') =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account">Account</Label>
              <Select
                value={formData.account_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, account_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, category_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.transaction_date ? (
                      format(formData.transaction_date, 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.transaction_date}
                    onSelect={(date) =>
                      date && setFormData({ ...formData, transaction_date: date })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
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

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Additional notes..."
            />
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

