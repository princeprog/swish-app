"use client"

import * as React from "react"
import { ArrowDown, ArrowUp, CalendarPlus, Loader2, Lock, RotateCcw, Settings2, Trophy } from "lucide-react"
import { toast } from "sonner"

import { AppSidebar } from "@/components/app-sidebar"
import { CompetitionBracket } from "@/components/organizations/competition/competition-bracket"
import { WorkspaceHeader } from "@/components/organizations/shared/workspace-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { getApiErrorMessage } from "@/hooks/use-auth"
import {
  useCompetitionWorkspaceQuery,
  useGenerateCompetitionMutation,
  useRecordTieDecisionMutation,
  useResetCompetitionMutation,
  useScheduleMatchupMutation,
  useSetCompetitionPoolsMutation,
  useUpdateCompetitionFormatMutation,
} from "@/hooks/use-competition"
import { useDivisionsQuery } from "@/hooks/use-division"
import { useOrganizationsQuery } from "@/hooks/use-organization"
import { useScorekeepersQuery, useStatisticiansQuery } from "@/hooks/use-schedule"
import { useTeamsQuery } from "@/hooks/use-team"
import { useVenuesQuery } from "@/hooks/use-venue"
import type { CompetitionFormat, CompetitionMatchup, CompetitionWorkspace } from "@/services/competition.service"
import type { Team } from "@/services/team.service"

