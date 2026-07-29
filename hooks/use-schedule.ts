"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  scheduleService,
  type CreateSchedulePayload,
  type Schedule,
  type ScheduleListQuery,
  type UpdateSchedulePayload,
} from "@/services/schedule.service";

export const SCHEDULE_QUERY_KEYS = {
  all: (organizationId: string) =>
    ["schedules", "list", organizationId] as const,
  detail: (organizationId: string, scheduleId: string) =>
    ["schedules", "detail", organizationId, scheduleId] as const,
  list: (organizationId: string, query?: ScheduleListQuery) =>
    [...SCHEDULE_QUERY_KEYS.all(organizationId), query ?? {}] as const,
};

export function useSchedulesQuery(
  organizationId?: string,
  query?: ScheduleListQuery,
) {
  return useQuery({
    enabled: Boolean(organizationId),
    placeholderData: (previousData) => previousData,
    queryFn: () => scheduleService.list(organizationId!, query),
    queryKey: SCHEDULE_QUERY_KEYS.list(organizationId ?? "unknown", query),
    retry: false,
  });
}

export function useScheduleQuery(organizationId?: string, scheduleId?: string) {
  return useQuery({
    enabled: Boolean(organizationId && scheduleId),
    queryFn: () => scheduleService.get(organizationId!, scheduleId!),
    queryKey: SCHEDULE_QUERY_KEYS.detail(
      organizationId ?? "unknown",
      scheduleId ?? "unknown",
    ),
    retry: false,
  });
}

export function useCreateScheduleMutation(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation<Schedule, unknown, CreateSchedulePayload>({
    mutationFn: (payload) => scheduleService.create(organizationId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: SCHEDULE_QUERY_KEYS.all(organizationId),
      });
    },
  });
}

export function useUpdateScheduleMutation(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    Schedule,
    unknown,
    { payload: UpdateSchedulePayload; scheduleId: string }
  >({
    mutationFn: ({ payload, scheduleId }) =>
      scheduleService.update(organizationId, scheduleId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: SCHEDULE_QUERY_KEYS.all(organizationId),
      });
    },
  });
}

export function useDeleteScheduleMutation(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, string>({
    mutationFn: (scheduleId) =>
      scheduleService.remove(organizationId, scheduleId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: SCHEDULE_QUERY_KEYS.all(organizationId),
      });
    },
  });
}
