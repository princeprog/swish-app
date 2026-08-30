import { ArrowRight, Trophy } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { CompetitionMatchup } from "@/services/competition.service"
import type { Team } from "@/services/team.service"

function teamLabel(teamId: string | null, sourceRef: string | null, teams: Team[]) {
  if (teamId) return teams.find((team) => team.id === teamId)?.name ?? "Team"
  return sourceRef ?? "To be determined"
}

function BracketSection({
  matchups,
  teams,
  title,
}: {
  matchups: CompetitionMatchup[]
  teams: Team[]
  title: string
}) {
  const rounds = [...new Set(matchups.map((matchup) => matchup.round_number))]
  return (
    <section className="space-y-3" aria-label={title}>
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </h3>
      <div className="overflow-x-auto pb-3">
        <div
          className="grid min-w-max gap-8"
          style={{ gridTemplateColumns: `repeat(${rounds.length}, minmax(240px, 1fr))` }}
        >
          {rounds.map((round, roundIndex) => (
            <div key={round} className="flex min-w-60 flex-col gap-4">
              <p className="text-xs font-medium text-muted-foreground">
                Round {round}
              </p>
              <div className="flex flex-1 flex-col justify-around gap-4">
                {matchups
                  .filter((matchup) => matchup.round_number === round)
                  .sort((left, right) => left.position - right.position)
                  .map((matchup) => (
                    <div key={matchup.id} className="relative rounded-lg border bg-card shadow-sm">
                      {roundIndex < rounds.length - 1 ? (
                        <ArrowRight
                          aria-hidden
                          className="absolute -right-6 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                        />
                      ) : null}
                      <div className="flex items-center justify-between border-b px-3 py-2">
                        <span className="text-xs font-medium">
                          {matchup.label ?? `Match ${matchup.position}`}
                        </span>
                        <Badge variant={matchup.status === "final" ? "default" : "outline"}>
                          {matchup.status === "ready" ? "Needs scheduling" : matchup.status}
                        </Badge>
                      </div>
                      <div className="divide-y text-sm">
                        <div className="flex min-h-10 items-center justify-between gap-3 px-3 py-2">
                          <span>{teamLabel(matchup.home_team_id, matchup.home_source_ref, teams)}</span>
                          {matchup.winner_team_id === matchup.home_team_id ? <Trophy className="size-4" /> : null}
                        </div>
                        <div className="flex min-h-10 items-center justify-between gap-3 px-3 py-2">
                          <span>{teamLabel(matchup.away_team_id, matchup.away_source_ref, teams)}</span>
                          {matchup.winner_team_id === matchup.away_team_id ? <Trophy className="size-4" /> : null}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function CompetitionBracket({
  matchups,
  teams,
}: {
  matchups: CompetitionMatchup[]
  teams: Team[]
}) {
  if (matchups.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Generate and lock the competition format to see the playoff bracket.
      </div>
    )
  }
  const sections = [
    ["winners", "Winners bracket"],
    ["losers", "Losers bracket"],
    ["finals", "Finals"],
  ] as const
  return (
    <div className="space-y-8">
      {sections.map(([side, title]) => {
        const sideMatchups = matchups.filter((matchup) => matchup.bracket_side === side)
        return sideMatchups.length ? (
          <BracketSection key={side} matchups={sideMatchups} teams={teams} title={title} />
        ) : null
      })}
    </div>
  )
}