function FormatEditor({
  divisionId,
  format,
  organizationId,
}: {
  divisionId: string
  format: CompetitionFormat
  organizationId: string
}) {
  const mutation = useUpdateCompetitionFormatMutation(organizationId, divisionId)
  const [qualifyingFormat, setQualifyingFormat] = React.useState(format.qualifying_format)
  const [playoffFormat, setPlayoffFormat] = React.useState(format.playoff_format)
  const [poolCount, setPoolCount] = React.useState(format.pool_count)
  const [qualifiersPerPool, setQualifiersPerPool] = React.useState(format.qualifiers_per_pool)
  const [crossover, setCrossover] = React.useState(
    format.crossover_template.map((item) => `${item.homeSeed}-${item.awaySeed}`).join(", "),
  )

  async function save() {
    const crossoverTemplate = crossover
      .split(",")
      .map((item) => item.trim().toUpperCase().split("-").map((seed) => seed.trim()))
      .filter((pair) => pair.length === 2 && pair.every(Boolean))
      .map(([homeSeed, awaySeed]) => ({ awaySeed, homeSeed }))
    try {
      await mutation.mutateAsync({
        crossoverTemplate,
        playoffFormat,
        poolCount,
        qualifiersPerPool,
        qualifyingFormat,
        tiebreakers: format.tiebreakers,
      })
      toast.success("Competition format saved")
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Division format</CardTitle></CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2"><Label htmlFor="format-qualifying">Qualifying</Label><NativeSelect id="format-qualifying" disabled={format.status !== "draft"} value={qualifyingFormat} onChange={(event) => setQualifyingFormat(event.target.value as typeof qualifyingFormat)}><NativeSelectOption value="none">None</NativeSelectOption><NativeSelectOption value="single_round_robin">Single round robin</NativeSelectOption><NativeSelectOption value="double_round_robin">Double round robin</NativeSelectOption></NativeSelect></div>
        <div className="space-y-2"><Label htmlFor="format-playoffs">Playoffs</Label><NativeSelect id="format-playoffs" disabled={format.status !== "draft"} value={playoffFormat} onChange={(event) => setPlayoffFormat(event.target.value as typeof playoffFormat)}><NativeSelectOption value="none">None</NativeSelectOption><NativeSelectOption value="single_elimination">Single elimination</NativeSelectOption><NativeSelectOption value="double_elimination">Double elimination</NativeSelectOption></NativeSelect></div>
        <div className="space-y-2"><Label htmlFor="format-pools">Pools</Label><Input id="format-pools" disabled={format.status !== "draft"} min={1} max={16} type="number" value={poolCount} onChange={(event) => setPoolCount(Number(event.target.value))} /></div>
        <div className="space-y-2"><Label htmlFor="format-qualifiers">Qualifiers per pool</Label><Input id="format-qualifiers" disabled={format.status !== "draft"} min={1} max={64} type="number" value={qualifiersPerPool} onChange={(event) => setQualifiersPerPool(Number(event.target.value))} /></div>
        <div className="space-y-2 sm:col-span-2"><Label htmlFor="format-crossover">Crossover</Label><Input id="format-crossover" disabled={format.status !== "draft"} placeholder="A1-B2, B1-A2" value={crossover} onChange={(event) => setCrossover(event.target.value)} /><p className="text-xs text-muted-foreground">Enter the opening matchups as home-away pool seeds.</p></div>
        <div className="space-y-2 sm:col-span-2 lg:col-span-3"><p className="text-sm font-medium">Tiebreakers</p><p className="text-sm text-muted-foreground">{format.tiebreakers.map((rule) => rule.replaceAll("_", " ")).join(" → ")}</p></div>
        {format.status === "draft" ? <Button className="w-fit" disabled={mutation.isPending} onClick={save}>{mutation.isPending ? <Loader2 className="animate-spin" /> : <Settings2 />}Save division format</Button> : <p className="flex items-center gap-2 text-sm text-muted-foreground"><Lock className="size-4" />Locked formats cannot be edited.</p>}
      </CardContent>
    </Card>
  )
}

function PoolEditor({
  divisionId,
  organizationId,
  teams,
  workspace,
}: {
  divisionId: string
  organizationId: string
  teams: Team[]
  workspace: CompetitionWorkspace
}) {
  const mutation = useSetCompetitionPoolsMutation(organizationId, divisionId)
  const initial = Object.fromEntries(
    workspace.pools.flatMap((pool) => pool.teamIds.map((teamId) => [teamId, pool.id])),
  )
  const [assignments, setAssignments] = React.useState<Record<string, string>>(initial)
  async function save() {
    try {
      await mutation.mutateAsync(
        workspace.pools.map((pool) => ({
          poolId: pool.id,
          teamIds: teams.filter((team) => assignments[team.id] === pool.id).map((team) => team.id),
        })),
      )
      toast.success("Pool assignments saved")
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }
  return (
    <Card>
      <CardHeader><CardTitle>Pool assignments</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {teams.length === 0 ? <p className="text-sm text-muted-foreground">Add active teams to this division before assigning pools.</p> : (
          <div className="divide-y rounded-md border">
            {teams.map((team) => <div key={team.id} className="grid items-center gap-3 px-3 py-2 sm:grid-cols-[1fr_180px]"><span className="text-sm font-medium">{team.name}</span><NativeSelect aria-label={`Pool for ${team.name}`} disabled={workspace.format.status !== "draft"} value={assignments[team.id] ?? "unassigned"} onChange={(event) => setAssignments((current) => ({ ...current, [team.id]: event.target.value }))}><NativeSelectOption value="unassigned">Unassigned</NativeSelectOption>{workspace.pools.map((pool) => <NativeSelectOption key={pool.id} value={pool.id}>{pool.name}</NativeSelectOption>)}</NativeSelect></div>)}
          </div>
        )}
        {workspace.format.status === "draft" ? <Button disabled={mutation.isPending || teams.some((team) => !assignments[team.id] || assignments[team.id] === "unassigned")} onClick={save}>{mutation.isPending ? <Loader2 className="animate-spin" /> : null}Save assignments</Button> : null}
      </CardContent>
    </Card>
  )
}

function SeedOrder({ teams, onChange }: { teams: Team[]; onChange: (ids: string[]) => void }) {
  const [ordered, setOrdered] = React.useState(teams)
  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= ordered.length) return
    const next = [...ordered]
    ;[next[index], next[target]] = [next[target], next[index]]
    setOrdered(next)
    onChange(next.map((team) => team.id))
  }
  React.useEffect(() => onChange(ordered.map((team) => team.id)), [onChange, ordered])
  return <ol className="divide-y rounded-md border">{ordered.map((team, index) => <li key={team.id} className="flex items-center gap-3 px-3 py-2"><span className="w-6 text-sm text-muted-foreground">{index + 1}</span><span className="flex-1 text-sm font-medium">{team.name}</span><Button aria-label={`Move ${team.name} up`} disabled={index === 0} size="icon-sm" variant="ghost" onClick={() => move(index, -1)}><ArrowUp /></Button><Button aria-label={`Move ${team.name} down`} disabled={index === ordered.length - 1} size="icon-sm" variant="ghost" onClick={() => move(index, 1)}><ArrowDown /></Button></li>)}</ol>
}

