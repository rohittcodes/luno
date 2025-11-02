'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClientBrowser } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import type { Database } from '@/types/database'

type Transaction = Database['public']['Tables']['transactions']['Row']
type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
type TransactionUpdate = Database['public']['Tables']['transactions']['Update']

async function fetchTransactions() {
  const supabase = createClientBrowser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('transactions')
    .select('*, accounts(*), categories(*)')
    .eq('user_id', user.id)
    .order('transaction_date', { ascending: false })

  if (error) throw error
  return data || []
}

async function createTransaction(transaction: TransactionInsert) {
  const supabase = createClientBrowser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // Check limit
  const limitResponse = await fetch(`/api/check-limits?feature=transactions`)
  const limitData = await limitResponse.json()
  if (!limitData.canUse) {
    throw new Error(
      `Transaction limit reached (${limitData.current}/${limitData.limit === 'unlimited' ? '∞' : limitData.limit}). Please upgrade.`
    )
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert({ ...transaction, user_id: user.id } as any)
    .select()
    .single()

  if (error) throw error
  return data
}

async function updateTransaction(id: string, updates: TransactionUpdate) {
  const supabase = createClientBrowser()
  const { data, error } = await supabase
    .from('transactions')
    .update(updates as any)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

async function deleteTransaction(id: string) {
  const supabase = createClientBrowser()
  const { error } = await supabase.from('transactions').delete().eq('id', id)

  if (error) throw error
}

export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: fetchTransactions,
  })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTransaction,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      // Invalidate server-side cache
      try {
        await fetch('/api/transactions/invalidate-cache', { method: 'POST' })
      } catch (error) {
        console.error('Failed to invalidate cache:', error)
      }
      toast.success('Transaction created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create transaction')
    },
  })
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: TransactionUpdate }) =>
      updateTransaction(id, updates),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      // Invalidate server-side cache
      try {
        await fetch('/api/transactions/invalidate-cache', { method: 'POST' })
      } catch (error) {
        console.error('Failed to invalidate cache:', error)
      }
      toast.success('Transaction updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update transaction')
    },
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTransaction,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      // Invalidate server-side cache
      try {
        await fetch('/api/transactions/invalidate-cache', { method: 'POST' })
      } catch (error) {
        console.error('Failed to invalidate cache:', error)
      }
      toast.success('Transaction deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete transaction')
    },
  })
}

