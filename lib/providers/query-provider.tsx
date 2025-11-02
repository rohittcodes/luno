'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, useEffect } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Only initialize QueryClient on the client to avoid SSR/prerender issues
  const [queryClient, setQueryClient] = useState<QueryClient | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    setQueryClient(
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: 30 seconds
            staleTime: 30 * 1000,
            // Cache time: 5 minutes
            gcTime: 5 * 60 * 1000,
            // Retry failed requests
            retry: 1,
            // Refetch on window focus
            refetchOnWindowFocus: false,
          },
          mutations: {
            // Retry failed mutations
            retry: 1,
          },
        },
      })
    )
  }, [])

  // Return children without QueryClientProvider during SSR/prerender
  if (!isMounted || !queryClient) {
    return <>{children}</>
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )} */}
    </QueryClientProvider>
  )
}

