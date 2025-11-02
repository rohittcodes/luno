'use client'

import { useEffect, useState } from 'react'
import { createClientBrowser } from '@/lib/supabase/browser-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { ListSkeleton } from '@/components/skeletons/list-skeleton'
import type { Database } from '@/types/database'

type Notification = Database['public']['Tables']['notifications']['Row']

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    loadNotifications()
  }, [filter])

  async function loadNotifications() {
    try {
      const supabase = createClientBrowser()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (filter === 'unread') {
        query = query.eq('is_read', false)
      }

      const { data, error } = await query

      if (error) throw error
      setNotifications((data || []) as Notification[])
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(id: string) {
    try {
      const supabase = createClientBrowser()
      // TypeScript doesn't know about notifications table in Database type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase
        .from('notifications') as any)
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', id)

      if (error) throw error
      await loadNotifications()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  async function markAllAsRead() {
    try {
      const supabase = createClientBrowser()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // TypeScript doesn't know about notifications table in Database type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase
        .from('notifications') as any)
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) throw error
      await loadNotifications()
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            Stay updated on bills, subscriptions, and account activity
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            onClick={() => setFilter('unread')}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <ListSkeleton items={5} />
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkAsRead={markAsRead}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function NotificationCard({
  notification,
  onMarkAsRead,
}: {
  notification: Notification
  onMarkAsRead: (id: string) => void
}) {
  const getNotificationTypeBadge = (type: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'secondary'> = {
      bill_due: 'destructive',
      subscription_renewal: 'default',
      trial_expiring: 'secondary',
      budget_alert: 'destructive',
      account_balance: 'destructive',
    }
    return variants[type] || 'default'
  }

  const getNotificationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      bill_due: 'Bill Due',
      subscription_renewal: 'Renewal',
      trial_expiring: 'Trial Ending',
      budget_alert: 'Budget Alert',
      account_balance: 'Low Balance',
    }
    return labels[type] || type
  }

  return (
    <Card className={!notification.is_read ? 'border-primary' : ''}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{notification.title}</CardTitle>
              <Badge variant={getNotificationTypeBadge(notification.type)}>
                {getNotificationTypeLabel(notification.type)}
              </Badge>
            </div>
            <CardDescription>{notification.message}</CardDescription>
            <p className="text-xs text-muted-foreground mt-2">
              {notification.created_at && format(new Date(notification.created_at), 'PPP p')}
            </p>
          </div>
          {!notification.is_read && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkAsRead(notification.id)}
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
    </Card>
  )
}

