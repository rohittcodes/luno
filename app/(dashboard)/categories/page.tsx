'use client'

import { useEffect, useState } from 'react'
import { createClientBrowser } from '@/lib/supabase/browser-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Edit, Folder, FolderTree } from 'lucide-react'
import type { Database } from '@/types/database'
import { ListSkeleton } from '@/components/skeletons/list-skeleton'

type Category = Database['public']['Tables']['categories']['Row'] & {
  description?: string | null
  parent?: Category | null
  parent_id?: string | null // Alias for parent_category_id
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    try {
      const supabase = createClientBrowser()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.error('User not authenticated')
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('categories')
        .select('*, parent:categories!parent_category_id(*)')
        .eq('user_id', user.id)
        .order('name')

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      const mappedData = (data || []).map((cat: any) => ({
        ...cat,
        parent_id: cat.parent_category_id || null,
        parent: Array.isArray(cat.parent) ? cat.parent[0] || null : cat.parent || null,
      }))
      setCategories(mappedData as Category[])
    } catch (error) {
      console.error('Error loading categories:', error)
      // Show user-friendly error message
      if (error instanceof Error) {
        console.error('Error details:', error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this category? Transactions using this category will be unassigned.')) return

    try {
      const supabase = createClientBrowser()
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Failed to delete category')
    }
  }

  // Group categories by parent
  const rootCategories = categories.filter((c) => !c.parent_id)
  const childCategories = categories.filter((c) => c.parent_id)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground mt-1">
            Organize your transactions with categories
          </p>
        </div>
        <CategoryDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSuccess={loadCategories}
          editingId={editingId}
          onEditComplete={() => setEditingId(null)}
          categories={categories}
        />
      </div>

      {loading ? (
        <ListSkeleton items={3} />
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Folder className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              No categories created yet
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Category
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rootCategories.map((category) => {
            const children = childCategories.filter((c) => c.parent_id === category.id)
            return (
              <CategoryCard
                key={category.id}
                category={category}
                children={children}
                onDelete={handleDelete}
                onEdit={() => {
                  setEditingId(category.id)
                  setIsDialogOpen(true)
                }}
                allCategories={categories}
                onSuccess={loadCategories}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function CategoryCard({
  category,
  children,
  onDelete,
  onEdit,
  allCategories,
  onSuccess,
}: {
  category: Category & { parent?: Category | null }
  children: Category[]
  onDelete: (id: string) => void
  onEdit: () => void
  allCategories: Category[]
  onSuccess: () => void
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Folder className="h-5 w-5" />
              {category.name}
            </CardTitle>
            <CardDescription>
              {category.description || 'No description'}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(category.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {children.length > 0 && (
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-muted-foreground mb-2">
              Subcategories:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {children.map((child) => (
                <Badge key={child.id} variant="secondary" className="justify-start">
                  <FolderTree className="h-3 w-3 mr-1" />
                  {child.name}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

function CategoryDialog({
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
    description: '',
    parent_id: '',
    type: 'expense' as 'income' | 'expense',
    icon: '',
    color: '#3B82F6',
  })

  const supabase = createClientBrowser()

  useEffect(() => {
    if (editingId && open) {
      loadCategory(editingId)
    } else if (!editingId && open) {
      resetForm()
    }
  }, [editingId, open])

  async function loadCategory(id: string) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      if (data) {
        const category = data as Category
        setFormData({
          name: category.name,
          description: category.description || '',
          parent_id: category.parent_category_id || category.parent_id || '',
          type: (category.type as any) || 'expense',
          icon: category.icon || '',
          color: category.color || '#3B82F6',
        })
      }
    } catch (error) {
      console.error('Error loading category:', error)
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      parent_id: '',
      type: 'expense',
      icon: '',
      color: '#3B82F6',
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

      // Check category limit
      if (!editingId) {
        const limitResponse = await fetch(`/api/check-limits?feature=categories`)
        const limitData = await limitResponse.json()
        if (!limitData.canUse) {
          alert(`Category limit reached (${limitData.current}/${limitData.limit === 'unlimited' ? '∞' : limitData.limit}). Please upgrade to create more categories.`)
          setLoading(false)
          return
        }
      }

      const categoryData = {
        user_id: user.id,
        name: formData.name,
        description: formData.description || null,
        parent_id: formData.parent_id || null,
        type: formData.type,
        icon: formData.icon || null,
        color: formData.color || null,
      }

      // TypeScript doesn't know about categories table in Database type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const categoriesTable = supabase.from('categories') as any

      if (editingId) {
        const { error } = await categoriesTable
          .update(categoryData)
          .eq('id', editingId)

        if (error) throw error
      } else {
        const { error } = await categoriesTable
          .insert(categoryData)

        if (error) throw error
      }

      onSuccess()
      onOpenChange(false)
      onEditComplete()
      resetForm()
    } catch (error: any) {
      console.error('Error saving category:', error)
      alert(error.message || 'Failed to save category')
    } finally {
      setLoading(false)
    }
  }

  // Filter out current category and its children from parent options
  const parentOptions = editingId
    ? categories.filter((c) => c.id !== editingId && !categories.some((child) => child.parent_id === editingId && child.id === c.id))
    : categories

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Category
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingId ? 'Edit Category' : 'Create Category'}
          </DialogTitle>
          <DialogDescription>
            Organize transactions with categories and subcategories
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Groceries, Rent, Salary"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                required
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent">Parent Category (Optional)</Label>
              <select
                id="parent"
                value={formData.parent_id}
                onChange={(e) =>
                  setFormData({ ...formData, parent_id: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="">None (Root Category)</option>
                {parentOptions.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Category description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="icon">Icon (Emoji)</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) =>
                  setFormData({ ...formData, icon: e.target.value })
                }
                placeholder="🍔"
                maxLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  className="h-10 w-20"
                />
                <Input
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
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

