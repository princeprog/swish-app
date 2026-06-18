"use client"

import { Trophy } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import type { Organization } from "@/services/organization.service"

export function WorkspaceHeroCard({
  organization,
}: {
  organization: Organization
}) {
  return (
    <Card className="overflow-hidden border border-border/60 bg-card/95 shadow-none">
      <CardContent className="p-0">
        <div className="grid gap-5 p-5 md:grid-cols-[88px_minmax(0,1fr)]">
          <div className="flex size-[88px] items-center justify-center rounded-2xl border border-border/70 bg-background/70">
            <div className="flex size-14 items-center justify-center rounded-full border border-border/60 bg-card">
              <Trophy className="size-6 text-primary" />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight">
                    {organization.name}
                  </h1>
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-300">
                    Active
                  </span>
                </div>

                <div className="inline-flex items-center gap-2 rounded-md border border-border/70 bg-background/60 px-2.5 py-1 text-xs text-muted-foreground">
                  <span>SLUG</span>
                  <span className="font-medium text-foreground">
                    {organization.slug}
                  </span>
                </div>

                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                  Official workspace for league operations, competition setup,
                  scoring, standings, playoffs, and public publishing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
