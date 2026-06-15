import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DocsShell } from "@/app/docs/_components/docs-shell"
import { coreLoop, primaryUsers } from "@/lib/project-docs"

export default function DocsPage() {
  return (
    <DocsShell
      eyebrow="Product overview"
      title="A basketball league operating system for real local tournaments."
      summary="The first version should prove the complete league operations loop for Philippine community, school, company, and barangay basketball leagues."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Product Promise</CardTitle>
            <CardDescription>
              Replace spreadsheet-and-paper operations with one trusted league
              record.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm leading-6 text-muted-foreground">
            <p>
              The MVP is not a registration platform, payment system, or full
              sports analytics suite. It is the operational core: setup,
              schedules, scoring, standings, playoffs, and public visibility.
            </p>
            <p>
              The product wins when league staff can run a season without
              standings disputes, unclear playoff qualification, or scattered
              public updates.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Primary Users</CardTitle>
            <CardDescription>
              The system serves league operators first, then everyone who needs
              official information.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {primaryUsers.map((user) => (
              <Badge key={user} variant="outline">
                {user}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Core Loop</CardTitle>
          <CardDescription>
            Every milestone should strengthen this loop instead of drifting into
            nice-to-have features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="grid gap-3 md:grid-cols-2">
            {coreLoop.map((item, index) => (
              <li
                key={item}
                className="flex items-center gap-3 rounded-md border bg-card p-3"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground">
                  {index + 1}
                </span>
                <span className="text-sm font-medium">{item}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </DocsShell>
  )
}
