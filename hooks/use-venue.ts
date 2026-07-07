"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  venueService,
  type CreateVenuePayload,
  type UpdateVenuePayload,
  type Venue,
} from "@/services/venue.service"
import type { PaginationParams } from "@/services/pagination"

export const VENUE_QUERY_KEYS = {
  list: (organizationId: string) => ["venues", "list", organizationId] as const,
  listWithParams: (organizationId: string, params: PaginationParams) =>
    ["venues", "list", organizationId, params] as const,
}

export function useVenuesQuery(
  organizationId?: string,
  params: PaginationParams = {},
) {
  return useQuery({
    enabled: Boolean(organizationId),
    queryFn: () => venueService.list(organizationId!, params),
    queryKey: VENUE_QUERY_KEYS.listWithParams(organizationId ?? "unknown", params),
    retry: false,
  })
}

export function useCreateVenueMutation(organizationId: string) {
  const queryClient = useQueryClient()

  return useMutation<Venue, unknown, CreateVenuePayload>({
    mutationFn: (payload) => venueService.create(organizationId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: VENUE_QUERY_KEYS.list(organizationId),
      })
    },
  })
}

export function useUpdateVenueMutation(organizationId: string) {
  const queryClient = useQueryClient()

  return useMutation<
    Venue,
    unknown,
    { payload: UpdateVenuePayload; venueId: string }
  >({
    mutationFn: ({ payload, venueId }) =>
      venueService.update(organizationId, venueId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: VENUE_QUERY_KEYS.list(organizationId),
      })
    },
  })
}

export function useDeleteVenueMutation(organizationId: string) {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, string>({
    mutationFn: (venueId) => venueService.remove(organizationId, venueId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: VENUE_QUERY_KEYS.list(organizationId),
      })
    },
  })
}
