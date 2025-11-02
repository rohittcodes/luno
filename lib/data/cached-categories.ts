import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'
import type { Database } from '@/types/database'

type Category = Database['public']['Tables']['categories']['Row'] & {
  parent?: Database['public']['Tables']['categories']['Row'] | null
}

/**
 * Get user categories with caching
 * Uses React cache for request-level memoization
 */
export const getCachedCategories = cache(async (userId: string): Promise<Category[]> => {

  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('categories')
    .select('*, parent:categories!parent_id(*)')
    .eq('user_id', userId)
    .order('name')

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  // Transform parent array to single object (Supabase returns array for joined data)
  const transformed = (data || []).map((item: any) => ({
    ...item,
    parent: Array.isArray(item.parent) ? item.parent[0] || null : item.parent || null,
  }))

  return transformed as unknown as Category[]
})

