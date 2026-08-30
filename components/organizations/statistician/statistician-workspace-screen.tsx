"use client"

import Link from "next/link"
import { BarChart3, ChevronRight } from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { WorkspaceHeader } from "@/components/organizations/shared/workspace-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useOrganizationsQuery } from "@/hooks/use-organization"
import { useSchedulesQuery } from "@/hooks/use-schedule"

export function StatisticianWorkspaceScreen({ slug }: { slug: string }) {
  const organizationsQuery = useOrganizationsQuery()
  const organization = organizationsQuery.data?.find((item) => item.slug === slug)
  const schedulesQuery = useSchedulesQuery(organization?.id)
  if (!organization) return <main className="p-8">Loading statistician workspace…</main>
  const games = schedulesQuery.data ?? []
  return <SidebarProvider><AppSidebar organization={{ access: organization.access, name: organization.name, slug: organization.slug, status: organization.status }} /><SidebarInset><WorkspaceHeader organizationAccess={organization.access} organizationName={organization.name} organizationSlug={slug} pageTitle="Statistician" /><main className="space-y-6 p-4 lg:p-6"><div><h1 className="text-3xl font-semibold tracking-tight">Assigned stat sheets</h1><p className="mt-1 text-sm text-muted-foreground">Record player points, rebounds, assists, steals, and turnovers independently from the official scoreboard.</p></div>{games.length === 0 ? <Empty className="border"><EmptyHeader><EmptyMedia variant="icon"><BarChart3 /></EmptyMedia><EmptyTitle>No assigned games</EmptyTitle><EmptyDescription>Games appear here after an organizer assigns you as statistician.</EmptyDescription></EmptyHeader></Empty> : <div className="grid gap-3">{games.map((game) => <Card key={game.id}><CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"><div className="flex-1"><div className="flex items-center gap-2"><p className="font-semibold">{game.home_team_name} vs {game.away_team_name}</p><Badge variant="outline">{game.status}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{new Date(game.starts_at).toLocaleString()} · {game.venue_name}</p></div><Button asChild><Link href={`/organizations/${slug}/statistician/games/${game.id}`}>Open stat sheet<ChevronRight /></Link></Button></CardContent></Card>)}</div>}</main></SidebarInset></SidebarProvider>
}
