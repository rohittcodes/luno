'use client'

import { useState, useEffect } from 'react'
import { createClientBrowser } from '@/lib/supabase/browser-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { CalendarIcon, Plus, Target, TrendingUp, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { CardGridSkeleton } from '@/components/skeletons/card-skeleton'
import type { Database } from '@/types/database'

type Goal = Database['public']['Tables']['goals']['Row']
type Category = Database['public']['Tables']['categories']['Row']

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    current_amount: '',
    deadline: null as Date | null,
    category_id: '',
    status: 'active' as 'active' | 'completed' | 'cancelled',
  })

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

      const [goalsResult, categoriesResult] = await Promise.all([
        supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id)
          .order('name'),
      ])

      if (goalsResult.data) setGoals(goalsResult.data as Goal[])
      if (categoriesResult.data) setCategories(categoriesResult.data as Category[])
    } catch (error) {
      console.error('Error loading goals:', error)
      toast.error('Failed to load goals')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const supabase = createClientBrowser()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const goalData = {
        user_id: user.id,
        name: formData.name,
        target_amount: parseFloat(formData.target_amount),
        current_amount: parseFloat(formData.current_amount || '0'),
        deadline: formData.deadline?.toISOString().split('T')[0] || null,
        category_id: formData.category_id || null,
        status: formData.status,
      }

      // TypeScript doesn't know about goals table in Database type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const goalsTable = supabase.from('goals') as any

      if (editingId) {
        const { error } = await goalsTable
          .update(goalData)
          .eq('id', editingId)

        if (error) throw error
        toast.success('Goal updated successfully')
      } else {
        const { error } = await goalsTable
          .insert(goalData)

        if (error) throw error
        toast.success('Goal created successfully')
      }

      setIsDialogOpen(false)
      resetForm()
      loadData()
    } catch (error: any) {
      console.error('Error saving goal:', error)
      toast.error(error.message || 'Failed to save goal')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this goal?')) return

    try {
      const supabase = createClientBrowser()
      // TypeScript doesn't know about goals table in Database type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const goalsTable = supabase.from('goals') as any
      const { error } = await goalsTable.delete().eq('id', id)

      if (error) throw error
      toast.success('Goal deleted successfully')
      loadData()
    } catch (error: any) {
      console.error('Error deleting goal:', error)
      toast.error(error.message || 'Failed to delete goal')
    }
  }

  async function updateProgress(id: string, newAmount: number) {
    try {
      const supabase = createClientBrowser()
      // TypeScript doesn't know about goals table in Database type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const goalsTable = supabase.from('goals') as any
      const { error } = await goalsTable
        .update({ current_amount: newAmount })
        .eq('id', id)

      if (error) throw error
      toast.success('Progress updated')
      loadData()
    } catch (error: any) {
      console.error('Error updating progress:', error)
      toast.error(error.message || 'Failed to update progress')
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      target_amount: '',
      current_amount: '',
      deadline: null,
      category_id: '',
      status: 'active',
    })
    setEditingId(null)
  }

  function handleEdit(goal: Goal) {
    setFormData({
      name: goal.name,
      target_amount: goal.target_amount.toString(),
      current_amount: (goal.current_amount ?? 0).toString(),
      deadline: goal.deadline ? new Date(goal.deadline) : null,
      category_id: goal.category_id || '',
      status: goal.status as 'active' | 'completed' | 'cancelled',
    })
    setEditingId(goal.id)
    setIsDialogOpen(true)
  }

  function getProgressPercentage(goal: Goal): number {
    if (goal.target_amount === 0) return 0
    return Math.min((Number(goal.current_amount ?? 0) / Number(goal.target_amount)) * 100, 100)
  }

  function getDaysRemaining(goal: Goal): number | null {
    if (!goal.deadline) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const deadline = new Date(goal.deadline)
    deadline.setHours(0, 0, 0, 0)
    const diff = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff >= 0 ? diff : null
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <CardGridSkeleton count={3} />
      </div>
    )
  }

  const activeGoals = goals.filter((g) => g.status === 'active')
  const completedGoals = goals.filter((g) => g.status === 'completed')
  const cancelledGoals = goals.filter((g) => g.status === 'cancelled')

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8" />
            Financial Goals
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your savings and financial objectives
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Goal' : 'Create New Goal'}</DialogTitle>
              <DialogDescription>
                Set a financial target and track your progress
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Goal Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Emergency Fund, Vacation, House Down Payment"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target_amount">Target Amount</Label>
                  <Input
                    id="target_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.target_amount}
                    onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="current_amount">Current Amount</Label>
                  <Input
                    id="current_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.current_amount}
                    onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="deadline">Deadline (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.deadline ? (
                        format(formData.deadline, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.deadline || undefined}
                      onSelect={(date) => setFormData({ ...formData, deadline: date || null })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="category_id">Category (Optional)</Label>
                <Select
                  value={formData.category_id || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'active' | 'completed' | 'cancelled') =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingId ? 'Update' : 'Create'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Active Goals</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeGoals.map((goal) => {
              const progress = getProgressPercentage(goal)
              const daysRemaining = getDaysRemaining(goal)
              const remaining = Number(goal.target_amount) - Number(goal.current_amount ?? 0)

              return (
                <Card key={goal.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{goal.name}</CardTitle>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(goal)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(goal.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      {goal.deadline && (
                        <div className="mt-1">
                          {daysRemaining !== null ? (
                            <span>
                              {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
                            </span>
                          ) : (
                            <span className="text-red-500">Deadline passed</span>
                          )}
                        </div>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>
                          {new Intl.NumberFormat('en-IN', {
                            style: 'currency',
                            currency: 'INR',
                          }).format(Number(goal.current_amount ?? 0))}{' '}
                          /{' '}
                          {new Intl.NumberFormat('en-IN', {
                            style: 'currency',
                            currency: 'INR',
                          }).format(Number(goal.target_amount))}
                        </span>
                        <span className="font-semibold">{progress.toFixed(1)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {remaining > 0 ? (
                        <span>
                          ₹{remaining.toLocaleString('en-IN')} remaining to reach goal
                        </span>
                      ) : (
                        <span className="text-green-600 font-semibold">Goal achieved! 🎉</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          const newAmount = Number(
                            prompt('Enter new current amount:', (goal.current_amount ?? 0).toString())
                          )
                          if (!isNaN(newAmount) && newAmount >= 0) {
                            updateProgress(goal.id, newAmount)
                          }
                        }}
                      >
                        Update Progress
                      </Button>
                      {progress >= 100 && (
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={async () => {
                            const supabase = createClientBrowser()
                            // TypeScript doesn't know about goals table in Database type
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const goalsTable = supabase.from('goals') as any
                            await goalsTable
                              .update({ status: 'completed' })
                              .eq('id', goal.id)
                            loadData()
                            toast.success('Goal marked as completed!')
                          }}
                        >
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            Completed Goals
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completedGoals.map((goal) => (
              <Card key={goal.id} className="opacity-75">
                <CardHeader>
                  <CardTitle className="text-lg">{goal.name}</CardTitle>
                  <Badge variant="outline" className="w-fit mt-2">
                    Completed
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    <span className="font-semibold">
                      {new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                      }).format(Number(goal.target_amount))}
                    </span>
                    {' '}achieved
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Goals */}
      {goals.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first financial goal to start tracking your progress
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Goal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

