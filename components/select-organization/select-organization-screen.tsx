"use client"

import Link from "next/link"
import * as React from "react"
import { ArrowRight, Building2, Loader2, Plus, Trophy } from "lucide-react"
import { toast } from "sonner"

import { getApiErrorMessage } from "@/hooks/use-auth"
import {
  useCreateOrganizationMutation,
  useOrganizationsQuery,
} from "@/hooks/use-organization"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

function getOrganizationInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function slugifyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
}

function OrganizationCardSkeleton() {
  return (
    <Card className="border bg-card shadow-xs">
      <CardHeader className="gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="size-14 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>
      </CardContent>
    </Card>
  )
}

function CreateOrganizationFormCard({
  compact = false,
}: {
  compact?: boolean
}) {
  const createOrganizationMutation = useCreateOrganizationMutation()
  const [name, setName] = React.useState("")
  const [slug, setSlug] = React.useState("")
  const [validationError, setValidationError] = React.useState<string | null>(
    null,
  )

  function resetForm() {
    setName("")
    setSlug("")
    setValidationError(null)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!name.trim()) {
      setValidationError("Organization name is required.")
      return
    }

    if (!slug.trim()) {
      setValidationError("Organization slug is required.")
      return
    }

    setValidationError(null)

    try {
      const organization = await createOrganizationMutation.mutateAsync({
        name: name.trim(),
        slug: slug.trim(),
      })
      toast.success(`Created ${organization.name}`)
      resetForm()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  return (
    <Card
      className={cn(
        "border-dashed bg-card/70 shadow-none",
        compact && "shadow-xs",
      )}
    >
      <CardHeader>
        <div className="flex size-12 items-center justify-center rounded-full border bg-background">
          <Plus className="size-5" />
        </div>
        <CardTitle className="text-xl">Create a new organization</CardTitle>
        <CardDescription>
          Start a new league shell for a school, barangay, company, or
          community tournament.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="rounded-lg border bg-background/60 px-4 py-3 text-sm leading-6 text-muted-foreground">
          Set up the organization record first, then add seasons, divisions,
          teams, players, venues, and public pages.
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <Field>
            <FieldLabel htmlFor="organization-name">Organization name</FieldLabel>
            <FieldContent>
              <Input
                id="organization-name"
                placeholder="Barangay Central League"
                value={name}
                onChange={(event) => {
                  const nextName = event.target.value
                  setName(nextName)

                  if (!slug.trim() || slug === slugifyName(name)) {
                    setSlug(slugifyName(nextName))
                  }
                }}
              />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="organization-slug">Organization slug</FieldLabel>
            <FieldContent>
              <Input
                id="organization-slug"
                placeholder="barangay-central-league"
                value={slug}
                onChange={(event) => setSlug(slugifyName(event.target.value))}
              />
              <p className="text-sm text-muted-foreground">
                Lowercase letters, numbers, and hyphens only.
              </p>
            </FieldContent>
          </Field>

          {validationError || createOrganizationMutation.isError ? (
            <FieldError>
              {validationError ??
                getApiErrorMessage(createOrganizationMutation.error)}
            </FieldError>
          ) : null}

          <Button
            type="submit"
            className="w-full"
            disabled={createOrganizationMutation.isPending}
          >
            {createOrganizationMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating
              </>
            ) : (
              "Create organization"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export function SelectOrganizationScreen() {
  const organizationsQuery = useOrganizationsQuery()
  const organizations = organizationsQuery.data ?? []

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-3 text-sm font-medium">
              <span className="flex size-10 items-center justify-center rounded-full border bg-background shadow-xs">
                <Trophy className="size-4" />
              </span>
              <span>Swish League OS</span>
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Select an organization
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Choose where you want to continue. Each organization keeps its own
                seasons, rosters, venues, and competition setup.
              </p>
            </div>
          </div>
        </div>

        {organizationsQuery.isLoading ? (
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <OrganizationCardSkeleton />
            <OrganizationCardSkeleton />
          </div>
        ) : organizationsQuery.isError ? (
          <div className="mt-10">
            <Empty className="border bg-card">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Building2 className="size-5" />
                </EmptyMedia>
                <EmptyTitle>We couldn&apos;t load your organizations</EmptyTitle>
                <EmptyDescription>
                  {getApiErrorMessage(organizationsQuery.error)}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={() => organizationsQuery.refetch()}>
                  Try again
                </Button>
              </EmptyContent>
            </Empty>
          </div>
        ) : organizations.length === 0 ? (
          <div className="mt-10">
            <Empty className="border bg-card">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Building2 className="size-5" />
                </EmptyMedia>
                <EmptyTitle>No organizations yet</EmptyTitle>
                <EmptyDescription>
                  Create your first organization to start managing seasons,
                  divisions, teams, players, venues, and public pages.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <div className="w-full max-w-md">
                  <CreateOrganizationFormCard compact />
                </div>
              </EmptyContent>
            </Empty>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {organizations.map((organization) => (
              <Card key={organization.id} className="border bg-card shadow-xs">
                <CardHeader className="gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar size="lg">
                        <AvatarFallback>
                          {getOrganizationInitials(organization.name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="space-y-1">
                        <CardTitle className="text-xl">
                          {organization.name}
                        </CardTitle>
                        <CardDescription>
                          swish.app/{organization.slug}
                        </CardDescription>
                      </div>
                    </div>

                    <Badge
                      variant="secondary"
                      className={cn(
                        organization.status === "active"
                          ? ""
                          : "text-muted-foreground",
                      )}
                    >
                      {organization.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border bg-background/60 px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        Organization ID
                      </p>
                      <p className="mt-2 truncate text-sm font-medium">
                        {organization.id}
                      </p>
                    </div>

                    <div className="rounded-lg border bg-background/60 px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        Updated
                      </p>
                      <p className="mt-2 text-sm font-medium">
                        {new Date(organization.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="size-4" />
                      <span>Open workspace</span>
                    </div>

                    <Button asChild>
                      <Link href="/docs">
                        Continue
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            <CreateOrganizationFormCard />
          </div>
        )}
      </div>
    </main>
  )
}
