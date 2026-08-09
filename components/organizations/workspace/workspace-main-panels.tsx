"use client"

import { ChevronRight, CircleDot, Trophy } from "lucide-react"

import {
  ComponentReveal,
  RevealGroup,
} from "@/components/motion/page-motion"
import {
  workspaceActivity,
  workspaceDivisions,
  workspaceUpcomingGames,
  type Activity,
  type Division,
  type UpcomingGame,
} from "@/components/organizations/workspace/organization-workspace-data"
import { cx, statusClasses } from "@/components/organizations/workspace/organization-workspace-utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function ActiveSeasonCard() {
  return (
    <Card className="border border-border/60 bg-card/95 shadow-none">
      <CardHeader>
        <CardTitle>Current active season</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl border border-border/70 bg-background/70">
              <Trophy className="size-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                2026 Summer Cup
              </h2>
              <p className="text-sm text-muted-foreground">
                Registration open until May 31, 2026
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border/60 bg-background/50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Date range
              </p>
              <p className="mt-2 text-sm font-medium">
                May 1, 2026 - Aug 31, 2026
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Current phase
              </p>
              <div className="mt-2 inline-flex rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-300">
                Regular Season
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline">
            Manage season
          </Button>
          <Button size="sm" variant="outline">
            Open schedule
          </Button>
          <Button size="sm" variant="outline">
            View standings
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function DivisionOverviewCard({ divisions }: { divisions: Division[] }) {
  return (
    <Card className="border border-border/60 bg-card/95 py-0 shadow-none">
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="w-12 px-4">
                <Checkbox aria-label="Select all divisions" />
              </TableHead>
              <TableHead className="h-12 text-muted-foreground">Division</TableHead>
              <TableHead className="text-muted-foreground">Teams</TableHead>
              <TableHead className="text-muted-foreground">Games</TableHead>
              <TableHead className="text-muted-foreground">Standings</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {divisions.map((division) => (
              <TableRow
                key={division.name}
                className="h-16 border-border/60 hover:bg-muted/30"
              >
                <TableCell className="px-4">
                  <Checkbox aria-label={`Select ${division.name}`} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <span
                      className={cx(
                        "size-2.5 rounded-full",
                        division.tone === "live" ? "bg-emerald-400" : "bg-amber-400",
                      )}
                    />
                    <span className="font-medium">{division.name}</span>
                  </div>
                </TableCell>
                <TableCell>{division.teams}</TableCell>
                <TableCell>{division.games}</TableCell>
                <TableCell>
                  <Badge className={statusClasses(division.tone)} variant="outline">
                    {division.standingsStatus}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost">
                    View
                    <ChevronRight className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function RecentActivityCard({ activity }: { activity: Activity[] }) {
  return (
    <Card className="border border-border/60 bg-card/95 shadow-none">
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activity.map((entry) => (
          <div
            key={`${entry.title}-${entry.time}`}
            className="rounded-lg border border-border/50 bg-background/50 px-4 py-3"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full border border-border/60 p-1.5 text-muted-foreground">
                <CircleDot className="size-3" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{entry.title}</p>
                  <p className="text-xs text-muted-foreground">{entry.time}</p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {entry.detail}
                </p>
              </div>
            </div>
          </div>
        ))}
        <Button variant="ghost" className="w-full">
          View all activity
        </Button>
      </CardContent>
    </Card>
  )
}

function UpcomingGamesCard({ games }: { games: UpcomingGame[] }) {
  return (
    <Card className="border border-border/60 bg-card/95 py-0 shadow-none">
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="w-12 px-4">
                <Checkbox aria-label="Select all upcoming games" />
              </TableHead>
              <TableHead className="h-12 text-muted-foreground">Date & time</TableHead>
              <TableHead className="text-muted-foreground">Matchup</TableHead>
              <TableHead className="text-muted-foreground">Venue</TableHead>
              <TableHead className="text-muted-foreground">Division</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {games.map((game) => (
              <TableRow
                key={`${game.date}-${game.home}-${game.away}`}
                className="h-16 border-border/60 hover:bg-muted/30"
              >
                <TableCell className="px-4">
                  <Checkbox aria-label={`Select ${game.home} vs ${game.away}`} />
                </TableCell>
                <TableCell className="whitespace-normal">
                  <div className="flex flex-col gap-1">
                    <div className="font-medium">{game.date}</div>
                  </div>
                </TableCell>
                <TableCell className="whitespace-normal">
                  <div className="flex flex-col gap-1">
                    <div className="font-medium">{game.home}</div>
                    <div className="text-muted-foreground">vs {game.away}</div>
                  </div>
                </TableCell>
                <TableCell>{game.venue}</TableCell>
                <TableCell>{game.division}</TableCell>
                <TableCell>
                  <Badge className="border-blue-500/20 bg-blue-500/10 text-blue-300" variant="outline">
                    {game.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="pt-4">
          <Button variant="ghost" className="w-full">
            View all games
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function WorkspaceMainPanels() {
  return (
    <RevealGroup className="grid gap-6">
      <ComponentReveal asChild>
        <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.82fr)_minmax(0,1.18fr)]">
          <ActiveSeasonCard />
          <DivisionOverviewCard divisions={workspaceDivisions} />
        </div>
      </ComponentReveal>

      <ComponentReveal asChild>
        <div className="grid gap-6 xl:grid-cols-[minmax(280px,0.7fr)_minmax(0,1.3fr)]">
          <RecentActivityCard activity={workspaceActivity} />
          <UpcomingGamesCard games={workspaceUpcomingGames} />
        </div>
      </ComponentReveal>
    </RevealGroup>
  )
}
