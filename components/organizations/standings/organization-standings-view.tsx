"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Trophy } from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import {
  ComponentReveal,
  PageEntrance,
  RevealGroup,
} from "@/components/motion/page-motion"
import { WorkspaceHeader } from "@/components/organizations/shared/workspace-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getApiErrorMessage } from "@/hooks/use-auth"
import { useStandingsQuery } from "@/hooks/use-standings"
import { cn } from "@/lib/utils"
import type { Division } from "@/services/division.service"
import type { LeagueSeason } from "@/services/league-season.service"
import type { Organization } from "@/services/organization.service"
import type { StandingsRow } from "@/services/standings.service"
import { StandingRankBadge } from "./standing-rank-badge"

type OrganizationStandingsViewProps = {
  divisions: Division[]
  initialSeasonId: string
  organization: Organization
  seasons: LeagueSeason[]
}

const NO_SEASON_VALUE = "no-seasons"

const podiumLabels: Record<number, string> = {
  1: "League leader",
  2: "Second place",
  3: "Third place",
}

function formatWinPercentage(value: number) {
  return value.toFixed(3)
}

function RecentResultsForm({
  recentResults,
}: {
  recentResults: StandingsRow["recentResults"]
}) {
  if (recentResults.length === 0) {
    return <span className="text-muted-foreground">-</span>
  }

  return (
    <div
      aria-label={`Recent form ${recentResults.join("")}`}
      className="flex justify-end gap-1"
    >
      {recentResults.map((result, index) => (
        <span
          key={`${result}-${index}`}
          className={cn(
            "inline-flex size-5 items-center justify-center rounded-sm text-[11px] font-semibold text-white",
            result === "W" ? "bg-emerald-600" : "bg-red-600",
          )}
        >
          {result}
        </span>
      ))}
    </div>
  )
}

