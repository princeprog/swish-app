"use client"

import Link from "next/link"
import { Users2 } from "lucide-react"

import { OrganizationPlayersView } from "@/components/organizations/organization-players-view"
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
  const divisionsQuery = useDivisionsQuery(organization?.id)
  const teamsQuery = useTeamsQuery(organization?.id)
  const playersQuery = usePlayersQuery(organization?.id)

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
      divisions={divisionsQuery.data ?? []}
      organization={organization}
      players={playersQuery.data ?? []}
      teams={teamsQuery.data ?? []}
    />
  )
}
