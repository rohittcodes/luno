'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClientBrowser } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import type { Database } from '@/types/database'

type Category = Database['public']['Tables']['categories']['Row']
type CategoryInsert = Database['public']['Tables']['categories']['Insert']
type CategoryUpdate = Database['public']['Tables']['categories']['Update']

async function fetchCategories() {
  const supabase = createClientBrowser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('categories')
    .select('*, parent:categories!parent_id(*)')
    .eq('user_id', user.id)
    .order('name')

  if (error) throw error
  return data || []
}

async function createCategory(category: CategoryInsert) {
  const supabase = createClientBrowser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Check limit
  const limitResponse = await fetch(`/api/check-limits?feature=categories`)
  const limitData = await limitResponse.json()
  if (!limitData.canUse) {
    throw new Error(
      `Category limit reached (${limitData.current}/${limitData.limit === 'unlimited' ? '∞' : limitData.limit}). Please upgrade.`
    )
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({ ...category, user_id: user.id } as any)
    .select()
    .single()

  if (error) throw error
  return data
}

async function updateCategory(id: string, updates: CategoryUpdate) {
  const supabase = createClientBrowser()
  const { data, error } = await supabase
    .from('categories')
    .update(updates as any)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

async function deleteCategory(id: string) {
  const supabase = createClientBrowser()
  const { error } = await supabase.from('categories').delete().eq('id', id)

  if (error) throw error
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createCategory,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      // Invalidate server-side cache
      try {
        await fetch('/api/categories/invalidate-cache', { method: 'POST' })
      } catch (error) {
        console.error('Failed to invalidate cache:', error)
      }
      toast.success('Category created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create category')
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: CategoryUpdate }) =>
      updateCategory(id, updates),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      // Invalidate server-side cache
      try {
        await fetch('/api/categories/invalidate-cache', { method: 'POST' })
      } catch (error) {
        console.error('Failed to invalidate cache:', error)
      }
      toast.success('Category updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update category')
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      // Invalidate server-side cache
      try {
        await fetch('/api/categories/invalidate-cache', { method: 'POST' })
      } catch (error) {
        console.error('Failed to invalidate cache:', error)
      }
      toast.success('Category deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete category')
    },
  })
}

