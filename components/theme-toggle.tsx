'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    // Toggle between light and dark
    // If theme is 'system', check resolvedTheme to determine current state
    const currentTheme = theme === 'system' ? resolvedTheme : theme
    if (currentTheme === 'light' || !currentTheme) {
      setTheme('dark')
    } else {
      setTheme('light')
    }
  }

  // Determine which icon to show (use resolvedTheme to handle 'system' theme)
  const isDark = mounted && (resolvedTheme === 'dark' || (theme === 'dark' && !resolvedTheme))

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9">
        <Sun className="h-4 w-4" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 relative"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      <Sun className={`h-4 w-4 absolute transition-all ${isDark ? 'rotate-90 scale-0' : 'rotate-0 scale-100'}`} />
      <Moon className={`h-4 w-4 absolute transition-all ${isDark ? 'rotate-0 scale-100' : '-rotate-90 scale-0'}`} />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

