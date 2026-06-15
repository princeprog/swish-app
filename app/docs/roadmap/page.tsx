import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DocsShell } from "@/app/docs/_components/docs-shell"
import { roadmapMilestones } from "@/lib/project-docs"

export default function RoadmapPage() {
  return (
    <DocsShell
      eyebrow="MVP roadmap"
      title="Build the league operations loop in five slices."
      summary="The roadmap keeps the MVP broad enough to run a real league, but thin enough to avoid registration, payments, offline mode, and advanced stats too early."
    >
      <div className="flex flex-col gap-4">
        {roadmapMilestones.map((milestone, index) => (
          <Card key={milestone.name}>
            <CardHeader>
              <CardDescription>Milestone {index + 1}</CardDescription>
              <CardTitle>{milestone.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">
              {milestone.outcome}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deferred On Purpose</CardTitle>
          <CardDescription>
            These features matter, but they should not block the first
            successful league pilot.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-2">
          {[
            "Team registration forms",
            "Payments, waivers, receipts, and document uploads",
            "Offline-first scoring and sync",
            "Full box score stats and shot charts",
            "Native mobile apps",
            "Automated schedule generation",
          ].map((item) => (
            <p key={item} className="rounded-md border bg-card p-3">
              {item}
            </p>
          ))}
        </CardContent>
      </Card>
    </DocsShell>
  )
}
