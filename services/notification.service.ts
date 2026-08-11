import { API_BASE_URL, API_ENDPOINTS } from "@/constants/api-config"
import { apiService } from "@/services/api.service"

export type NotificationCategory =
  | "access"
  | "roster"
  | "schedule"
  | "scoring"
  | "competition"
  | "compliance"

export type NotificationPriority =
  | "action_required"
  | "important"
  | "informational"

export type NotificationItem = {
  actionExpiresAt: string | null
  actionUrl: string | null
  body: string
  category: NotificationCategory
  createdAt: string
  eventType: string
  id: string
  organization: {
    id: string
    name: string
    slug: string
  } | null
  priority: NotificationPriority
  readAt: string | null
  resource: {
    id: string
    type: string
  } | null
  title: string
}

export type NotificationListResponse = {
  items: NotificationItem[]
  nextCursor: string | null
  unreadCount: number
}

export type NotificationListQuery = {
  category?: NotificationCategory
  cursor?: string
  limit?: number
  organizationId?: string
  status?: "all" | "unread"
}

export const notificationService = {
  list: (query: NotificationListQuery = {}) =>
    apiService.get<NotificationListResponse>(API_ENDPOINTS.notifications.list, {
      credentials: "include",
      query,
    }),
  unreadCount: () =>
    apiService.get<{ count: number }>(API_ENDPOINTS.notifications.unreadCount, {
      credentials: "include",
    }),
  setRead: (notificationId: string, read: boolean) =>
    apiService.patch<{ id: string; read: boolean }, { read: boolean }>(
      API_ENDPOINTS.notifications.read(notificationId),
      { read },
      { credentials: "include" },
    ),
  markAllRead: (organizationId?: string) =>
    apiService.post<{ updatedCount: number }, { organizationId?: string }>(
      API_ENDPOINTS.notifications.readAll,
      organizationId ? { organizationId } : {},
      { credentials: "include" },
    ),
  invitationPreview: (invitationId: string) =>
    apiService.get<{
      email: string
      expires_at: string
      id: string
      organization: { name: string; slug: string }
      role: string
      status: string
      teamAssignments: unknown[]
    }>(API_ENDPOINTS.invitations.byId(invitationId), {
      credentials: "include",
    }),
  acceptInvitation: (invitationId: string) =>
    apiService.post<{ membershipId?: string; success: boolean }>(
      API_ENDPOINTS.invitations.acceptById(invitationId),
      undefined,
      { credentials: "include" },
    ),
  streamUrl: () =>
    `${API_BASE_URL.replace(/\/$/, "")}${API_ENDPOINTS.notifications.stream}`,
}
