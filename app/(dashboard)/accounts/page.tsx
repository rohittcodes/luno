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
import { Plus, Trash2, Edit, Wallet } from 'lucide-react'
import { formatCurrencyClient, getLocaleFromCurrency } from '@/lib/utils/currency'
import { toast } from 'sonner'
import type { Database } from '@/types/database'
import { ListSkeleton } from '@/components/skeletons/list-skeleton'

type Account = Database['public']['Tables']['accounts']['Row'] & {
  account_number?: string | null
  institution_name?: string | null
  notes?: string | null
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [userCurrency, setUserCurrency] = useState<string>('USD')
  const [userLocale, setUserLocale] = useState<string>('en-US')

  useEffect(() => {
    loadAccounts()
  }, [])

  async function loadAccounts() {
    try {
      const supabase = createClientBrowser()
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('name')

      if (error) throw error
      
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

      setAccounts((data || []) as Account[])
    } catch (error) {
      console.error('Error loading accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this account? All transactions will be orphaned.')) return

    try {
      const supabase = createClientBrowser()
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadAccounts()
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error('Failed to delete account')
    }
  }

  const totalBalance = accounts.reduce((sum, account) => {
    return sum + Number(account.balance || 0)
  }, 0)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Accounts</h1>
          <p className="text-muted-foreground mt-1">
            Manage your bank accounts, cash, and other accounts
          </p>
        </div>
        <AccountDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSuccess={loadAccounts}
          editingId={editingId}
          onEditComplete={() => setEditingId(null)}
        />
      </div>

      {/* Total Balance */}
      <Card>
        <CardHeader>
          <CardDescription>Total Balance Across All Accounts</CardDescription>
          <CardTitle className="text-3xl">
            {formatCurrencyClient(totalBalance, userCurrency, userLocale)}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Accounts Grid */}
      {loading ? (
        <ListSkeleton items={3} />
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              No accounts added yet
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              userCurrency={userCurrency}
              userLocale={userLocale}
              onDelete={handleDelete}
              onEdit={() => {
                setEditingId(account.id)
                setIsDialogOpen(true)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function AccountCard({
  account,
  userCurrency,
  userLocale,
  onDelete,
  onEdit,
}: {
  account: Account
  userCurrency: string
  userLocale: string
  onDelete: (id: string) => void
  onEdit: () => void
}) {
  const getAccountTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      checking: 'bg-blue-100 text-blue-800',
      savings: 'bg-green-100 text-green-800',
      credit: 'bg-red-100 text-red-800',
      cash: 'bg-yellow-100 text-yellow-800',
      investment: 'bg-purple-100 text-purple-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{account.name}</CardTitle>
            <CardDescription>{account.type}</CardDescription>
          </div>
          <Badge className={getAccountTypeBadge(account.type)}>
            {account.type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold">
            {formatCurrencyClient(
              Number(account.balance || 0),
              account.currency || userCurrency,
              account.currency ? getLocaleFromCurrency(account.currency) : userLocale
            )}
          </div>
          {account.account_number && (
            <p className="text-sm text-muted-foreground">
              ****{account.account_number.slice(-4)}
            </p>
          )}
          {account.institution_name && (
            <p className="text-sm text-muted-foreground">
              {account.institution_name}
            </p>
          )}
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(account.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AccountDialog({
  open,
  onOpenChange,
  onSuccess,
  editingId,
  onEditComplete,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  editingId: string | null
  onEditComplete: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'checking' as 'checking' | 'savings' | 'credit' | 'cash' | 'investment',
    balance: '',
    currency: 'USD',
    account_number: '',
    institution_name: '',
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
      loadAccount(editingId)
    } else if (!editingId && open) {
      resetForm()
    }
  }, [editingId, open])

  async function loadAccount(id: string) {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      if (data) {
        const account = data as Account
        setFormData({
          name: account.name,
          type: account.type as any,
          balance: account.balance?.toString() || '0',
          currency: account.currency || userCurrency,
          account_number: account.account_number || '',
          institution_name: account.institution_name || '',
          notes: account.notes || '',
        })
      }
    } catch (error) {
      console.error('Error loading account:', error)
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      type: 'checking',
      balance: '0',
      currency: userCurrency,
      account_number: '',
      institution_name: '',
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

      const accountData = {
        user_id: user.id,
        name: formData.name,
        type: formData.type,
        balance: parseFloat(formData.balance) || 0,
        currency: formData.currency,
        account_number: formData.account_number || null,
        institution_name: formData.institution_name || null,
        notes: formData.notes || null,
      }

      // TypeScript doesn't know about accounts table in Database type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const accountsTable = supabase.from('accounts') as any

      if (editingId) {
        const { error } = await accountsTable
          .update(accountData)
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await accountsTable
          .insert(accountData)

        if (error) throw error
      }

      onSuccess()
      onOpenChange(false)
      onEditComplete()
      resetForm()
    } catch (error: any) {
      console.error('Error saving account:', error)
      toast.error(error.message || 'Failed to save account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Account
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingId ? 'Edit Account' : 'Add Account'}
          </DialogTitle>
          <DialogDescription>
            Create or edit a bank account, cash account, or investment account
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Account Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Chase Checking"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Account Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Checking</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="credit">Credit Card</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) =>
                  setFormData({ ...formData, currency: value })
                }
              >
                <SelectTrigger className='w-full'>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="balance">Starting Balance *</Label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                value={formData.balance}
                onChange={(e) =>
                  setFormData({ ...formData, balance: e.target.value })
                }
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_number">Account Number (Last 4)</Label>
              <Input
                id="account_number"
                value={formData.account_number}
                onChange={(e) =>
                  setFormData({ ...formData, account_number: e.target.value })
                }
                placeholder="1234"
                maxLength={4}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="institution_name">Institution Name</Label>
            <Input
              id="institution_name"
              value={formData.institution_name}
              onChange={(e) =>
                setFormData({ ...formData, institution_name: e.target.value })
              }
              placeholder="e.g., Chase Bank"
            />
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

