"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  scheduleService,
  type CreateSchedulePayload,
  type Schedule,
  type UpdateSchedulePayload,
} from "@/services/schedule.service"

export const SCHEDULE_QUERY_KEYS = {
  list: (organizationId: string) => ["schedules", "list", organizationId] as const,
}

export function useSchedulesQuery(organizationId?: string) {
  return useQuery({
    enabled: Boolean(organizationId),
    queryFn: () => scheduleService.list(organizationId!),
    queryKey: SCHEDULE_QUERY_KEYS.list(organizationId ?? "unknown"),
    retry: false,
  })
}

export function useCreateScheduleMutation(organizationId: string) {
  const queryClient = useQueryClient()

  return useMutation<Schedule, unknown, CreateSchedulePayload>({
    mutationFn: (payload) => scheduleService.create(organizationId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: SCHEDULE_QUERY_KEYS.list(organizationId),
      })
    },
  })
}

export function useUpdateScheduleMutation(organizationId: string) {
  const queryClient = useQueryClient()

  return useMutation<
    Schedule,
    unknown,
    { payload: UpdateSchedulePayload; scheduleId: string }
  >({
    mutationFn: ({ payload, scheduleId }) =>
      scheduleService.update(organizationId, scheduleId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: SCHEDULE_QUERY_KEYS.list(organizationId),
      })
    },
  })
}

export function useDeleteScheduleMutation(organizationId: string) {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, string>({
    mutationFn: (scheduleId) => scheduleService.remove(organizationId, scheduleId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: SCHEDULE_QUERY_KEYS.list(organizationId),
      })
    },
  })
}
