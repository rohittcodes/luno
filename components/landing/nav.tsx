'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Wallet } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

export function LandingNav() {
  return (
    <nav className="sticky top-0 z-50 border-b-[3px] bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-24 items-center justify-between">
          <Link href="/" className="flex items-center gap-3 font-bold text-3xl group">
            <div className="h-12 w-12 rounded-[1.5rem] bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Wallet className="h-7 w-7 text-primary" />
            </div>
            Luno
          </Link>

          <div className="flex items-center gap-10">
            <div className="hidden md:flex items-center gap-10">
              <Link
                href="/blog"
                className="text-lg font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                Blog
              </Link>
              <Link
                href="/#features"
                className="text-lg font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </Link>
              <Link
                href="/#pricing"
                className="text-lg font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Button variant="ghost" asChild className="font-bold rounded-[1.5rem] text-lg hidden sm:inline-flex">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild className="font-bold rounded-[1.5rem] text-lg px-8 shadow-lg hover:shadow-xl transition-all">
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

