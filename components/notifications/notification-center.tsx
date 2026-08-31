"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BellRingIcon, Building2Icon } from "lucide-react"

import { getApiErrorMessage, useMeQuery } from "@/hooks/use-auth"
import { useOrganizationsQuery } from "@/hooks/use-organization"
import {
  useMarkAllNotificationsReadMutation,
  useNotificationsQuery,
  useSetNotificationReadMutation,
} from "@/hooks/use-notifications"
import {
  buildNotificationQuery,
  type NotificationCenterFilters,
} from "@/lib/notification-center"
import type {
  NotificationCategory,
  NotificationItem,
} from "@/services/notification.service"
import { NotificationPanel } from "@/components/notifications/notification-panel"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { HeaderAccountMenu } from "@/components/auth/header-account-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const categories: Array<{ label: string; value: NotificationCategory | "all" }> = [
  { label: "All updates", value: "all" },
  { label: "Access", value: "access" },
  { label: "Rosters", value: "roster" },
  { label: "Schedule", value: "schedule" },
  { label: "Scoring", value: "scoring" },
  { label: "Competition", value: "competition" },
  { label: "Requirements", value: "compliance" },
]

export function NotificationCenter() {
  const router = useRouter()
  const meQuery = useMeQuery()
  const organizationsQuery = useOrganizationsQuery()
  const [filters, setFilters] = React.useState<NotificationCenterFilters>({
    category: "all",
    status: "all",
  })
  const [cursor, setCursor] = React.useState<string | null>(null)
  const [items, setItems] = React.useState<NotificationItem[]>([])
  const userReady = Boolean(meQuery.data?.user)
  const query = useNotificationsQuery(
    buildNotificationQuery(filters, cursor),
    userReady,
  )
  const setReadMutation = useSetNotificationReadMutation()
  const markAllMutation = useMarkAllNotificationsReadMutation()

  function updateFilters(next: Partial<NotificationCenterFilters>) {
    setCursor(null)
    setItems([])
    setFilters((current) => ({ ...current, ...next }))
  }

  React.useEffect(() => {
    const incoming = query.data?.items ?? []
    const frameId = window.requestAnimationFrame(() => {
      setItems((current) => {
        if (!cursor) {
          return incoming
        }
        const seen = new Set(current.map((item) => item.id))
        return [...current, ...incoming.filter((item) => !seen.has(item.id))]
      })
    })
    return () => window.cancelAnimationFrame(frameId)
  }, [cursor, query.data?.items])

  const onSelect = (item: NotificationItem) => {
    if (!item.readAt) {
      setReadMutation.mutate({ notificationId: item.id, read: true })
    }
    const actionAvailable =
      item.actionUrl &&
      (!item.actionExpiresAt || new Date(item.actionExpiresAt).getTime() > Date.now())
    if (actionAvailable) {
      router.push(item.actionUrl!)
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link className="flex size-9 shrink-0 items-center justify-center rounded-md border" href="/organizations">
              <Building2Icon className="size-4" aria-hidden="true" />
              <span className="sr-only">Organizations</span>
            </Link>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Workspace</p>
              <h1 className="truncate text-base font-semibold">Notifications</h1>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <ThemeToggle />
            <HeaderAccountMenu />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <BellRingIcon className="size-5 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm font-medium text-muted-foreground">Your league inbox</p>
            </div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Keep every official update in view.</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">Invitations, roster decisions, game assignments, and official results stay together across your organizations.</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/organizations">Back to organizations</Link>
          </Button>
        </section>

        <section className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[1fr_12rem_16rem]" aria-label="Notification filters">
          <Select
            value={filters.category}
            onValueChange={(value) => updateFilters({ category: value as NotificationCenterFilters["category"] })}
          >
            <SelectTrigger aria-label="Filter notifications by category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.status}
            onValueChange={(value) => updateFilters({ status: value as NotificationCenterFilters["status"] })}
          >
            <SelectTrigger aria-label="Filter notifications by read status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="unread">Unread only</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.organizationId ?? "all"}
            onValueChange={(value) => updateFilters({ organizationId: value === "all" ? undefined : value })}
          >
            <SelectTrigger aria-label="Filter notifications by organization">
              <SelectValue placeholder="All organizations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All organizations</SelectItem>
              {organizationsQuery.data?.map((organization) => (
                <SelectItem key={organization.id} value={organization.id}>{organization.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        {!userReady ? (
          <div className="rounded-lg border p-8 text-center" role="status">
            <p className="font-medium">Sign in to view notifications</p>
          </div>
        ) : query.isError ? (
          <div className="rounded-lg border p-8 text-center" role="alert">
            <p className="font-medium">Notifications could not load</p>
            <p className="mt-2 text-sm text-muted-foreground">{getApiErrorMessage(query.error)}</p>
            <Button className="mt-4" onClick={() => query.refetch()} variant="outline">Try again</Button>
          </div>
        ) : (
          <div className="rounded-lg border bg-card shadow-sm">
            <NotificationPanel
              error={false}
              hasMore={Boolean(query.data?.nextCursor)}
              isLoading={query.isLoading}
              items={items}
              onLoadMore={() => {
                if (query.data?.nextCursor) setCursor(query.data.nextCursor)
              }}
              onMarkAllRead={() => markAllMutation.mutate(filters.organizationId)}
              onRetry={() => void query.refetch()}
              onSelect={onSelect}
              onToggleRead={(item) => setReadMutation.mutate({ notificationId: item.id, read: !item.readAt })}
              unreadCount={query.data?.unreadCount ?? 0}
            />
          </div>
        )}
      </div>
    </main>
  )
}
