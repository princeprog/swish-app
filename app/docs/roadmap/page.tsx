import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DocsShell } from "@/app/docs/_components/docs-shell";
import { roadmapMilestones } from "@/lib/project-docs";

export default function RoadmapPage() {
  return (
    <DocsShell
      eyebrow="MVP roadmap"
      title="Build the league operations loop in five slices."
      summary="The MVP now covers the complete operational loop: competition generation, separate score and statistics consoles, official progression, awards, and public records."
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
            "Payments, waivers, receipts, and evidence uploads",
            "Document-based team compliance requirements",
            "Full offline-first scoring and conflict sync",
            "Shooting attempts, blocks, minutes, shot charts, and advanced analytics",
            "Native mobile apps",
            "Automated venue and time-slot optimization",
          ].map((item) => (
            <p key={item} className="rounded-md border bg-card p-3">
              {item}
            </p>
          ))}
        </CardContent>
      </Card>
    </DocsShell>
  );
}
