'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClientBrowser } from '@/lib/supabase/browser-client'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  Target,
  Tag,
  BarChart3,
  Bell,
  Settings,
  Users,
  Link2,
  Receipt,
  Calendar,
  LogOut,
  User,
  ChevronRight,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavigationGroup {
  label: string
  items: NavigationItem[]
}

const navigationGroups: NavigationGroup[] = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Transactions', href: '/transactions', icon: Receipt },
      { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Management',
    items: [
      { name: 'Accounts', href: '/accounts', icon: Wallet },
      { name: 'Categories', href: '/categories', icon: Tag },
      { name: 'Budgets', href: '/budgets', icon: Target },
      { name: 'Goals', href: '/goals', icon: TrendingUp },
      { name: 'Subscriptions', href: '/subscriptions', icon: Calendar },
    ],
  },
  {
    label: 'Settings',
    items: [
      { name: 'Integrations', href: '/integrations', icon: Link2 },
      { name: 'Family', href: '/family', icon: Users },
      { name: 'Notifications', href: '/notifications', icon: Bell },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" variant="sidebar" className='h-full border-none py-2 bg-sidebar'>
      <SidebarHeader className="px-4 py-3 border-b">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-base font-bold leading-none">Luno</span>
            <span className="text-xs text-muted-foreground mt-0.5">Finance Manager</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        {navigationGroups.map((group, groupIndex) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href || pathname?.startsWith(item.href + '/')
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.name}
                      >
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
            {groupIndex < navigationGroups.length - 1 && (
              <SidebarSeparator className="my-0 mt-4 mx-0 mr-2" />
            )}
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="px-2 py-2 border-t">
        <UserMenu />
      </SidebarFooter>
    </Sidebar>
  )
}

function UserMenu() {
  const [user, setUser] = useState<{ email?: string; fullName?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { state } = useSidebar()

  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClientBrowser()
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        if (authUser) {
          // Get user profile
          const { data: profile } = await supabase
            .from('users_profile')
            .select('full_name, email')
            .eq('id', authUser.id)
            .single()

          setUser({
            email: authUser.email || profile?.email || '',
            fullName: profile?.full_name || authUser.user_metadata?.full_name || '',
          })
        }
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  const handleLogout = async () => {
    try {
      const supabase = createClientBrowser()
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const getInitials = () => {
    if (user?.fullName) {
      return user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (user?.email) {
      return user.email[0].toUpperCase()
    }
    return 'U'
  }

  if (loading) {
    return (
      <div className="px-2 py-1.5">
        <div className="h-8 w-full animate-pulse rounded-md bg-muted" />
      </div>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold">
                  {user?.fullName || 'User'}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user?.email || ''}
                </span>
              </div>
              <ChevronRight className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={state === 'collapsed' ? 'right' : 'bottom'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {user?.fullName || 'User'}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user?.email || ''}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

/**
 * Dashboard Navigation Provider
 * Wraps the dashboard layout with sidebar provider
 */
export function DashboardNavProvider({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      {children}
    </SidebarProvider>
  )
}
