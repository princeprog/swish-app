"use client"

import * as React from "react"
import Link from "next/link"
import { Users2 } from "lucide-react"

import { OrganizationPlayersView } from "@/components/organizations/players/organization-players-view"
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
import type { PlayerListParams, PlayerSortBy } from "@/services/player.service"

type OrganizationPlayersScreenProps = {
  slug: string
}

type PlayerTableFilters = {
  divisionFilter: string
  search: string
  sortBy: PlayerSortBy
  sortDirection: "asc" | "desc"
  statusFilter: "active" | "all" | "inactive"
  teamFilter: string
}

function arePlayerFiltersEqual(
  current: PlayerTableFilters,
  next: PlayerTableFilters,
) {
  return (
    current.divisionFilter === next.divisionFilter &&
    current.search === next.search &&
    current.sortBy === next.sortBy &&
    current.sortDirection === next.sortDirection &&
    current.statusFilter === next.statusFilter &&
    current.teamFilter === next.teamFilter
  )
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = React.useState(value)

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value)
    }, delayMs)

    return () => window.clearTimeout(timeoutId)
  }, [delayMs, value])

  return debouncedValue
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
  const isTeamManager = organization?.access.role === "team_manager"
  const tablePagination = useTablePaginationState()
  const {
    params: paginationParams,
    searchParams,
    setPage,
    setPageSize,
    setParams,
  } = tablePagination
  const search = searchParams.get("search") ?? ""
  const teamFilter = searchParams.get("teamId") ?? "all"
  const divisionFilter = searchParams.get("divisionId") ?? "all"
  const statusParam = searchParams.get("status")
  const statusFilter =
    statusParam === "active" || statusParam === "inactive" ? statusParam : "all"
  const sortParam = searchParams.get("sortBy")
  const sortBy: PlayerSortBy =
    sortParam === "division" ||
    sortParam === "jerseyNumber" ||
    sortParam === "name" ||
    sortParam === "position" ||
    sortParam === "recent" ||
    sortParam === "status" ||
    sortParam === "team" ||
    sortParam === "updated"
      ? sortParam
      : "recent"
  const sortDirectionParam = searchParams.get("sortDirection")
  const sortDirection =
    sortDirectionParam === "asc" || sortDirectionParam === "desc"
      ? sortDirectionParam
      : sortBy === "recent"
        ? "desc"
        : "asc"
  const urlFilters = React.useMemo<PlayerTableFilters>(
    () => ({
      divisionFilter,
      search,
      sortBy,
      sortDirection,
      statusFilter,
      teamFilter,
    }),
    [divisionFilter, search, sortBy, sortDirection, statusFilter, teamFilter],
  )
  const [filters, setFilters] = React.useState<PlayerTableFilters>(urlFilters)
  const debouncedFilters = useDebouncedValue(filters, 350)
  const filtersPending = !arePlayerFiltersEqual(filters, debouncedFilters)
  const debouncedFiltersMatchUrl = arePlayerFiltersEqual(debouncedFilters, urlFilters)
  const playerParams: PlayerListParams = {
    ...paginationParams,
    page: debouncedFiltersMatchUrl ? paginationParams.page : 1,
    divisionId:
      debouncedFilters.divisionFilter === "all"
        ? undefined
        : debouncedFilters.divisionFilter,
    search: debouncedFilters.search || undefined,
    sortBy: debouncedFilters.sortBy,
    sortDirection: debouncedFilters.sortDirection,
    status:
      debouncedFilters.statusFilter === "all"
        ? undefined
        : debouncedFilters.statusFilter,
    teamId:
      debouncedFilters.teamFilter === "all" ? undefined : debouncedFilters.teamFilter,
  }
  const adminOrganizationId = isTeamManager ? undefined : organization?.id
  const divisionsQuery = useDivisionsQuery(adminOrganizationId, { pageSize: 50 })
  const teamsQuery = useTeamsQuery(adminOrganizationId, { pageSize: 50 })
  const playersQuery = usePlayersQuery(adminOrganizationId, playerParams)

  React.useEffect(() => {
    setFilters((currentFilters) =>
      arePlayerFiltersEqual(currentFilters, urlFilters) ? currentFilters : urlFilters,
    )
  }, [urlFilters])

  React.useEffect(() => {
    if (arePlayerFiltersEqual(debouncedFilters, urlFilters)) {
      return
    }

    setParams({
      divisionId:
        debouncedFilters.divisionFilter === "all"
          ? null
          : debouncedFilters.divisionFilter,
      page: null,
      search: debouncedFilters.search,
      sortBy: debouncedFilters.sortBy === "recent" ? null : debouncedFilters.sortBy,
      sortDirection:
        debouncedFilters.sortBy === "recent" ||
        debouncedFilters.sortDirection === "asc"
          ? null
          : debouncedFilters.sortDirection,
      status:
        debouncedFilters.statusFilter === "all"
          ? null
          : debouncedFilters.statusFilter,
      teamId: debouncedFilters.teamFilter === "all" ? null : debouncedFilters.teamFilter,
    })
  }, [debouncedFilters, setParams, urlFilters])

  if (
    organizationsQuery.isLoading ||
    (organization &&
      !isTeamManager &&
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

  if (isTeamManager) {
    return <TeamManagerWorkspace organization={organization} page="players" />
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
      filters={filters}
      isPlayersTableRefreshing={filtersPending || playersQuery.isFetching}
      organization={organization}
      pagination={playersQuery.data?.pagination ?? getDefaultPaginationMeta()}
      players={playersQuery.data?.data ?? []}
      teams={teamsQuery.data?.data ?? []}
      onFiltersChange={setFilters}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
    />
  )
}
