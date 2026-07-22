'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Bell,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  CheckCheck,
  Clock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  CardContent,
} from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { useNotificationsData } from '@/hooks/use-data'
import { useAppStore } from '@/store'
import { formatDateTime } from '@/lib/utils'
import type { Notification } from '@/types'

const typeConfig: Record<
  Notification['type'],
  { icon: typeof Info; color: string; bg: string }
> = {
  info: {
    icon: Info,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
  INFO: {
    icon: Info,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
  success: {
    icon: CheckCircle,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  SUCCESS: {
    icon: CheckCircle,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
  },
  WARNING: {
    icon: AlertTriangle,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
  },
  error: {
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
  },
  ERROR: {
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
  },
}

const borderColors: Record<Notification['type'], string> = {
  info: 'border-l-blue-500',
  INFO: 'border-l-blue-500',
  success: 'border-l-emerald-500',
  SUCCESS: 'border-l-emerald-500',
  warning: 'border-l-amber-500',
  WARNING: 'border-l-amber-500',
  error: 'border-l-red-500',
  ERROR: 'border-l-red-500',
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification
  onRead: (id: string) => void
}) {
  const config = typeConfig[notification.type]
  const Icon = config.icon

  return (
    <button
      type="button"
      onClick={() => {
        if (!notification.read) onRead(notification.id)
      }}
      className={`w-full text-left transition-colors hover:bg-accent/50 ${
        !notification.read ? 'bg-accent/5' : ''
      } ${
        !notification.read
          ? `border-l-4 ${borderColors[notification.type]}`
          : 'border-l-4 border-l-transparent'
      } rounded-lg`}
    >
      <CardContent className="flex items-start gap-4 p-4">
        <div
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.bg}`}
        >
          <Icon className={`h-4.5 w-4.5 ${config.color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p
              className={`text-sm font-semibold leading-snug ${
                !notification.read ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {notification.title}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              {!notification.read && (
                <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
              )}
            </div>
          </div>
          <p
            className={`mt-1 text-sm leading-relaxed ${
              !notification.read
                ? 'text-foreground/80'
                : 'text-muted-foreground'
            }`}
          >
            {notification.message}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDateTime(notification.createdAt)}
            </span>
            {notification.link && (
              <Link
                href={notification.link}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Voir
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </button>
  )
}

export default function NotificationsPage() {
  const [page, setPage] = useState(1)
  const size = 20
  const { data: notifData } = useNotificationsData(page, size)
  const notifications = (notifData?.items as Notification[]) || []
  const total = notifData?.total || 0
  const unreadCount = notifData?.unreadCount || 0
  const totalPages = Math.max(1, Math.ceil(total / size))

  const markNotificationRead = useAppStore((s) => s.markNotificationRead)
  const markAllNotificationsRead = useAppStore(
    (s) => s.markAllNotificationsRead
  )

  const filterNotifications = (filter: string) => {
    switch (filter) {
      case 'unread':
        return notifications.filter((n) => !n.read)
      case 'read':
        return notifications.filter((n) => n.read)
      default:
        return notifications
    }
  }

  const groupedNotifications = (items: Notification[]) => {
    const today: Notification[] = []
    const earlier: Notification[] = []
    for (const n of items) {
      if (isToday(n.createdAt)) {
        today.push(n)
      } else {
        earlier.push(n)
      }
    }
    return { today, earlier }
  }

  const renderList = (items: Notification[]) => {
    const { today, earlier } = groupedNotifications(items)

    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Bell className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">Aucune notification</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Vous êtes à jour. Aucune notification à afficher.
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {today.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Aujourd'hui
              </h3>
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">
                {today.length}
              </span>
            </div>
            <div className="space-y-1">
              {today.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onRead={markNotificationRead}
                />
              ))}
            </div>
          </div>
        )}
        {earlier.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Plus tôt
              </h3>
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">
                {earlier.length}
              </span>
            </div>
            <div className="space-y-1">
              {earlier.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onRead={markNotificationRead}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? `Vous avez ${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
              : 'Toutes les notifications ont été lues'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllNotificationsRead}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all" className="gap-1.5">
            Toutes
            <span className="ml-1 rounded-full bg-muted-foreground/20 px-1.5 py-0.5 text-[10px] font-semibold">
              {notifications.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="unread" className="gap-1.5">
            Non lues
            {unreadCount > 0 && (
              <span className="ml-1 rounded-full bg-blue-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="read" className="gap-1.5">
            Lues
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {renderList(filterNotifications('all'))}
        </TabsContent>
        <TabsContent value="unread">
          {renderList(filterNotifications('unread'))}
        </TabsContent>
        <TabsContent value="read">
          {renderList(filterNotifications('read'))}
        </TabsContent>
      </Tabs>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} sur {totalPages} ({total} notifications)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