export function StandingsTable({ rows }: { rows: StandingsRow[] }) {
  if (rows.length === 0) {
    return (
      <Card className="border border-border/60 bg-card/95 shadow-none">
        <CardContent>
          <Empty className="border border-dashed bg-card/70">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Trophy className="size-5" />
              </EmptyMedia>
              <EmptyTitle>No teams in this season</EmptyTitle>
              <EmptyDescription>
                Add teams to this season before standings can be displayed.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-border/60 bg-card/95 py-0 shadow-none">
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="w-20 px-4 text-muted-foreground">Rank</TableHead>
              <TableHead className="h-12 text-muted-foreground">Team</TableHead>
              <TableHead className="text-muted-foreground">Division</TableHead>
              <TableHead className="text-right text-muted-foreground">W</TableHead>
              <TableHead className="text-right text-muted-foreground">L</TableHead>
              <TableHead className="text-right text-muted-foreground">GP</TableHead>
              <TableHead className="text-right text-muted-foreground">Last 5</TableHead>
              <TableHead className="pr-4 text-right text-muted-foreground">Win%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.teamId}
                className={cn(
                  "border-border/60 hover:bg-muted/30",
                  row.rank === 1
                    ? "h-24 bg-muted/20"
                    : row.rank === 2
                      ? "h-20 bg-muted/15"
                      : row.rank === 3
                        ? "h-18 bg-muted/10"
                        : "h-16",
                )}
              >
                <TableCell className="px-4">
                  <StandingRankBadge rank={row.rank} />
                </TableCell>
                <TableCell className="whitespace-normal">
                  <div className="flex items-center gap-3">
                    <span
                      className="size-2.5 rounded-full border"
                      style={{ backgroundColor: row.teamColor ?? "transparent" }}
                    />
                    <div className="flex flex-col gap-1">
                      <span
                        className={cn(
                          "font-medium",
                          row.rank === 1
                            ? "text-lg"
                            : row.rank === 2
                              ? "text-base"
                              : "text-sm",
                        )}
                      >
                        {row.teamName}
                      </span>
                      {row.unresolvedTieKey ? (
                        <span className="text-xs text-amber-300">
                          Awaiting a league decision to break this tie
                        </span>
                      ) : row.rank !== null && row.rank <= 3 ? (
                        <span className="text-xs text-muted-foreground">
                          {podiumLabels[row.rank]}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{row.divisionName}</Badge>
                </TableCell>
                <TableCell className="text-right font-medium">{row.wins}</TableCell>
                <TableCell className="text-right">{row.losses}</TableCell>
                <TableCell className="text-right">{row.gamesPlayed}</TableCell>
                <TableCell className="text-right">
                  <RecentResultsForm recentResults={row.recentResults} />
                </TableCell>
                <TableCell className="pr-4 text-right">
                  {formatWinPercentage(row.winPercentage)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export function OrganizationStandingsView({
  divisions,
  initialSeasonId,
  organization,
  seasons,
}: OrganizationStandingsViewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const seasonParam = searchParams.get("seasonId")
  const selectedSeasonId =
    seasons.find((season) => season.id === seasonParam)?.id ?? initialSeasonId
  const seasonDivisions = React.useMemo(
    () => divisions.filter((division) => division.league_season_id === selectedSeasonId),
    [divisions, selectedSeasonId],
  )
  const divisionParam = searchParams.get("divisionId")
  const selectedDivisionId =
    seasonDivisions.find((division) => division.id === divisionParam)?.id ?? "all"
  const standingsQuery = useStandingsQuery(
    organization.id,
    selectedSeasonId
      ? {
          divisionId: selectedDivisionId === "all" ? undefined : selectedDivisionId,
          leagueSeasonId: selectedSeasonId,
        }
      : undefined,
  )
  const standings = standingsQuery.data
  const rows = standings?.rows ?? []

  function setFilter(updates: { divisionId?: string; seasonId?: string }) {
    const params = new URLSearchParams(searchParams.toString())

    if (updates.seasonId !== undefined) {
      params.set("seasonId", updates.seasonId)
      params.delete("divisionId")
    }

    if (updates.divisionId !== undefined) {
      if (updates.divisionId === "all") {
        params.delete("divisionId")
      } else {
        params.set("divisionId", updates.divisionId)
      }
    }

    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  const standingsFilters = (
    <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-[220px_180px]">
      <div className="space-y-1.5">
        <label
          htmlFor="standings-season-filter"
          className="text-xs font-medium text-muted-foreground"
        >
          Season
        </label>
        <Select
          disabled={seasons.length === 0}
          value={selectedSeasonId || NO_SEASON_VALUE}
          onValueChange={(value) => {
            if (value !== NO_SEASON_VALUE) {
              setFilter({ seasonId: value })
            }
          }}
        >
          <SelectTrigger
            id="standings-season-filter"
            aria-label="Filter standings by season"
            className="w-full"
          >
            <SelectValue placeholder="Select season" />
          </SelectTrigger>
          <SelectContent position="popper" align="end">
            {seasons.length === 0 ? (
              <SelectItem value={NO_SEASON_VALUE}>No seasons</SelectItem>
            ) : null}
            {seasons.map((season) => (
              <SelectItem key={season.id} value={season.id}>
                {season.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <label
          htmlFor="standings-division-filter"
          className="text-xs font-medium text-muted-foreground"
        >
          Division
        </label>
        <Select
          value={selectedDivisionId}
          onValueChange={(value) => setFilter({ divisionId: value })}
        >
          <SelectTrigger
            id="standings-division-filter"
            aria-label="Filter standings by division"
            className="w-full"
          >
            <SelectValue placeholder="All divisions" />
          </SelectTrigger>
          <SelectContent position="popper" align="end">
            <SelectItem value="all">All divisions</SelectItem>
            {seasonDivisions.map((division) => (
              <SelectItem key={division.id} value={division.id}>
                {division.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  return (
    <SidebarProvider>
      <AppSidebar
        organization={{
          access: organization.access,
          name: organization.name,
          slug: organization.slug,
          status: organization.status,
        }}
      />
      <SidebarInset>
        <WorkspaceHeader
          
          organizationAccess={organization.access}
          organizationName={organization.name}
          organizationSlug={organization.slug}
          pageTitle="Standings"
        />

        <PageEntrance asChild>
          <main className="flex flex-1 flex-col gap-6 bg-background px-4 py-4 lg:px-6 lg:py-5">
            <RevealGroup className="contents">
              <ComponentReveal asChild>
                <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="space-y-2">
                    <h1 className="text-3xl font-semibold tracking-tight">
                      Standings
                    </h1>
                  </div>
                  {standingsFilters}
                </section>
              </ComponentReveal>

              {seasons.length === 0 ? (
                <ComponentReveal>
                  <Empty className="border border-dashed bg-card/70">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Trophy className="size-5" />
                      </EmptyMedia>
                      <EmptyTitle>Create a season first</EmptyTitle>
                      <EmptyDescription>
                        Standings are grouped by season, so create one before reading
                        official records.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </ComponentReveal>
              ) : standingsQuery.isLoading ? (
                <ComponentReveal asChild>
                  <Card className="h-[420px] border border-border/60 bg-card/95 shadow-none" />
                </ComponentReveal>
              ) : standingsQuery.isError ? (
                <ComponentReveal>
                  <Empty className="border border-dashed bg-card/70">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Trophy className="size-5" />
                      </EmptyMedia>
                      <EmptyTitle>We couldn’t load standings</EmptyTitle>
                      <EmptyDescription>
                        {getApiErrorMessage(standingsQuery.error)}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </ComponentReveal>
              ) : (
                <ComponentReveal>
                  <StandingsTable rows={rows} />
                </ComponentReveal>
              )}
            </RevealGroup>
          </main>
        </PageEntrance>
      </SidebarInset>
    </SidebarProvider>
  )
}
