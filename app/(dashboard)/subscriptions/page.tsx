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
import { CalendarIcon, Plus, Trash2, Edit } from 'lucide-react'
import { CardGridSkeleton } from '@/components/skeletons/card-skeleton'
import type { Database } from '@/types/database'

type SubscriptionBill = Database['public']['Tables']['subscriptions_bills']['Row']

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionBill[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    loadSubscriptions()
  }, [])

  async function loadSubscriptions() {
    try {
      const supabase = createClientBrowser()
      const { data, error } = await supabase
        .from('subscriptions_bills')
        .select('*')
        .order('due_date', { ascending: true })

      if (error) throw error
      setSubscriptions(data || [])
    } catch (error) {
      console.error('Error loading subscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this subscription/bill?')) return

    try {
      const supabase = createClientBrowser()
      const { error } = await supabase
        .from('subscriptions_bills')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadSubscriptions()
    } catch (error) {
      console.error('Error deleting subscription:', error)
      alert('Failed to delete subscription')
    }
  }

  const upcoming = subscriptions.filter(
    (sub) => sub.is_active && new Date(sub.due_date) >= new Date()
  )
  const pastDue = subscriptions.filter(
    (sub) => sub.is_active && new Date(sub.due_date) < new Date()
  )

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bills & Subscriptions</h1>
          <p className="text-muted-foreground mt-1">
            Manage your bills, subscriptions, and free trials
          </p>
        </div>
        <SubscriptionDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSuccess={loadSubscriptions}
          editingId={editingId}
          onEditComplete={() => setEditingId(null)}
        />
      </div>

      {loading ? (
        <CardGridSkeleton count={3} />
      ) : (
        <div className="space-y-6">
          {pastDue.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-destructive">Past Due</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pastDue.map((sub) => (
                  <SubscriptionCard
                    key={sub.id}
                    subscription={sub}
                    onDelete={handleDelete}
                    onEdit={() => {
                      setEditingId(sub.id)
                      setIsDialogOpen(true)
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {upcoming.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Upcoming</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((sub) => (
                  <SubscriptionCard
                    key={sub.id}
                    subscription={sub}
                    onDelete={handleDelete}
                    onEdit={() => {
                      setEditingId(sub.id)
                      setIsDialogOpen(true)
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {subscriptions.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground mb-4">
                  No subscriptions or bills added yet
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Subscription or Bill
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

function SubscriptionCard({
  subscription,
  onDelete,
  onEdit,
}: {
  subscription: SubscriptionBill
  onDelete: (id: string) => void
  onEdit: () => void
}) {
  const dueDate = new Date(subscription.due_date)
  const isPastDue = dueDate < new Date()

  return (
    <Card className={isPastDue ? 'border-destructive' : ''}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{subscription.name}</CardTitle>
            <CardDescription>
              {subscription.type === 'bill' && 'One-time Bill'}
              {subscription.type === 'subscription' && 'Recurring Subscription'}
              {subscription.type === 'free_trial' && 'Free Trial'}
            </CardDescription>
          </div>
          <Badge variant={subscription.is_active ? 'default' : 'secondary'}>
            {subscription.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {subscription.amount && (
          <div className="text-2xl font-bold">
            {new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: subscription.currency || 'USD',
            }).format(Number(subscription.amount))}
          </div>
        )}
        <div className="text-sm text-muted-foreground">
          Due: {format(dueDate, 'PPP')}
        </div>
        {subscription.renewal_frequency && (
          <div className="text-sm text-muted-foreground">
            Renews: {subscription.renewal_frequency}
          </div>
        )}
        {subscription.notes && (
          <p className="text-sm mt-2">{subscription.notes}</p>
        )}
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(subscription.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function SubscriptionDialog({
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
    type: 'bill' as 'bill' | 'subscription' | 'free_trial',
    amount: '',
    currency: 'USD',
    due_date: new Date(),
    renewal_frequency: 'one_time' as string,
    notes: '',
  })

  const supabase = createClientBrowser()

  useEffect(() => {
    if (editingId && open) {
      loadSubscription(editingId)
    } else if (!editingId && open) {
      resetForm()
    }
  }, [editingId, open])

  async function loadSubscription(id: string) {
    try {
      const { data, error } = await supabase
        .from('subscriptions_bills')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      if (data) {
        setFormData({
          name: data.name,
          type: data.type as 'bill' | 'subscription' | 'free_trial',
          amount: data.amount?.toString() || '',
          currency: data.currency || 'USD',
          due_date: new Date(data.due_date),
          renewal_frequency: data.renewal_frequency || 'one_time',
          notes: data.notes || '',
        })
      }
    } catch (error) {
      console.error('Error loading subscription:', error)
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      type: 'bill',
      amount: '',
      currency: 'USD',
      due_date: new Date(),
      renewal_frequency: 'one_time',
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

      const subscriptionData = {
        user_id: user.id,
        name: formData.name,
        type: formData.type,
        amount: formData.amount ? parseFloat(formData.amount) : null,
        currency: formData.currency,
        due_date: format(formData.due_date, 'yyyy-MM-dd'),
        renewal_frequency:
          formData.type === 'subscription' ? formData.renewal_frequency : null,
        notes: formData.notes || null,
        is_active: true,
      }

      if (editingId) {
        const { error } = await supabase
          .from('subscriptions_bills')
          .update(subscriptionData as any)
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('subscriptions_bills')
          .insert(subscriptionData as any)

        if (error) throw error
      }

      onSuccess()
      onOpenChange(false)
      onEditComplete()
      resetForm()
    } catch (error) {
      console.error('Error saving subscription:', error)
      alert('Failed to save subscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Subscription or Bill
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingId ? 'Edit Subscription/Bill' : 'Add Subscription or Bill'}
          </DialogTitle>
          <DialogDescription>
            Track bills, subscriptions, and free trials with due dates
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Netflix, Rent, Insurance..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value: 'bill' | 'subscription' | 'free_trial') =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bill">One-time Bill</SelectItem>
                <SelectItem value="subscription">Recurring Subscription</SelectItem>
                <SelectItem value="free_trial">Free Trial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                placeholder="0.00"
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
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Due Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.due_date ? (
                    format(formData.due_date, 'PPP')
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.due_date}
                  onSelect={(date) =>
                    date && setFormData({ ...formData, due_date: date })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {formData.type === 'subscription' && (
            <div className="space-y-2">
              <Label htmlFor="renewal_frequency">Renewal Frequency</Label>
              <Select
                value={formData.renewal_frequency}
                onValueChange={(value) =>
                  setFormData({ ...formData, renewal_frequency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="one_time">One-time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

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