function TieDecision({ divisionId, organizationId, standings, teams }: { divisionId: string; organizationId: string; standings: CompetitionWorkspace["standings"]; teams: Team[] }) {
  const allUnresolved = standings.filter((row) => row.rank === null)
  const firstTieKey = allUnresolved[0]?.unresolved_tie_key
  const unresolved = firstTieKey ? allUnresolved.filter((row) => row.unresolved_tie_key === firstTieKey) : allUnresolved
  const standingsRevision = standings.reduce((revision, row) => Math.max(revision, row.version), 0)
  const mutation = useRecordTieDecisionMutation(organizationId, divisionId)
  const [reason, setReason] = React.useState("")
  const unresolvedIds = unresolved.map((row) => row.team_id)
  const unresolvedIdentity = `${firstTieKey ?? "legacy"}:${unresolvedIds.join("|")}`
  const [orderedState, setOrderedState] = React.useState({ identity: unresolvedIdentity, ids: unresolvedIds })
  const ordered = orderedState.identity === unresolvedIdentity ? orderedState.ids : unresolvedIds
  if (unresolved.length < 2) return null
  const poolId = unresolved[0].pool_id
  function move(index: number, direction: -1 | 1) { const target = index + direction; if (target < 0 || target >= ordered.length) return; const next = [...ordered]; [next[index], next[target]] = [next[target], next[index]]; setOrderedState({ identity: unresolvedIdentity, ids: next }) }
  return <Card className="border-amber-500/40"><CardHeader><CardTitle>Unresolved standings tie</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">Confirm this tie group’s published order and explain the league decision. Qualification remains paused until it is resolved.</p><ol className="divide-y rounded-md border">{ordered.map((teamId, index) => <li key={teamId} className="flex items-center gap-2 px-3 py-2"><span className="flex-1 text-sm font-medium">{teams.find((team) => team.id === teamId)?.name ?? "Team"}</span><Button size="icon-sm" variant="ghost" disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp /></Button><Button size="icon-sm" variant="ghost" disabled={index === ordered.length - 1} onClick={() => move(index, 1)}><ArrowDown /></Button></li>)}</ol><Textarea aria-label="Tie decision reason" placeholder="Explain how the league confirmed this order." value={reason} onChange={(event) => setReason(event.target.value)} /><Button disabled={reason.trim().length < 10 || mutation.isPending} onClick={async () => { try { await mutation.mutateAsync({ expectedStandingsRevision: standingsRevision, orderedTeamIds: ordered, poolId, reason, teamIds: unresolved.map((row) => row.team_id) }); toast.success("Tie decision published") } catch (error) { toast.error(getApiErrorMessage(error)) } }}>Publish decision</Button></CardContent></Card>
}

function ScheduleMatchupDialog({ divisionId, matchup, onClose, organizationId, scorekeepers, statisticians, venues }: { divisionId: string; matchup: CompetitionMatchup; onClose: () => void; organizationId: string; scorekeepers: Array<{ id: string; name: string; email: string }>; statisticians: Array<{ id: string; name: string; email: string }>; venues: Array<{ id: string; name: string }> }) {
  const mutation = useScheduleMatchupMutation(organizationId, divisionId)
  const [startsAt, setStartsAt] = React.useState("")
  const [venueId, setVenueId] = React.useState(venues[0]?.id ?? "")
  const [scorekeeperMemberId, setScorekeeper] = React.useState("unassigned")
  const [statisticianMemberId, setStatistician] = React.useState("unassigned")
  return <Dialog open onOpenChange={(open) => !open && onClose()}><DialogContent><DialogHeader><DialogTitle>Schedule {matchup.label ?? "matchup"}</DialogTitle><DialogDescription>Assign the court time and game staff. Team and venue overlaps are checked automatically.</DialogDescription></DialogHeader><div className="grid gap-4"><div className="space-y-2"><Label htmlFor="matchup-start">Date and time</Label><Input id="matchup-start" type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="matchup-venue">Venue</Label><NativeSelect id="matchup-venue" value={venueId} onChange={(event) => setVenueId(event.target.value)}>{venues.map((venue) => <NativeSelectOption key={venue.id} value={venue.id}>{venue.name}</NativeSelectOption>)}</NativeSelect></div><div className="space-y-2"><Label htmlFor="matchup-scorekeeper">Scorekeeper</Label><NativeSelect id="matchup-scorekeeper" value={scorekeeperMemberId} onChange={(event) => setScorekeeper(event.target.value)}><NativeSelectOption value="unassigned">Unassigned</NativeSelectOption>{scorekeepers.map((person) => <NativeSelectOption key={person.id} value={person.id}>{person.name || person.email}</NativeSelectOption>)}</NativeSelect></div><div className="space-y-2"><Label htmlFor="matchup-statistician">Statistician</Label><NativeSelect id="matchup-statistician" value={statisticianMemberId} onChange={(event) => setStatistician(event.target.value)}><NativeSelectOption value="unassigned">Unassigned</NativeSelectOption>{statisticians.map((person) => <NativeSelectOption key={person.id} value={person.id}>{person.name || person.email}</NativeSelectOption>)}</NativeSelect></div></div><DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={!startsAt || !venueId || mutation.isPending} onClick={async () => { try { await mutation.mutateAsync({ matchupId: matchup.id, payload: { startsAt: new Date(startsAt).toISOString(), venueId, scorekeeperMemberId: scorekeeperMemberId === "unassigned" ? null : scorekeeperMemberId, statisticianMemberId: statisticianMemberId === "unassigned" ? null : statisticianMemberId } }); toast.success("Matchup scheduled"); onClose() } catch (error) { toast.error(getApiErrorMessage(error)) } }}>{mutation.isPending ? <Loader2 className="animate-spin" /> : <CalendarPlus />}Schedule game</Button></DialogFooter></DialogContent></Dialog>
}

