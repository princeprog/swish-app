"use client"

import Link from "next/link"
import { Users2 } from "lucide-react"

import { TeamRosterView } from "@/components/organizations/roster/team-roster-view"
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

type TeamRosterScreenProps = {
  slug: string
  teamId: string
}

function TeamRosterLoadingState() {
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

function TeamRosterEmptyShell({
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

export function TeamRosterScreen({ slug, teamId }: TeamRosterScreenProps) {
  const organizationsQuery = useOrganizationsQuery()
  const organization = organizationsQuery.data?.find((item) => item.slug === slug)
  const tablePagination = useTablePaginationState()
  const divisionsQuery = useDivisionsQuery(organization?.id, { pageSize: 50 })
  const teamsQuery = useTeamsQuery(organization?.id, { pageSize: 50 })
  const playersQuery = usePlayersQuery(organization?.id, {
    ...tablePagination.params,
    teamId,
  })
  const team = teamsQuery.data?.data.find((item) => item.id === teamId)

  if (
    organizationsQuery.isLoading ||
    (organization &&
      (divisionsQuery.isLoading || teamsQuery.isLoading || playersQuery.isLoading))
  ) {
    return <TeamRosterLoadingState />
  }

  if (organizationsQuery.isError) {
    return (
      <TeamRosterEmptyShell
        title="We couldn't load this organization"
        description={getApiErrorMessage(organizationsQuery.error)}
      />
    )
  }

  if (!organization) {
    return (
      <TeamRosterEmptyShell
        title="Organization not found"
        description="This workspace does not exist or you do not have access to it."
      />
    )
  }

  if (divisionsQuery.isError) {
    return (
      <TeamRosterEmptyShell
        title="We couldn't load divisions"
        description={getApiErrorMessage(divisionsQuery.error)}
      />
    )
  }

  if (teamsQuery.isError) {
    return (
      <TeamRosterEmptyShell
        title="We couldn't load teams"
        description={getApiErrorMessage(teamsQuery.error)}
      />
    )
  }

  if (playersQuery.isError) {
    return (
      <TeamRosterEmptyShell
        title="We couldn't load players"
        description={getApiErrorMessage(playersQuery.error)}
      />
    )
  }

  if (!team) {
    return (
      <TeamRosterEmptyShell
        title="Team not found"
        description="This team does not belong to the current organization."
      />
    )
  }

  return (
    <TeamRosterView
      divisions={divisionsQuery.data?.data ?? []}
      organization={organization}
      pagination={playersQuery.data?.pagination ?? getDefaultPaginationMeta()}
      players={playersQuery.data?.data ?? []}
      team={team}
      onPageChange={tablePagination.setPage}
      onPageSizeChange={tablePagination.setPageSize}
    />
  )
}
