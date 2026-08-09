"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { BellIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { useMeQuery } from "@/hooks/use-auth"
import {
  useMarkAllNotificationsReadMutation,
  useNotificationUnreadCountQuery,
  useRecentNotificationsQuery,
  useSetNotificationReadMutation,
} from "@/hooks/use-notifications"
import type { NotificationItem } from "@/services/notification.service"
import { NotificationPanel } from "@/components/notifications/notification-panel"
import { cn } from "@/lib/utils"

function NotificationTrigger({ unreadCount }: { unreadCount: number }) {
  return (
    <Button
      aria-label={unreadCount ? `Open notifications, ${unreadCount} unread` : "Open notifications"}
      className="relative"
      size="icon"
      variant="ghost"
    >
      <BellIcon aria-hidden="true" />
      {unreadCount > 0 ? (
        <span className="absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-4 text-primary-foreground">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </Button>
  )
}

export function NotificationBell({ className }: { className?: string } = {}) {
  const [open, setOpen] = React.useState(false)
  const isMobile = useIsMobile()
  const router = useRouter()
  const meQuery = useMeQuery()
  const authenticated = Boolean(meQuery.data?.user)
  const unreadQuery = useNotificationUnreadCountQuery(authenticated)
  const recentQuery = useRecentNotificationsQuery(authenticated && open)
  const setReadMutation = useSetNotificationReadMutation()
  const markAllMutation = useMarkAllNotificationsReadMutation()
  const unreadCount = unreadQuery.data?.count ?? recentQuery.data?.unreadCount ?? 0
  const items = recentQuery.data?.items ?? []

  const onSelect = (item: NotificationItem) => {
    if (!item.readAt) {
      setReadMutation.mutate({ notificationId: item.id, read: true })
    }
    setOpen(false)
    const actionAvailable =
      item.actionUrl &&
      (!item.actionExpiresAt || new Date(item.actionExpiresAt).getTime() > Date.now())
    if (actionAvailable) {
      router.push(item.actionUrl!)
    }
  }

  const panel = (
    <NotificationPanel
      error={recentQuery.isError}
      hasMore={Boolean(recentQuery.data?.nextCursor)}
      isLoading={recentQuery.isLoading}
      items={items}
      onMarkAllRead={() => markAllMutation.mutate(undefined)}
      onRetry={() => void recentQuery.refetch()}
      onSelect={onSelect}
      onToggleRead={(item) =>
        setReadMutation.mutate({ notificationId: item.id, read: !item.readAt })
      }
      unreadCount={unreadCount}
    />
  )

  if (!authenticated) {
    return null
  }

  if (isMobile) {
    return (
      <Sheet onOpenChange={setOpen} open={open}>
        <SheetTrigger asChild>
          <span className={cn("inline-flex", className)}>
            <NotificationTrigger unreadCount={unreadCount} />
          </span>
        </SheetTrigger>
        <SheetContent className="w-full max-w-md p-0" side="right">
          <SheetHeader className="border-b px-4 py-4">
            <SheetTitle className="sr-only">Notifications</SheetTitle>
          </SheetHeader>
          {panel}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <span className={cn("inline-flex", className)}>
          <NotificationTrigger unreadCount={unreadCount} />
        </span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(28rem,calc(100vw-2rem))] p-0">
        {panel}
      </PopoverContent>
    </Popover>
  )
}
