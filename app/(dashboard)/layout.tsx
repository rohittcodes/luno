import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserSubscription } from '@/lib/subscriptions/check-limits'
import { DashboardNav, DashboardNavProvider } from '@/components/dashboard-nav'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { ThemeToggle } from '@/components/theme-toggle'
import { Chatbot } from '@/components/chat/chatbot'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const subscription = await getUserSubscription(user.id)

  return (
    <DashboardNavProvider>
      <DashboardNav />
      <SidebarInset className='py-2 pr-2 bg-sidebar h-screen'>
        <div className="w-full h-screen bg-zinc-50 dark:bg-black overflow-hidden rounded-xl">
          <header className="flex h-[65px] sticky top-0 z-10 bg-background shrink-0 items-center justify-between gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <ThemeToggle />
          </header>
          <div className="p-4 pb-16 h-full overflow-y-auto">
            {children}
          </div>
        </div>
      </SidebarInset>
      <Chatbot />
    </DashboardNavProvider>
  )
}