export function CompetitionWorkspaceScreen({ slug }: { slug: string }) {
  const organizationsQuery = useOrganizationsQuery()
  const organization = organizationsQuery.data?.find((item) => item.slug === slug)
  const divisionsQuery = useDivisionsQuery(organization?.id, { pageSize: 50 })
  const divisions = divisionsQuery.data?.data ?? []
  const [requestedDivisionId, setRequestedDivisionId] = React.useState("")
  const divisionId = divisions.some((division) => division.id === requestedDivisionId) ? requestedDivisionId : divisions[0]?.id ?? ""
  const workspaceQuery = useCompetitionWorkspaceQuery(organization?.id, divisionId)
  const teamsQuery = useTeamsQuery(organization?.id, { divisionId, pageSize: 50, status: "active" })
  const venuesQuery = useVenuesQuery(organization?.id, { pageSize: 50 })
  const scorekeepersQuery = useScorekeepersQuery(organization?.id)
  const statisticiansQuery = useStatisticiansQuery(organization?.id)
  const teams = teamsQuery.data?.data ?? []
  const workspace = workspaceQuery.data
  const generateMutation = useGenerateCompetitionMutation(organization?.id ?? "", divisionId)
  const resetMutation = useResetCompetitionMutation(organization?.id ?? "", divisionId)
  const [seedOrder, setSeedOrder] = React.useState<string[]>([])
  const [selectedMatchup, setSelectedMatchup] = React.useState<CompetitionMatchup | null>(null)

  if (organizationsQuery.isLoading || divisionsQuery.isLoading) return <main className="p-8 text-sm text-muted-foreground">Loading competition workspace…</main>
  if (!organization) return <main className="p-8">Organization not found.</main>
  if (!organization.access.permissions.includes("schedule.manage")) return <main className="p-8">You do not have access to competition setup.</main>

  const needsScheduling = workspace?.matchups.filter((matchup) => matchup.status === "ready") ?? []
  return <SidebarProvider><AppSidebar organization={{ access: organization.access, name: organization.name, slug: organization.slug, status: organization.status }} /><SidebarInset><WorkspaceHeader organizationAccess={organization.access} organizationName={organization.name} organizationSlug={organization.slug} pageTitle="Competition" /><main className="flex flex-1 flex-col gap-6 p-4 lg:p-6"><section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><h1 className="text-3xl font-semibold tracking-tight">Competition workspace</h1><p className="mt-1 text-sm text-muted-foreground">Configure pools, generate matchups, schedule games, and follow official progression.</p></div><div className="w-full max-w-xs space-y-2"><Label htmlFor="competition-division">Division</Label><NativeSelect id="competition-division" value={divisionId} onChange={(event) => setRequestedDivisionId(event.target.value)}>{divisions.map((division) => <NativeSelectOption key={division.id} value={division.id}>{division.name}</NativeSelectOption>)}</NativeSelect></div></section>{divisions.length === 0 ? <Empty className="border"><EmptyHeader><EmptyMedia variant="icon"><Trophy /></EmptyMedia><EmptyTitle>Create a division first</EmptyTitle><EmptyDescription>Competition formats are configured for each division.</EmptyDescription></EmptyHeader></Empty> : workspaceQuery.isLoading ? <Card className="h-96" /> : workspaceQuery.isError || !workspace ? <Empty className="border"><EmptyHeader><EmptyTitle>We couldn’t load this competition</EmptyTitle><EmptyDescription>{getApiErrorMessage(workspaceQuery.error)}</EmptyDescription></EmptyHeader></Empty> : <Tabs defaultValue="setup"><TabsList className="w-full justify-start overflow-x-auto"><TabsTrigger value="setup">Setup</TabsTrigger><TabsTrigger value="scheduling">Needs scheduling ({needsScheduling.length})</TabsTrigger><TabsTrigger value="standings">Standings</TabsTrigger><TabsTrigger value="bracket">Bracket</TabsTrigger></TabsList><TabsContent value="setup" className="space-y-6"><FormatEditor key={`${workspace.format.id}-${workspace.format.revision}-${workspace.format.status}`} divisionId={divisionId} format={workspace.format} organizationId={organization.id} /><PoolEditor key={`${workspace.format.id}-${workspace.format.revision}-${workspace.format.status}-pools`} divisionId={divisionId} organizationId={organization.id} teams={teams} workspace={workspace} />{workspace.format.status === "draft" ? <Card><CardHeader><CardTitle>Lock and generate</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">Generation locks this revision. Review the format and assignments first.</p>{workspace.format.qualifying_format === "none" ? <SeedOrder teams={teams} onChange={setSeedOrder} /> : null}<Button disabled={generateMutation.isPending || teams.length < 2} onClick={async () => { try { await generateMutation.mutateAsync(workspace.format.qualifying_format === "none" ? seedOrder : undefined); toast.success("Competition matchups generated") } catch (error) { toast.error(getApiErrorMessage(error)) } }}>{generateMutation.isPending ? <Loader2 className="animate-spin" /> : <Lock />}Lock and generate</Button></CardContent></Card> : workspace.format.status === "locked" ? <Button variant="outline" disabled={resetMutation.isPending} onClick={async () => { try { await resetMutation.mutateAsync(); toast.success("Competition returned to draft") } catch (error) { toast.error(getApiErrorMessage(error)) } }}><RotateCcw />Reset format</Button> : <Badge>Competition completed</Badge>}</TabsContent><TabsContent value="scheduling"><Card><CardHeader><CardTitle>Matchups awaiting a court time</CardTitle></CardHeader><CardContent>{needsScheduling.length === 0 ? <p className="text-sm text-muted-foreground">Every ready matchup is scheduled. New playoff matchups appear here as teams advance.</p> : <div className="divide-y rounded-md border">{needsScheduling.map((matchup) => <div key={matchup.id} className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center"><div className="flex-1"><p className="text-sm font-medium">{matchup.label ?? "Generated matchup"}</p><p className="text-xs text-muted-foreground">{teams.find((team) => team.id === matchup.home_team_id)?.name ?? matchup.home_source_ref} vs {teams.find((team) => team.id === matchup.away_team_id)?.name ?? matchup.away_source_ref}</p></div><Button size="sm" onClick={() => setSelectedMatchup(matchup)}><CalendarPlus />Schedule</Button></div>)}</div>}</CardContent></Card></TabsContent><TabsContent value="standings" className="space-y-6"><TieDecision divisionId={divisionId} organizationId={organization.id} standings={workspace.standings} teams={teams} /><Card><CardHeader><CardTitle>Explainable pool standings</CardTitle></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-160 text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-2">Rank</th><th>Team</th><th>W-L</th><th>Win %</th><th>Diff</th><th>Status</th><th>Ranking reason</th></tr></thead><tbody>{workspace.standings.map((row) => <tr key={`${row.pool_id}-${row.team_id}`} className="border-b"><td className="p-2">{row.rank ?? "Tie"}</td><td>{teams.find((team) => team.id === row.team_id)?.name ?? "Team"}</td><td>{row.wins}-{row.losses}</td><td>{Number(row.win_percentage).toFixed(3)}</td><td>{row.point_differential}</td><td><Badge variant="outline">{row.qualification_status}</Badge></td><td className="max-w-72 text-xs text-muted-foreground">{row.ranking_explanation.map((item) => `${item.label}: ${item.value}`).join(" · ") || "Awaiting finalized games"}</td></tr>)}</tbody></table></CardContent></Card></TabsContent><TabsContent value="bracket"><Card><CardHeader><CardTitle>Playoff bracket</CardTitle></CardHeader><CardContent><CompetitionBracket matchups={workspace.matchups.filter((matchup) => matchup.stage === "playoff")} teams={teams} /></CardContent></Card></TabsContent></Tabs>}{selectedMatchup ? <ScheduleMatchupDialog divisionId={divisionId} matchup={selectedMatchup} organizationId={organization.id} scorekeepers={scorekeepersQuery.data ?? []} statisticians={statisticiansQuery.data ?? []} venues={venuesQuery.data?.data ?? []} onClose={() => setSelectedMatchup(null)} /> : null}</main></SidebarInset></SidebarProvider>
}
