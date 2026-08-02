"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Trophy } from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { WorkspaceHeader } from "@/components/organizations/shared/workspace-header"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import type { Division } from "@/services/division.service"
import type { LeagueSeason } from "@/services/league-season.service"
import type { Organization } from "@/services/organization.service"
import type { StandingsRow } from "@/services/standings.service"

type OrganizationStandingsViewProps = {
  divisions: Division[]
  initialSeasonId: string
  organization: Organization
  seasons: LeagueSeason[]
}

const NO_SEASON_VALUE = "no-seasons"

function formatDifferential(value: number) {
  if (value > 0) return `+${value}`
  return String(value)
}

function formatWinPercentage(value: number) {
  return value.toFixed(3)
}

function StandingsTable({
  filters,
  rows,
}: {
  filters: React.ReactNode
  rows: StandingsRow[]
}) {
  const header = (
    <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1.5">
        <CardTitle>Official standings</CardTitle>
        <CardDescription>
          Calculated from finalized games with recorded scores.
        </CardDescription>
      </div>
      {filters}
    </CardHeader>
  )

  if (rows.length === 0) {
    return (
      <Card className="border border-border/60 bg-card/95 shadow-none">
        {header}
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
    <Card className="border border-border/60 bg-card/95 shadow-none">
      {header}
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">Rank</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Division</TableHead>
              <TableHead className="text-right">W</TableHead>
              <TableHead className="text-right">L</TableHead>
              <TableHead className="text-right">GP</TableHead>
              <TableHead className="text-right">PF</TableHead>
              <TableHead className="text-right">PA</TableHead>
              <TableHead className="text-right">Diff</TableHead>
              <TableHead className="text-right">Win%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.teamId}>
                <TableCell className="font-medium">{row.rank}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full border"
                      style={{ backgroundColor: row.teamColor ?? "transparent" }}
                    />
                    <span className="font-medium">{row.teamName}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{row.divisionName}</Badge>
                </TableCell>
                <TableCell className="text-right font-medium">{row.wins}</TableCell>
                <TableCell className="text-right">{row.losses}</TableCell>
                <TableCell className="text-right">{row.gamesPlayed}</TableCell>
                <TableCell className="text-right">{row.pointsFor}</TableCell>
                <TableCell className="text-right">{row.pointsAgainst}</TableCell>
                <TableCell className="text-right">
                  {formatDifferential(row.pointDifferential)}
                </TableCell>
                <TableCell className="text-right">
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
    <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto md:justify-end">
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
          aria-label="Filter standings by season"
          className="w-full sm:w-[220px]"
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
      <Select
        value={selectedDivisionId}
        onValueChange={(value) => setFilter({ divisionId: value })}
      >
        <SelectTrigger
          aria-label="Filter standings by division"
          className="w-full sm:w-[180px]"
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

        <main className="flex flex-1 flex-col gap-6 bg-background px-4 py-4 lg:px-6 lg:py-5">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/organizations">Organizations</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/organizations/${organization.slug}`}>
                  {organization.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Standings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <section className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Competition</p>
              <h1 className="text-3xl font-semibold tracking-tight">Standings</h1>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Track official team records from finalized games in a selected
                season and division.
              </p>
            </div>
          </section>

          {seasons.length === 0 ? (
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
          ) : standingsQuery.isLoading ? (
            <Card className="h-[420px] border border-border/60 bg-card/95 shadow-none" />
          ) : standingsQuery.isError ? (
            <Empty className="border border-dashed bg-card/70">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Trophy className="size-5" />
                </EmptyMedia>
                <EmptyTitle>We couldn't load standings</EmptyTitle>
                <EmptyDescription>
                  {getApiErrorMessage(standingsQuery.error)}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <StandingsTable filters={standingsFilters} rows={rows} />
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
