"use client"

import Link from "next/link"
import { Trophy } from "lucide-react"

import { OrganizationStandingsView } from "@/components/organizations/standings/organization-standings-view"
import { PageEntrance } from "@/components/motion/page-motion"
import { TeamManagerWorkspace } from "@/components/organizations/team-manager/manager-workspace"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { getApiErrorMessage } from "@/hooks/use-auth"
import { useDivisionsQuery } from "@/hooks/use-division"
import { useLeagueSeasonsQuery } from "@/hooks/use-league-season"
import { useOrganizationsQuery } from "@/hooks/use-organization"

type OrganizationStandingsScreenProps = {
  slug: string
}

function StandingsLoadingState() {
  return (
    <PageEntrance asChild>
      <main className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-7xl space-y-6">
        <Skeleton className="h-10 w-80 rounded-xl" />
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-[420px] rounded-2xl" />
      </div>
      </main>
    </PageEntrance>
  )
}

function StandingsEmptyShell({
  description,
  title,
}: {
  description: string
  title: string
}) {
  return (
    <PageEntrance asChild>
      <main className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-3xl">
        <Empty className="border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Trophy className="size-5" />
            </EmptyMedia>
            <EmptyTitle>{title}</EmptyTitle>
            <EmptyDescription>{description}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href="/organizations">Back to organizations</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
      </main>
    </PageEntrance>
  )
}

export function OrganizationStandingsScreen({
  slug,
}: OrganizationStandingsScreenProps) {
  const organizationsQuery = useOrganizationsQuery()
  const organization = organizationsQuery.data?.find((item) => item.slug === slug)
  const isTeamManager = organization?.access.role === "team_manager"
  const adminOrganizationId = isTeamManager ? undefined : organization?.id
  const leagueSeasonsQuery = useLeagueSeasonsQuery(adminOrganizationId, {
    pageSize: 50,
  })
  const divisionsQuery = useDivisionsQuery(adminOrganizationId, { pageSize: 50 })
  const seasons = leagueSeasonsQuery.data?.data ?? []
  const activeSeason = seasons.find((season) => season.status === "active") ?? seasons[0]

  if (
    organizationsQuery.isLoading ||
    (organization &&
      !isTeamManager &&
      (leagueSeasonsQuery.isLoading ||
        divisionsQuery.isLoading))
  ) {
    return <StandingsLoadingState />
  }

  if (organizationsQuery.isError) {
    return (
      <StandingsEmptyShell
        title="We couldn't load this organization"
        description={getApiErrorMessage(organizationsQuery.error)}
      />
    )
  }

  if (!organization) {
    return (
      <StandingsEmptyShell
        title="Organization not found"
        description="This workspace does not exist or you do not have access to it."
      />
    )
  }

  if (isTeamManager) {
    return <TeamManagerWorkspace organization={organization} page="standings" />
  }

  if (leagueSeasonsQuery.isError) {
    return (
      <StandingsEmptyShell
        title="We couldn't load seasons"
        description={getApiErrorMessage(leagueSeasonsQuery.error)}
      />
    )
  }

  if (divisionsQuery.isError) {
    return (
      <StandingsEmptyShell
        title="We couldn't load divisions"
        description={getApiErrorMessage(divisionsQuery.error)}
      />
    )
  }

  return (
    <OrganizationStandingsView
      divisions={divisionsQuery.data?.data ?? []}
      initialSeasonId={activeSeason?.id ?? ""}
      organization={organization}
      seasons={seasons}
    />
  )
}
