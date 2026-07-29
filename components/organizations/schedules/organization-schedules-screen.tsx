"use client"

import Link from "next/link"
import { CalendarRange } from "lucide-react"

import { OrganizationSchedulesView } from "@/components/organizations/schedules/organization-schedules-view"
import { canManageOrganizationSchedule } from "@/components/organizations/schedules/schedule-access"
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
import { useTeamsQuery } from "@/hooks/use-team"
import { useVenuesQuery } from "@/hooks/use-venue"

type OrganizationSchedulesScreenProps = {
  slug: string
}

function SchedulesLoadingState() {
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

function SchedulesEmptyShell({
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
              <CalendarRange className="size-5" />
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

export function OrganizationSchedulesScreen({
  slug,
}: OrganizationSchedulesScreenProps) {
  const organizationsQuery = useOrganizationsQuery()
  const organization = organizationsQuery.data?.find(
    (item) => item.slug === slug,
  )
  const canManageSchedule = organization
    ? canManageOrganizationSchedule(organization)
    : false
  const setupOrganizationId = canManageSchedule ? organization?.id : undefined
  const leagueSeasonsQuery = useLeagueSeasonsQuery(setupOrganizationId, {
    pageSize: 50,
  })
  const divisionsQuery = useDivisionsQuery(setupOrganizationId, {
    pageSize: 50,
  })
  const teamsQuery = useTeamsQuery(setupOrganizationId, { pageSize: 50 })
  const venuesQuery = useVenuesQuery(setupOrganizationId, { pageSize: 50 })

  if (
    organizationsQuery.isLoading ||
    (organization &&
      canManageSchedule &&
      (leagueSeasonsQuery.isLoading ||
        divisionsQuery.isLoading ||
        teamsQuery.isLoading ||
        venuesQuery.isLoading))
  ) {
    return <SchedulesLoadingState />
  }

  if (organizationsQuery.isError) {
    return (
      <SchedulesEmptyShell
        title="We couldn't load this organization"
        description={getApiErrorMessage(organizationsQuery.error)}
      />
    )
  }

  if (!organization) {
    return (
      <SchedulesEmptyShell
        title="Organization not found"
        description="This workspace does not exist or you do not have access to it."
      />
    )
  }

  if (canManageSchedule && leagueSeasonsQuery.isError) {
    return (
      <SchedulesEmptyShell
        title="We couldn't load seasons"
        description={getApiErrorMessage(leagueSeasonsQuery.error)}
      />
    )
  }

  if (canManageSchedule && divisionsQuery.isError) {
    return (
      <SchedulesEmptyShell
        title="We couldn't load divisions"
        description={getApiErrorMessage(divisionsQuery.error)}
      />
    )
  }

  if (canManageSchedule && teamsQuery.isError) {
    return (
      <SchedulesEmptyShell
        title="We couldn't load teams"
        description={getApiErrorMessage(teamsQuery.error)}
      />
    )
  }

  if (canManageSchedule && venuesQuery.isError) {
    return (
      <SchedulesEmptyShell
        title="We couldn't load venues"
        description={getApiErrorMessage(venuesQuery.error)}
      />
    )
  }

  return (
    <OrganizationSchedulesView
      divisions={divisionsQuery.data?.data ?? []}
      organization={organization}
      seasons={leagueSeasonsQuery.data?.data ?? []}
      teams={teamsQuery.data?.data ?? []}
      venues={venuesQuery.data?.data ?? []}
    />
  )
}
