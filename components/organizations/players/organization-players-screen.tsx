"use client"

import Link from "next/link"
import { Users2 } from "lucide-react"

import { OrganizationPlayersView } from "@/components/organizations/players/organization-players-view"
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
import type { PlayerListParams } from "@/services/player.service"

type OrganizationPlayersScreenProps = {
  slug: string
}

function PlayersLoadingState() {
  return (
    <main className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-7xl space-y-6">
        <Skeleton className="h-10 w-80 rounded-xl" />
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-[420px] rounded-2xl" />
      </div>
    </main>
  )
}

function PlayersEmptyShell({
  description,
  title,
}: {
  description: string
  title: string
}) {
  return (
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
  )
}

export function OrganizationPlayersScreen({ slug }: OrganizationPlayersScreenProps) {
  const organizationsQuery = useOrganizationsQuery()
  const organization = organizationsQuery.data?.find((item) => item.slug === slug)
  const tablePagination = useTablePaginationState()
  const search = tablePagination.searchParams.get("search") ?? ""
  const teamFilter = tablePagination.searchParams.get("teamId") ?? "all"
  const divisionFilter = tablePagination.searchParams.get("divisionId") ?? "all"
  const statusParam = tablePagination.searchParams.get("status")
  const statusFilter =
    statusParam === "active" || statusParam === "inactive" ? statusParam : "all"
  const sortParam = tablePagination.searchParams.get("sortBy")
  const sortBy =
    sortParam === "name" || sortParam === "team" || sortParam === "recent"
      ? sortParam
      : "recent"
  const playerParams: PlayerListParams = {
    ...tablePagination.params,
    divisionId: divisionFilter === "all" ? undefined : divisionFilter,
    search: search || undefined,
    sortBy,
    status: statusFilter === "all" ? undefined : statusFilter,
    teamId: teamFilter === "all" ? undefined : teamFilter,
  }
  const divisionsQuery = useDivisionsQuery(organization?.id, { pageSize: 50 })
  const teamsQuery = useTeamsQuery(organization?.id, { pageSize: 50 })
  const playersQuery = usePlayersQuery(organization?.id, playerParams)

  if (
    organizationsQuery.isLoading ||
    (organization &&
      (divisionsQuery.isLoading || teamsQuery.isLoading || playersQuery.isLoading))
  ) {
    return <PlayersLoadingState />
  }

  if (organizationsQuery.isError) {
    return (
      <PlayersEmptyShell
        title="We couldn't load this organization"
        description={getApiErrorMessage(organizationsQuery.error)}
      />
    )
  }

  if (!organization) {
    return (
      <PlayersEmptyShell
        title="Organization not found"
        description="This workspace does not exist or you do not have access to it."
      />
    )
  }

  if (divisionsQuery.isError) {
    return (
      <PlayersEmptyShell
        title="We couldn't load divisions"
        description={getApiErrorMessage(divisionsQuery.error)}
      />
    )
  }

  if (teamsQuery.isError) {
    return (
      <PlayersEmptyShell
        title="We couldn't load teams"
        description={getApiErrorMessage(teamsQuery.error)}
      />
    )
  }

  if (playersQuery.isError) {
    return (
      <PlayersEmptyShell
        title="We couldn't load players"
        description={getApiErrorMessage(playersQuery.error)}
      />
    )
  }

  return (
    <OrganizationPlayersView
      divisions={divisionsQuery.data?.data ?? []}
      filters={{
        divisionFilter,
        search,
        sortBy,
        statusFilter,
        teamFilter,
      }}
      organization={organization}
      pagination={playersQuery.data?.pagination ?? getDefaultPaginationMeta()}
      players={playersQuery.data?.data ?? []}
      teams={teamsQuery.data?.data ?? []}
      onFiltersChange={(updates) =>
        tablePagination.setParams({
          divisionId: updates.divisionFilter === "all" ? null : updates.divisionFilter,
          page: null,
          search: updates.search,
          sortBy: updates.sortBy === "recent" ? null : updates.sortBy,
          status: updates.statusFilter === "all" ? null : updates.statusFilter,
          teamId: updates.teamFilter === "all" ? null : updates.teamFilter,
        })
      }
      onPageChange={tablePagination.setPage}
      onPageSizeChange={tablePagination.setPageSize}
    />
  )
}
