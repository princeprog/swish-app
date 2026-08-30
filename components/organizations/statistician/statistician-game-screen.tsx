"use client"

import { BarChart3, Loader2, RotateCcw } from "lucide-react"
import { toast } from "sonner"

import { AppSidebar } from "@/components/app-sidebar"
import { WorkspaceHeader } from "@/components/organizations/shared/workspace-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getApiErrorMessage } from "@/hooks/use-auth"
import { useOrganizationsQuery } from "@/hooks/use-organization"
import { useScheduleQuery } from "@/hooks/use-schedule"
import { useStatisticsConsole } from "@/hooks/use-statistics"
import type { StatisticEventType } from "@/services/statistics.service"

const statButtons: Array<{ label: string; type: StatisticEventType; value: number }> = [
  { label: "+1 PT", type: "points", value: 1 },
  { label: "+2 PT", type: "points", value: 2 },
  { label: "+3 PT", type: "points", value: 3 },
  { label: "+REB", type: "rebound", value: 1 },
  { label: "+AST", type: "assist", value: 1 },
  { label: "+STL", type: "steal", value: 1 },
  { label: "+TOV", type: "turnover", value: 1 },
]

export function StatisticianGameScreen({ gameId, slug }: { gameId: string; slug: string }) {
  const organizationsQuery = useOrganizationsQuery()
  const organization = organizationsQuery.data?.find((item) => item.slug === slug)
  const gameQuery = useScheduleQuery(organization?.id, gameId)
  const console = useStatisticsConsole(organization?.id, gameId)
  if (!organization || gameQuery.isLoading || console.query.isLoading) return <main className="p-8">Loading stat sheet…</main>
  const game = gameQuery.data
  const state = console.query.data
  if (!game || !state) return <main className="p-8">This assigned game could not be loaded.</main>
  const scoreFor = (playerId: string) => state.boxScores.find((item) => item.playerId === playerId)
  async function record(playerId: string, type: StatisticEventType, value: number) { try { await console.record.mutateAsync({ playerId, type, value }) } catch (error) { toast.error(getApiErrorMessage(error)) } }
  return <SidebarProvider><AppSidebar organization={{ access: organization.access, name: organization.name, slug, status: organization.status }} /><SidebarInset><WorkspaceHeader organizationAccess={organization.access} organizationName={organization.name} organizationSlug={slug} pageTitle="Stat sheet" /><main className="space-y-6 p-4 lg:p-6"><section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-semibold">{game.home_team_name} vs {game.away_team_name}</h1><p className="text-sm text-muted-foreground">Player points are reconciled with the official score but never change it.</p></div><div className="flex items-center gap-2"><Badge variant="outline">{state.sheet.status}</Badge>{console.controlToken ? <Badge>Control active</Badge> : <Button disabled={console.claim.isPending} onClick={() => console.claim.mutate()}>{console.claim.isPending ? <Loader2 className="animate-spin" /> : <BarChart3 />}Claim control</Button>}</div></section><div className="grid gap-6 xl:grid-cols-2">{[{ id: state.game.homeTeamId, name: game.home_team_name, official: state.game.homeScore }, { id: state.game.awayTeamId, name: game.away_team_name, official: state.game.awayScore }].map((team) => <Card key={team.id}><CardHeader><CardTitle className="flex items-center justify-between"><span>{team.name}</span><span className="text-sm font-normal text-muted-foreground">Player points {state.boxScores.filter((item) => item.teamId === team.id).reduce((sum, item) => sum + item.points, 0)} / Official {team.official ?? "—"}</span></CardTitle></CardHeader><CardContent className="divide-y rounded-md border p-0">{state.roster.filter((player) => player.team_id === team.id).map((player) => { const box = scoreFor(player.id); return <div key={player.id} className="space-y-3 p-3"><div className="flex items-center justify-between gap-3"><p className="font-medium"><span className="mr-2 text-muted-foreground">#{player.jersey_number}</span>{player.name}</p><p className="text-xs text-muted-foreground">{box?.points ?? 0} PTS · {box?.rebounds ?? 0} REB · {box?.assists ?? 0} AST · {box?.steals ?? 0} STL · {box?.turnovers ?? 0} TOV</p></div><div className="flex flex-wrap gap-1.5">{statButtons.map((button) => <Button key={`${button.type}-${button.value}`} size="xs" variant="outline" disabled={!console.controlToken || console.record.isPending || state.sheet.status === "submitted" || state.sheet.status === "finalized"} onClick={() => record(player.id, button.type, button.value)}>{button.label}</Button>)}</div></div> })}</CardContent></Card>)}</div><Card><CardHeader><CardTitle>Recent stat events</CardTitle></CardHeader><CardContent className="space-y-3">{state.events.slice(-10).reverse().map((event) => <div key={event.id} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"><p className="text-sm">{event.type.replaceAll("_", " ")} · {event.value}</p>{!event.reverses_event_id && event.type !== "event.reversed" ? <Button aria-label="Reverse statistic event" size="icon-sm" variant="ghost" disabled={!console.controlToken} onClick={() => console.record.mutate({ reversesEventId: event.id })}><RotateCcw /></Button> : null}</div>)}<Button disabled={!console.controlToken || console.submit.isPending || state.sheet.status === "submitted" || state.sheet.status === "finalized"} onClick={async () => { try { await console.submit.mutateAsync(); toast.success("Stat sheet submitted and reconciled") } catch (error) { toast.error(getApiErrorMessage(error)) } }}>{console.submit.isPending ? <Loader2 className="animate-spin" /> : null}Submit stat sheet</Button></CardContent></Card></main></SidebarInset></SidebarProvider>
}
