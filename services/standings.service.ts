import { API_ENDPOINTS } from "@/constants/api-config"
import { apiService } from "@/services/api.service"

export type StandingsParams = {
  divisionId?: string
  leagueSeasonId: string
}

export type StandingsRow = {
  divisionId: string
  divisionName: string
  gamesPlayed: number
  losses: number
  pointDifferential: number
  pointsAgainst: number
  pointsFor: number
  rank: number
  teamColor: string | null
  teamId: string
  teamName: string
  winPercentage: number
  wins: number
}

export type StandingsResponse = {
  finalizedGamesCount: number
  rows: StandingsRow[]
}

export const standingsService = {
  list: (organizationId: string, params: StandingsParams) =>
    apiService.get<StandingsResponse>(API_ENDPOINTS.standings.list(organizationId), {
      credentials: "include",
      query: params,
    }),
}
