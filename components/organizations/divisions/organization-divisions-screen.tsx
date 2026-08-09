"use client"

import Link from "next/link"
import { Layers3 } from "lucide-react"

import { OrganizationDivisionsView } from "@/components/organizations/divisions/organization-divisions-view"
import { ComponentReveal, PageEntrance } from "@/components/motion/page-motion"
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
import { useTablePaginationState } from "@/hooks/use-table-pagination-state"
import { getDefaultPaginationMeta } from "@/services/pagination"

type OrganizationDivisionsScreenProps = {
  slug: string
}

function DivisionsLoadingState() {
  return (
    <PageEntrance asChild>
      <main className="min-h-screen bg-background p-6 text-foreground">
        <ComponentReveal asChild>
          <div className="mx-auto max-w-7xl space-y-6">
            <Skeleton className="h-10 w-80 rounded-xl" />
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-[420px] rounded-2xl" />
          </div>
        </ComponentReveal>
      </main>
    </PageEntrance>
  )
}

function DivisionsEmptyShell({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <PageEntrance asChild>
      <main className="min-h-screen bg-background p-6 text-foreground">
        <ComponentReveal asChild>
          <div className="mx-auto max-w-3xl">
            <Empty className="border bg-card">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Layers3 className="size-5" />
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
        </ComponentReveal>
      </main>
    </PageEntrance>
  )
}

export function OrganizationDivisionsScreen({
  slug,
}: OrganizationDivisionsScreenProps) {
  const organizationsQuery = useOrganizationsQuery()
  const organization = organizationsQuery.data?.find((item) => item.slug === slug)
  const tablePagination = useTablePaginationState()
  const seasonsQuery = useLeagueSeasonsQuery(organization?.id, { pageSize: 50 })
  const divisionsQuery = useDivisionsQuery(organization?.id, tablePagination.params)

  if (
    organizationsQuery.isLoading ||
    (organization && (seasonsQuery.isLoading || divisionsQuery.isLoading))
  ) {
    return <DivisionsLoadingState />
  }

  if (organizationsQuery.isError) {
    return (
      <DivisionsEmptyShell
        title="We couldn't load this organization"
        description={getApiErrorMessage(organizationsQuery.error)}
      />
    )
  }

  if (!organization) {
    return (
      <DivisionsEmptyShell
        title="Organization not found"
        description="This workspace does not exist or you do not have access to it."
      />
    )
  }

  if (seasonsQuery.isError) {
    return (
      <DivisionsEmptyShell
        title="We couldn't load league seasons"
        description={getApiErrorMessage(seasonsQuery.error)}
      />
    )
  }

  if (divisionsQuery.isError) {
    return (
      <DivisionsEmptyShell
        title="We couldn't load divisions"
        description={getApiErrorMessage(divisionsQuery.error)}
      />
    )
  }

  return (
    <OrganizationDivisionsView
      divisions={divisionsQuery.data?.data ?? []}
      organization={organization}
      pagination={divisionsQuery.data?.pagination ?? getDefaultPaginationMeta()}
      seasons={seasonsQuery.data?.data ?? []}
      onPageChange={tablePagination.setPage}
      onPageSizeChange={tablePagination.setPageSize}
    />
  )
}
