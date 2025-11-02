'use client'

import { ThemeProvider } from 'next-themes'
import { QueryProvider } from '@/lib/providers/query-provider'
import { Toaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryProvider>
        {children}
        <Toaster position="top-right" richColors />
      </QueryProvider>
    </ThemeProvider>
  )
}

