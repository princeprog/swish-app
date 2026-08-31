"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  scheduleService,
  type CreateSchedulePayload,
  type FinalizeScheduleGamePayload,
  type Schedule,
  type ScheduleListQuery,
  type ScorekeeperOption,
  type StatisticianOption,
  type UpdateScorekeeperAssignmentPayload,
  type UpdateStatisticianAssignmentPayload,
  type UpdateSchedulePayload,
} from "@/services/schedule.service";
import { STANDINGS_QUERY_KEYS } from "@/hooks/use-standings";

export const SCHEDULE_QUERY_KEYS = {
  all: (organizationId: string) =>
    ["schedules", "list", organizationId] as const,
  detail: (organizationId: string, scheduleId: string) =>
    ["schedules", "detail", organizationId, scheduleId] as const,
  list: (organizationId: string, query?: ScheduleListQuery) =>
    [...SCHEDULE_QUERY_KEYS.all(organizationId), query ?? {}] as const,
  scorekeepers: (organizationId: string) =>
    ["schedules", "scorekeepers", organizationId] as const,
  statisticians: (organizationId: string) =>
    ["schedules", "statisticians", organizationId] as const,
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

export function useScorekeepersQuery(organizationId?: string, enabled = true) {
  return useQuery({
    enabled: Boolean(organizationId && enabled),
    queryFn: () => scheduleService.listScorekeepers(organizationId!),
    queryKey: SCHEDULE_QUERY_KEYS.scorekeepers(organizationId ?? "unknown"),
    retry: false,
  });
}

export function useStatisticiansQuery(organizationId?: string, enabled = true) {
  return useQuery({
    enabled: Boolean(organizationId && enabled),
    queryFn: () => scheduleService.listStatisticians(organizationId!),
    queryKey: SCHEDULE_QUERY_KEYS.statisticians(organizationId ?? "unknown"),
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

export function useArchiveScheduleMutation(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation<Schedule, unknown, string>({
    mutationFn: (scheduleId) =>
      scheduleService.archive(organizationId, scheduleId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: SCHEDULE_QUERY_KEYS.all(organizationId),
      });
    },
  });
}

export function useFinalizeScheduleGameMutation(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    Schedule,
    unknown,
    { payload: FinalizeScheduleGamePayload; scheduleId: string }
  >({
    mutationFn: ({ payload, scheduleId }) =>
      scheduleService.finalize(organizationId, scheduleId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: SCHEDULE_QUERY_KEYS.all(organizationId),
        }),
        queryClient.invalidateQueries({
          queryKey: STANDINGS_QUERY_KEYS.all(organizationId),
        }),
      ]);
    },
  });
}

export function useUpdateScorekeeperAssignmentMutation(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    Schedule,
    unknown,
    { payload: UpdateScorekeeperAssignmentPayload; scheduleId: string }
  >({
    mutationFn: ({ payload, scheduleId }) =>
      scheduleService.updateScorekeeper(organizationId, scheduleId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: SCHEDULE_QUERY_KEYS.all(organizationId),
      });
    },
  });
}

export function useUpdateStatisticianAssignmentMutation(
  organizationId: string,
) {
  const queryClient = useQueryClient();

  return useMutation<
    Schedule,
    unknown,
    { payload: UpdateStatisticianAssignmentPayload; scheduleId: string }
  >({
    mutationFn: ({ payload, scheduleId }) =>
      scheduleService.updateStatistician(organizationId, scheduleId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: SCHEDULE_QUERY_KEYS.all(organizationId),
      });
    },
  });
}

export type { ScorekeeperOption, StatisticianOption };
