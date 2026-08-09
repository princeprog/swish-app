"use client"

import { useMeQuery } from "@/hooks/use-auth"
import { useNotificationRealtime } from "@/hooks/use-notifications"

export function NotificationRealtime() {
  const meQuery = useMeQuery()
  useNotificationRealtime(Boolean(meQuery.data?.user))
  return null
}
