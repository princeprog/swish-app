import { apiService } from "@/services/api.service";

export type PublicLeagueGame = {
  awayScore: number | null;
  awayTeam: { id: string; name: string };
  competitionKind: string;
  division: { id: string; name: string };
  homeScore: number | null;
  homeTeam: { id: string; name: string };
  id: string;
  liveScoreIsUnofficial: boolean;
  startsAt: string;
  status: "scheduled" | "live" | "final" | "reopened";
  venueName: string;
};

export type PublicLeaguePortal = {
  awards: Array<{
    confirmed_at: string;
    game_id: string;
    player_id: string | null;
    player_name: string;
    team_id: string;
    team_name: string;
  }>;
  bracket: Array<{
    away_team_id: string | null;
    away_team_name: string | null;
    bracket_side: "winners" | "losers" | "finals" | null;
    division_id: string;
    division_name: string;
    home_team_id: string | null;
    home_team_name: string | null;
    id: string;
    is_reset_final: boolean;
    label: string | null;
    position: number;
    round_number: number;
    stage: string;
    status: string;
    winner_team_id: string | null;
    winner_team_name: string | null;
  }>;
  divisions: Array<{
    id: string;
    name: string;
    slug: string;
    teams: Array<{
      color: string | null;
      id: string;
      name: string;
      players: Array<{
        id: string;
        jerseyNumber: string;
        name: string;
      }>;
      slug: string;
    }>;
  }>;
  leaders: Array<{
    assists: string | number;
    player_id: string | null;
    player_name: string;
    points: string | number;
    rebounds: string | number;
    steals: string | number;
    team_id: string;
    team_name: string;
    turnovers: string | number;
  }>;
  organization: { id: string; name: string; slug: string };
  results: PublicLeagueGame[];
  schedule: PublicLeagueGame[];
  season: { id: string; name: string; slug: string };
  standings: Array<{
    division_id: string;
    division_name: string;
    games_played: number;
    losses: number;
    point_differential: number;
    points_against: number;
    points_for: number;
    pool_code: string;
    pool_name: string;
    qualification_status: string;
    rank: number | null;
    ranking_explanation: Array<{ label: string; value: string | number }>;
    team_id: string;
    team_name: string;
    win_percentage: string | number;
    wins: number;
  }>;
};

export const publicLeagueService = {
  getPortal: (organizationSlug: string, seasonSlug: string) =>
    apiService.get<PublicLeaguePortal>(
      `/public/organizations/${encodeURIComponent(organizationSlug)}/seasons/${encodeURIComponent(seasonSlug)}/portal`,
      { authRetry: false, credentials: "omit" },
    ),
};
