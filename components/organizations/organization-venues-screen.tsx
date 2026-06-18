"use client"

import Link from "next/link"
import { MapPin } from "lucide-react"

import { OrganizationVenuesView } from "@/components/organizations/organization-venues-view"
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
import { useLeagueSeasonsQuery } from "@/hooks/use-league-season"
import { useOrganizationsQuery } from "@/hooks/use-organization"
import { useVenuesQuery } from "@/hooks/use-venue"

type OrganizationVenuesScreenProps = {
  slug: string
}

function VenuesLoadingState() {
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

function VenuesEmptyShell({
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
              <MapPin className="size-5" />
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

export function OrganizationVenuesScreen({ slug }: OrganizationVenuesScreenProps) {
  const organizationsQuery = useOrganizationsQuery()
  const organization = organizationsQuery.data?.find((item) => item.slug === slug)
  const seasonsQuery = useLeagueSeasonsQuery(organization?.id)
  const venuesQuery = useVenuesQuery(organization?.id)

  if (
    organizationsQuery.isLoading ||
    (organization && (seasonsQuery.isLoading || venuesQuery.isLoading))
  ) {
    return <VenuesLoadingState />
  }

  if (organizationsQuery.isError) {
    return (
      <VenuesEmptyShell
        title="We couldn't load this organization"
        description={getApiErrorMessage(organizationsQuery.error)}
      />
    )
  }

  if (!organization) {
    return (
      <VenuesEmptyShell
        title="Organization not found"
        description="This workspace does not exist or you do not have access to it."
      />
    )
  }

  if (seasonsQuery.isError) {
    return (
      <VenuesEmptyShell
        title="We couldn't load league seasons"
        description={getApiErrorMessage(seasonsQuery.error)}
      />
    )
  }

  if (venuesQuery.isError) {
    return (
      <VenuesEmptyShell
        title="We couldn't load venues"
        description={getApiErrorMessage(venuesQuery.error)}
      />
    )
  }

  return (
    <OrganizationVenuesView
      organization={organization}
      seasons={seasonsQuery.data ?? []}
      venues={venuesQuery.data ?? []}
    />
  )
}
