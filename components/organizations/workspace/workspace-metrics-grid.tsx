"use client"

import { ArrowRight } from "lucide-react"

import {
  ComponentReveal,
  RevealGroup,
} from "@/components/motion/page-motion"
import { Card, CardContent } from "@/components/ui/card"
import type { Metric } from "@/components/organizations/workspace/organization-workspace-data"

function MetricCard({ metric }: { metric: Metric }) {
  const Icon = metric.icon

  return (
    <Card className="border border-border/60 bg-card/95 shadow-none">
      <CardContent className="px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon className="size-4" />
              <span>{metric.label}</span>
            </div>
            <p className="text-3xl font-semibold tracking-tight">{metric.value}</p>
            <div className="inline-flex items-center gap-1 text-sm text-muted-foreground">
              <span>{metric.action}</span>
              <ArrowRight className="size-4" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function WorkspaceMetricsGrid({
  metrics,
}: {
  metrics: Metric[]
}) {
  return (
    <RevealGroup asChild pace="compact" phase="secondary">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {metrics.map((metric) => (
          <ComponentReveal key={metric.label}>
            <MetricCard metric={metric} />
          </ComponentReveal>
        ))}
      </section>
    </RevealGroup>
  )
}
