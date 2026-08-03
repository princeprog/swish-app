"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  playerService,
  type CreatePlayerPayload,
  type Player,
  type PlayerListParams,
  type UpdatePlayerPayload,
} from "@/services/player.service"

export const PLAYER_QUERY_KEYS = {
  list: (organizationId: string) => ["players", "list", organizationId] as const,
  listWithParams: (organizationId: string, params: PlayerListParams) =>
    ["players", "list", organizationId, params] as const,
}

export function usePlayersQuery(
  organizationId?: string,
  params: PlayerListParams = {},
) {
  return useQuery({
    enabled: Boolean(organizationId),
    placeholderData: (previousData) => previousData,
    queryFn: () => playerService.list(organizationId!, params),
    queryKey: PLAYER_QUERY_KEYS.listWithParams(organizationId ?? "unknown", params),
    retry: false,
  })
}

export function useCreatePlayerMutation(organizationId: string) {
  const queryClient = useQueryClient()

  return useMutation<Player, unknown, CreatePlayerPayload>({
    mutationFn: (payload) => playerService.create(organizationId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: PLAYER_QUERY_KEYS.list(organizationId),
      })
    },
  })
}

export function useUpdatePlayerMutation(organizationId: string) {
  const queryClient = useQueryClient()

  return useMutation<
    Player,
    unknown,
    { payload: UpdatePlayerPayload; playerId: string }
  >({
    mutationFn: ({ payload, playerId }) =>
      playerService.update(organizationId, playerId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: PLAYER_QUERY_KEYS.list(organizationId),
      })
    },
  })
}

export function useDeletePlayerMutation(organizationId: string) {
  const queryClient = useQueryClient()

  return useMutation<void, unknown, string>({
    mutationFn: (playerId) => playerService.remove(organizationId, playerId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: PLAYER_QUERY_KEYS.list(organizationId),
      })
    },
  })
}
