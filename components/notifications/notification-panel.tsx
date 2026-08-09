"use client"

import Link from "next/link"
import {
  AlertTriangleIcon,
  BellRingIcon,
  CheckCheckIcon,
  CircleAlertIcon,
  InfoIcon,
  RefreshCwIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import type { NotificationItem } from "@/services/notification.service"
import { cn } from "@/lib/utils"

function formatNotificationDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value))
}

function priorityLabel(priority: NotificationItem["priority"]): string {
  if (priority === "action_required") return "Action needed"
  if (priority === "important") return "Important"
  return "Update"
}

function NotificationPriorityIcon({
  priority,
}: {
  priority: NotificationItem["priority"]
}) {
  if (priority === "action_required") {
    return <CircleAlertIcon className="size-4 text-amber-600" aria-hidden="true" />
  }
  if (priority === "important") {
    return <AlertTriangleIcon className="size-4 text-rose-600" aria-hidden="true" />
  }
  return <InfoIcon className="size-4 text-muted-foreground" aria-hidden="true" />
}

function NotificationRow({
  item,
  onSelect,
  onToggleRead,
}: {
  item: NotificationItem
  onSelect: (item: NotificationItem) => void
  onToggleRead: (item: NotificationItem) => void
}) {
  return (
    <div
      className={cn(
        "group flex gap-3 border-b px-4 py-3 last:border-b-0",
        !item.readAt && "bg-primary/[0.04]",
      )}
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        onClick={() => onSelect(item)}
      >
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border bg-background">
          <NotificationPriorityIcon priority={item.priority} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{item.title}</span>
            {!item.readAt ? <span className="size-1.5 rounded-full bg-primary" /> : null}
          </span>
          <span className="mt-1 block text-sm leading-5 text-muted-foreground">
            {item.body}
          </span>
          <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>{formatNotificationDate(item.createdAt)}</span>
            <span aria-hidden="true">·</span>
            <span>{priorityLabel(item.priority)}</span>
            {item.organization ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="truncate">{item.organization.name}</span>
              </>
            ) : null}
          </span>
        </span>
      </button>
      <Button
        aria-label={item.readAt ? "Mark notification unread" : "Mark notification read"}
        className="mt-0.5 shrink-0 opacity-60 transition-opacity group-hover:opacity-100"
        onClick={() => onToggleRead(item)}
        size="icon-xs"
        variant="ghost"
      >
        <span
          className={cn(
            "size-2 rounded-full border-2 border-muted-foreground",
            !item.readAt && "border-primary bg-primary",
          )}
        />
      </Button>
    </div>
  )
}

export function NotificationPanel({
  error,
  hasMore,
  isLoading,
  items,
  onLoadMore,
  onMarkAllRead,
  onRetry,
  onSelect,
  onToggleRead,
  unreadCount,
}: {
  error?: boolean
  hasMore?: boolean
  isLoading?: boolean
  items: NotificationItem[]
  onLoadMore?: () => void
  onMarkAllRead: () => void
  onRetry: () => void
  onSelect: (item: NotificationItem) => void
  onToggleRead: (item: NotificationItem) => void
  unreadCount: number
}) {
  return (
    <div className="flex max-h-[min(38rem,calc(100vh-7rem))] min-h-0 flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-4 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <BellRingIcon className="size-4" aria-hidden="true" />
            <h2 className="font-semibold">Notifications</h2>
            {unreadCount > 0 ? <Badge variant="secondary">{unreadCount > 99 ? "99+" : unreadCount}</Badge> : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Official league updates for your workspaces.</p>
        </div>
        <Button
          disabled={unreadCount === 0}
          onClick={onMarkAllRead}
          size="sm"
          variant="ghost"
        >
          <CheckCheckIcon className="size-4" />
          Mark all read
        </Button>
      </div>
      <Separator />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-3 p-4" aria-busy="true" aria-label="Loading notifications">
            {Array.from({ length: 4 }, (_, index) => (
              <div className="flex gap-3" key={index}>
                <Skeleton className="size-7 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center" role="alert">
            <AlertTriangleIcon className="size-8 text-muted-foreground" aria-hidden="true" />
            <div>
              <p className="font-medium">Notifications could not load</p>
              <p className="mt-1 text-sm text-muted-foreground">Your league work is safe. Try loading the inbox again.</p>
            </div>
            <Button onClick={onRetry} size="sm" variant="outline">
              <RefreshCwIcon className="size-4" />
              Try again
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center" role="status">
            <BellRingIcon className="size-8 text-muted-foreground" aria-hidden="true" />
            <div>
              <p className="font-medium">You’re all caught up</p>
              <p className="mt-1 text-sm text-muted-foreground">New invitations, assignments, and official league updates will appear here.</p>
            </div>
          </div>
        ) : (
          <>
            {items.map((item) => (
              <NotificationRow item={item} key={item.id} onSelect={onSelect} onToggleRead={onToggleRead} />
            ))}
            {hasMore && onLoadMore ? (
              <div className="flex justify-center p-3">
                <Button onClick={onLoadMore} size="sm" variant="outline">Load more</Button>
              </div>
            ) : null}
          </>
        )}
      </div>
      <Separator />
      <div className="flex justify-end px-4 py-3">
        <Button asChild size="sm" variant="link">
          <Link href="/notifications">View notification history</Link>
        </Button>
      </div>
    </div>
  )
}
