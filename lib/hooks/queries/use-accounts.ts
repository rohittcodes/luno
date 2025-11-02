'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClientBrowser } from '@/lib/supabase/browser-client'
import { toast } from 'sonner'
import type { Database } from '@/types/database'

type Account = Database['public']['Tables']['accounts']['Row']
type AccountInsert = Database['public']['Tables']['accounts']['Insert']
type AccountUpdate = Database['public']['Tables']['accounts']['Update']

async function fetchAccounts() {
  const supabase = createClientBrowser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  if (error) throw error
  return data || []
}

async function createAccount(account: AccountInsert) {
  const supabase = createClientBrowser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('accounts')
    .insert({ ...account, user_id: user.id } as any)
    .select()
    .single()

  if (error) throw error
  return data
}

async function updateAccount(id: string, updates: AccountUpdate) {
  const supabase = createClientBrowser()
  const { data, error } = await supabase
    .from('accounts')
    .update(updates as any)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

async function deleteAccount(id: string) {
  const supabase = createClientBrowser()
  const { error } = await supabase.from('accounts').delete().eq('id', id)

  if (error) throw error
}

export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: fetchAccounts,
  })
}

export function useCreateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      toast.success('Account created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create account')
    },
  })
}

export function useUpdateAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: AccountUpdate }) =>
      updateAccount(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      toast.success('Account updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update account')
    },
  })
}

export function useDeleteAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      toast.success('Account deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete account')
    },
  })
}

