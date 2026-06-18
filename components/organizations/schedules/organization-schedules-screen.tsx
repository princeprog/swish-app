"use client"

import Link from "next/link"
import { CalendarRange } from "lucide-react"

import { OrganizationSchedulesView } from "@/components/organizations/schedules/organization-schedules-view"
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
import { useSchedulesQuery } from "@/hooks/use-schedule"
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
  const organization = organizationsQuery.data?.find((item) => item.slug === slug)
  const leagueSeasonsQuery = useLeagueSeasonsQuery(organization?.id)
  const divisionsQuery = useDivisionsQuery(organization?.id)
  const teamsQuery = useTeamsQuery(organization?.id)
  const venuesQuery = useVenuesQuery(organization?.id)
  const schedulesQuery = useSchedulesQuery(organization?.id)

  if (
    organizationsQuery.isLoading ||
    (organization &&
      (leagueSeasonsQuery.isLoading ||
        divisionsQuery.isLoading ||
        teamsQuery.isLoading ||
        venuesQuery.isLoading ||
        schedulesQuery.isLoading))
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

  if (leagueSeasonsQuery.isError) {
    return (
      <SchedulesEmptyShell
        title="We couldn't load seasons"
        description={getApiErrorMessage(leagueSeasonsQuery.error)}
      />
    )
  }

  if (divisionsQuery.isError) {
    return (
      <SchedulesEmptyShell
        title="We couldn't load divisions"
        description={getApiErrorMessage(divisionsQuery.error)}
      />
    )
  }

  if (teamsQuery.isError) {
    return (
      <SchedulesEmptyShell
        title="We couldn't load teams"
        description={getApiErrorMessage(teamsQuery.error)}
      />
    )
  }

  if (venuesQuery.isError) {
    return (
      <SchedulesEmptyShell
        title="We couldn't load venues"
        description={getApiErrorMessage(venuesQuery.error)}
      />
    )
  }

  if (schedulesQuery.isError) {
    return (
      <SchedulesEmptyShell
        title="We couldn't load schedules"
        description={getApiErrorMessage(schedulesQuery.error)}
      />
    )
  }

  return (
    <OrganizationSchedulesView
      divisions={divisionsQuery.data ?? []}
      organization={organization}
      schedules={schedulesQuery.data ?? []}
      seasons={leagueSeasonsQuery.data ?? []}
      teams={teamsQuery.data ?? []}
      venues={venuesQuery.data ?? []}
    />
  )
}
