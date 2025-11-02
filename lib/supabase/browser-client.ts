'use client'

import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

/**
 * Browser-side Supabase client
 * Use this in Client Components
 */
export function createClientBrowser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }

  if (!supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}
