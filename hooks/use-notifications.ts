"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  notificationService,
  type NotificationListQuery,
  type NotificationListResponse,
} from "@/services/notification.service"

export const NOTIFICATION_QUERY_KEYS = {
  list: (query: NotificationListQuery = {}) =>
    ["notifications", "list", query] as const,
  unreadCount: ["notifications", "unread-count"] as const,
} as const

export function useNotificationsQuery(query: NotificationListQuery = {}) {
  return useQuery({
    queryFn: () => notificationService.list(query),
    queryKey: NOTIFICATION_QUERY_KEYS.list(query),
    placeholderData: (previous) => previous,
    staleTime: 15_000,
  })
}

export function useNotificationUnreadCountQuery(enabled = true) {
  return useQuery({
    enabled,
    queryFn: notificationService.unreadCount,
    queryKey: NOTIFICATION_QUERY_KEYS.unreadCount,
    refetchInterval: 60_000,
    staleTime: 15_000,
  })
}

export function useSetNotificationReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ notificationId, read }: { notificationId: string; read: boolean }) =>
      notificationService.setRead(notificationId, read),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["notifications", "list"] }),
        queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.unreadCount }),
      ])
    },
  })
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (organizationId?: string) =>
      notificationService.markAllRead(organizationId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["notifications", "list"] }),
        queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.unreadCount }),
      ])
    },
  })
}

export function useNotificationRealtime(enabled: boolean) {
  const queryClient = useQueryClient()

  React.useEffect(() => {
    if (!enabled || typeof window === "undefined" || !window.EventSource) {
      return
    }

    let closed = false
    let attempts = 0
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    let source: EventSource | undefined

    const invalidate = () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["notifications", "list"] }),
        queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.unreadCount }),
      ])
    }

    const connect = () => {
      if (closed) {
        return
      }

      source = new EventSource(notificationService.streamUrl(), {
        withCredentials: true,
      })
      source.addEventListener("notifications", invalidate)
      source.onopen = () => {
        attempts = 0
        invalidate()
      }
      source.onerror = () => {
        source?.close()
        if (closed) {
          return
        }

        const delay = Math.min(30_000, 1_000 * 2 ** attempts)
        attempts += 1
        retryTimer = setTimeout(connect, delay)
      }
    }

    const onFocus = () => invalidate()
    window.addEventListener("focus", onFocus)
    connect()

    return () => {
      closed = true
      window.removeEventListener("focus", onFocus)
      source?.close()
      if (retryTimer) {
        clearTimeout(retryTimer)
      }
    }
  }, [enabled, queryClient])
}

export function useRecentNotificationsQuery(enabled = true) {
  return useNotificationsQuery({ limit: 8, status: "all" })
}

export type NotificationQueryData = NotificationListResponse
