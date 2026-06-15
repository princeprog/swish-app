import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DocsShell } from "@/app/docs/_components/docs-shell"
import { successSignals } from "@/lib/project-docs"

export default function SuccessPage() {
  return (
    <DocsShell
      eyebrow="Success definition"
      title="A successful MVP runs one complete real league with trusted official records."
      summary="The first target is not feature parity with large commercial sports platforms. The target is operational confidence for a real basketball league season."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {successSignals.map((signal) => (
          <Card key={signal.label}>
            <CardHeader>
              <signal.icon aria-hidden="true" />
              <CardTitle>{signal.label}</CardTitle>
              <CardDescription>{signal.text}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Acceptance Story</CardTitle>
          <CardDescription>
            The clearest test is a season story, not a checklist of screens.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm leading-6 text-muted-foreground">
          <p>
            A commissioner creates a league, adds known teams and players,
            configures the format, schedules games, assigns scorers, and shares
            the public page. Scorers record games online and finalize results.
          </p>
          <p>
            Standings update from finalized games, unresolved ties ask for an
            admin decision with a visible reason, playoff brackets progress
            correctly, and public viewers can see official schedules, rosters,
            results, standings, and brackets without private information.
          </p>
        </CardContent>
      </Card>
    </DocsShell>
  )
}
