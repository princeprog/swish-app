import Link from "next/link"
import { ArrowRight, Building2, Plus, Trophy } from "lucide-react"

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

const organizations = [
  {
    activeSeason: "Season 1",
    initials: "SL",
    name: "Swish League",
    role: "Owner",
    slug: "swish-league",
    teams: 12,
  },
  {
    activeSeason: "Summer Cup",
    initials: "BC",
    name: "Barangay Central League",
    role: "Admin",
    slug: "barangay-central",
    teams: 8,
  },
  {
    activeSeason: "Company Open",
    initials: "MO",
    name: "Metro Office Basketball",
    role: "Scorer",
    slug: "metro-office",
    teams: 10,
  },
]

export default function SelectOrganizationPage() {
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
                Choose where you want to continue. Each organization keeps its
                own seasons, rosters, venues, and competition setup.
              </p>
            </div>
          </div>

          <Button className="h-11 rounded-full px-5" asChild>
            <Link href="/docs">Back to docs</Link>
          </Button>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {organizations.map((organization) => (
            <Card key={organization.slug} className="border bg-card shadow-xs">
              <CardHeader className="gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar size="lg">
                      <AvatarFallback>{organization.initials}</AvatarFallback>
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

                  <Badge variant="secondary">{organization.role}</Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border bg-background/60 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      Active season
                    </p>
                    <p className="mt-2 text-sm font-medium">
                      {organization.activeSeason}
                    </p>
                  </div>

                  <div className="rounded-lg border bg-background/60 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      Teams
                    </p>
                    <p className="mt-2 text-sm font-medium">
                      {organization.teams} registered
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

          <Card className="border-dashed bg-card/70 shadow-none">
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
                Set up the organization record first, then add seasons,
                divisions, teams, players, venues, and public pages.
              </div>

              <Button className="w-full" asChild>
                <Link href="/signup">Create organization</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
