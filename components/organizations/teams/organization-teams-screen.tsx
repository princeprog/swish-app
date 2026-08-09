"use client"

import Link from "next/link"
import { Shield, Users2 } from "lucide-react"

import { OrganizationTeamsView } from "@/components/organizations/teams/organization-teams-view"
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
import { useOrganizationsQuery } from "@/hooks/use-organization"
import { usePlayersQuery } from "@/hooks/use-player"
import { useTeamsQuery } from "@/hooks/use-team"
import { useTablePaginationState } from "@/hooks/use-table-pagination-state"
import { getDefaultPaginationMeta } from "@/services/pagination"
import type { TeamListParams } from "@/services/team.service"

type OrganizationTeamsScreenProps = {
  slug: string
}

function TeamsLoadingState() {
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

function TeamsEmptyShell({
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
              <Users2 className="size-5" />
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

export function OrganizationTeamsScreen({ slug }: OrganizationTeamsScreenProps) {
  const organizationsQuery = useOrganizationsQuery()
  const organization = organizationsQuery.data?.find((item) => item.slug === slug)
  const isTeamManager = organization?.access.role === "team_manager"
  const tablePagination = useTablePaginationState()
  const search = tablePagination.searchParams.get("search") ?? ""
  const divisionFilter = tablePagination.searchParams.get("divisionId") ?? "all"
  const statusParam = tablePagination.searchParams.get("status")
  const statusFilter =
    statusParam === "active" || statusParam === "inactive" ? statusParam : "all"
  const sortParam = tablePagination.searchParams.get("sortBy")
  const sortBy =
    sortParam === "name" || sortParam === "division" || sortParam === "recent"
      ? sortParam
      : "recent"
  const teamParams: TeamListParams = {
    ...tablePagination.params,
    divisionId: divisionFilter === "all" ? undefined : divisionFilter,
    search: search || undefined,
    sortBy,
    status: statusFilter === "all" ? undefined : statusFilter,
  }
  const adminOrganizationId = isTeamManager ? undefined : organization?.id
  const divisionsQuery = useDivisionsQuery(adminOrganizationId, { pageSize: 50 })
  const teamsQuery = useTeamsQuery(adminOrganizationId, teamParams)
  const playersQuery = usePlayersQuery(adminOrganizationId, { pageSize: 50 })

  if (
    organizationsQuery.isLoading ||
    (organization &&
      !isTeamManager &&
      (divisionsQuery.isLoading || teamsQuery.isLoading || playersQuery.isLoading))
  ) {
    return <TeamsLoadingState />
  }

  if (organizationsQuery.isError) {
    return (
      <TeamsEmptyShell
        title="We couldn't load this organization"
        description={getApiErrorMessage(organizationsQuery.error)}
      />
    )
  }

  if (!organization) {
    return (
      <TeamsEmptyShell
        title="Organization not found"
        description="This workspace does not exist or you do not have access to it."
      />
    )
  }

  if (isTeamManager) {
    return <TeamManagerWorkspace organization={organization} page="team" />
  }

  if (divisionsQuery.isError) {
    return (
      <TeamsEmptyShell
        title="We couldn't load divisions"
        description={getApiErrorMessage(divisionsQuery.error)}
      />
    )
  }

  if (teamsQuery.isError) {
    return (
      <TeamsEmptyShell
        title="We couldn't load teams"
        description={getApiErrorMessage(teamsQuery.error)}
      />
    )
  }

  if (playersQuery.isError) {
    return (
      <TeamsEmptyShell
        title="We couldn't load players"
        description={getApiErrorMessage(playersQuery.error)}
      />
    )
  }

  return (
    <OrganizationTeamsView
      divisions={divisionsQuery.data?.data ?? []}
      filters={{
        divisionFilter,
        search,
        sortBy,
        statusFilter,
      }}
      organization={organization}
      pagination={teamsQuery.data?.pagination ?? getDefaultPaginationMeta()}
      players={playersQuery.data?.data ?? []}
      teams={teamsQuery.data?.data ?? []}
      onFiltersChange={(updates) =>
        tablePagination.setParams({
          divisionId: updates.divisionFilter === "all" ? null : updates.divisionFilter,
          page: null,
          search: updates.search,
          sortBy: updates.sortBy === "recent" ? null : updates.sortBy,
          status: updates.statusFilter === "all" ? null : updates.statusFilter,
        })
      }
      onPageChange={tablePagination.setPage}
      onPageSizeChange={tablePagination.setPageSize}
    />
  )
}
