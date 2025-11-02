'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Wallet } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

export function LandingNav() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Wallet className="h-6 w-6" />
            Luno
          </Link>
          
          <div className="flex items-center gap-6">
            <Link 
              href="/blog" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Blog
            </Link>
            <Link 
              href="/#features" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link 
              href="/#pricing" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

