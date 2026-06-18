"use client"

import {
  operationsReadinessItems,
  publicPortalItems,
  staffPermissionRows,
  type ReadinessItem,
} from "@/components/organizations/workspace/organization-workspace-data"
import { statusClasses } from "@/components/organizations/workspace/organization-workspace-utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function ReadinessList({
  title,
  items,
  footer,
}: {
  title: string
  items: ReadinessItem[]
  footer?: React.ReactNode
}) {
  const completeCount = items.filter((item) => item.tone === "complete").length
  const percentage = Math.round((completeCount / items.length) * 100)

  return (
    <Card className="border border-border/60 bg-card/95 shadow-none">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardAction>
          <div className="flex items-center gap-3 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300">
            <span className="text-base font-semibold">{percentage}%</span>
            <span>Complete</span>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-background/50 px-3 py-3"
            >
              <span className="text-sm">{item.label}</span>
              <span
                className={`rounded-full border px-2 py-1 text-xs font-medium ${statusClasses(item.tone)}`}
              >
                {item.status}
              </span>
            </div>
          ))}
        </div>
        {footer ? <div className="pt-2">{footer}</div> : null}
      </CardContent>
    </Card>
  )
}

function StaffPermissionsCard() {
  return (
    <Card className="border border-border/60 bg-card/95 shadow-none">
      <CardHeader>
        <CardTitle>Staff & permissions</CardTitle>
        <CardAction>
          <Button size="sm" variant="ghost">
            View all staff
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        {staffPermissionRows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 px-4 py-3"
          >
            <span className="text-sm">{label}</span>
            <span className="text-sm font-semibold">{value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function WorkspaceSidePanels() {
  return (
    <div className="grid gap-6">
      <ReadinessList
        title="Operations readiness"
        items={operationsReadinessItems}
        footer={
          <Button variant="ghost" className="w-full">
            View setup guide
          </Button>
        }
      />

      <ReadinessList
        title="Public portal health"
        items={publicPortalItems}
        footer={
          <div className="space-y-3">
            <div className="rounded-lg border border-border/50 bg-background/50 px-3 py-3 text-sm text-muted-foreground">
              <div>Last published</div>
              <div className="mt-1 font-medium text-foreground">
                May 14, 2026 8:30 AM
              </div>
            </div>
            <Button variant="outline" className="w-full">
              View public page
            </Button>
          </div>
        }
      />

      <StaffPermissionsCard />
    </div>
  )
}
