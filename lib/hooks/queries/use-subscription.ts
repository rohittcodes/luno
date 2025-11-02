'use client'

import { useQuery } from '@tanstack/react-query'

type SubscriptionData = {
  subscription: {
    plan_type: 'free' | 'pro' | 'family'
    status: string
  }
  limits: {
    transactions_limit: number
    categories_limit: number
    bank_connections_limit: number
    receipt_scans_limit: number
    family_members_limit: number
  } | null
}

async function fetchSubscription(): Promise<SubscriptionData> {
  const response = await fetch('/api/subscription')
  
  if (!response.ok) {
    throw new Error('Failed to fetch subscription')
  }
  
  return response.json()
}

export function useSubscription() {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: fetchSubscription,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}

