"use client"

import Link from "next/link"
import { Building2, CalendarDays, ShieldCheck, Trophy } from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
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
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useOrganizationsQuery } from "@/hooks/use-organization"
import { getApiErrorMessage } from "@/hooks/use-auth"

type OrganizationWorkspaceScreenProps = {
  slug: string
}

export function OrganizationWorkspaceScreen({
  slug,
}: OrganizationWorkspaceScreenProps) {
  const organizationsQuery = useOrganizationsQuery()
  const organization = organizationsQuery.data?.find((item) => item.slug === slug)

  if (organizationsQuery.isLoading) {
    return (
      <main className="min-h-screen bg-background p-6 text-foreground">
        <div className="mx-auto max-w-6xl space-y-6">
          <Skeleton className="h-12 w-72" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </main>
    )
  }

  if (organizationsQuery.isError) {
    return (
      <main className="min-h-screen bg-background p-6 text-foreground">
        <div className="mx-auto max-w-3xl">
          <Empty className="border bg-card">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Building2 className="size-5" />
              </EmptyMedia>
              <EmptyTitle>We couldn&apos;t load this organization</EmptyTitle>
              <EmptyDescription>
                {getApiErrorMessage(organizationsQuery.error)}
              </EmptyDescription>
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

  if (!organization) {
    return (
      <main className="min-h-screen bg-background p-6 text-foreground">
        <div className="mx-auto max-w-3xl">
          <Empty className="border bg-card">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Building2 className="size-5" />
              </EmptyMedia>
              <EmptyTitle>Organization not found</EmptyTitle>
              <EmptyDescription>
                This workspace does not exist or you do not have access to it.
              </EmptyDescription>
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

  const overviewCards = [
    {
      icon: Trophy,
      label: "Workspace",
      value: organization.status,
    },
    {
      icon: Building2,
      label: "Organization slug",
      value: organization.slug,
    },
    {
      icon: CalendarDays,
      label: "Last updated",
      value: new Date(organization.updated_at).toLocaleDateString(),
    },
    {
      icon: ShieldCheck,
      label: "Access scope",
      value: "Organization only",
    },
  ]

  return (
    <SidebarProvider>
      <AppSidebar
        organization={{
          name: organization.name,
          slug: organization.slug,
          status: organization.status,
        }}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink asChild>
                    <Link href="/organizations">Organizations</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{organization.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-6 p-6">
          <section className="space-y-2">
            <p className="text-sm text-muted-foreground">Organization workspace</p>
            <h1 className="text-3xl font-semibold tracking-tight">
              {organization.name}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              This workspace is scoped to the selected organization. Seasons,
              divisions, teams, venues, and public pages should all flow from this
              organization context.
            </p>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {overviewCards.map((card) => {
              const Icon = card.icon

              return (
                <div
                  key={card.label}
                  className="rounded-xl border bg-card p-4 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{card.label}</p>
                      <p className="mt-2 text-lg font-semibold">{card.value}</p>
                    </div>
                    <div className="rounded-lg border p-2 text-muted-foreground">
                      <Icon className="size-4" />
                    </div>
                  </div>
                </div>
              )
            })}
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
            <div className="rounded-xl border bg-card p-5 shadow-xs">
              <h2 className="text-base font-semibold">What belongs here</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Everything in this view should resolve against{" "}
                <span className="font-medium text-foreground">
                  {organization.name}
                </span>
                .
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border bg-background/60 p-4">
                  <p className="text-sm font-medium">Competition setup</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Divisions, seasons, formats, schedules, and playoff structure.
                  </p>
                </div>
                <div className="rounded-lg border bg-background/60 p-4">
                  <p className="text-sm font-medium">People and teams</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Teams, players, staff roles, and organization membership.
                  </p>
                </div>
                <div className="rounded-lg border bg-background/60 p-4">
                  <p className="text-sm font-medium">Game operations</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Venues, scoring workflows, official results, and corrections.
                  </p>
                </div>
                <div className="rounded-lg border bg-background/60 p-4">
                  <p className="text-sm font-medium">Public portal</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Standings, schedules, rosters, brackets, and published records.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-5 shadow-xs">
              <h2 className="text-base font-semibold">Next steps</h2>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li className="rounded-lg border bg-background/60 px-4 py-3">
                  Replace the placeholder navigation with organization-aware modules.
                </li>
                <li className="rounded-lg border bg-background/60 px-4 py-3">
                  Persist the active organization in the frontend auth/workspace state.
                </li>
                <li className="rounded-lg border bg-background/60 px-4 py-3">
                  Scope backend queries by organization id, not just by route slug.
                </li>
              </ul>
            </div>
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
