import type {
  NotificationCategory,
  NotificationListQuery,
} from "@/services/notification.service"

export type NotificationCenterFilters = {
  category: NotificationCategory | "all"
  organizationId?: string
  status: "all" | "unread"
}

export function buildNotificationQuery(
  filters: NotificationCenterFilters,
  cursor?: string | null,
): NotificationListQuery {
  return {
    category: filters.category === "all" ? undefined : filters.category,
    cursor: cursor ?? undefined,
    limit: 20,
    organizationId: filters.organizationId || undefined,
    status: filters.status,
  }
}
