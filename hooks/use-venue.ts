"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  venueService,
  type CreateVenuePayload,
  type UpdateVenuePayload,
  type Venue,
} from "@/services/venue.service"

export const VENUE_QUERY_KEYS = {
  list: (organizationId: string) => ["venues", "list", organizationId] as const,
}

export function useVenuesQuery(organizationId?: string) {
  return useQuery({
    enabled: Boolean(organizationId),
    queryFn: () => venueService.list(organizationId!),
    queryKey: VENUE_QUERY_KEYS.list(organizationId ?? "unknown"),
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
