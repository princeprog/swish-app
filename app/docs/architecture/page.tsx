import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DocsShell } from "@/app/docs/_components/docs-shell"
import { domainCards } from "@/lib/project-docs"

export default function ArchitecturePage() {
  return (
    <DocsShell
      eyebrow="System architecture"
      title="Clear domains first, stack decisions second."
      summary="The product should be organized around league operations: administration, competition rules, scoring, public publishing, and access control."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {domainCards.map((domain) => (
          <Card key={domain.title}>
            <CardHeader>
              <domain.icon aria-hidden="true" />
              <CardTitle>{domain.title}</CardTitle>
              <CardDescription>{domain.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Official Data Flow</CardTitle>
          <CardDescription>
            The product should always make it obvious which data is draft, live,
            finalized, or public.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm leading-6 text-muted-foreground md:grid-cols-2">
          <p>
            Admins create the organization, league season, divisions, teams,
            players, venues, game schedules, format rules, tiebreakers, and role
            assignments. This is the administrative source of truth.
          </p>
          <p>
            Scorers record game events during assigned games. Finalized games
            become official inputs to standings, qualifiers, brackets, and
            public records. Corrections must be append-only and explainable.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Boundaries To Preserve</CardTitle>
          <CardDescription>
            These boundaries keep future implementation from becoming one large
            tangled dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-2">
          {[
            "Public pages read official league data but never expose admin settings or audit internals.",
            "Scoring uses a game event log, while league setup remains ordinary CRUD-style records.",
            "Standings only use finalized games unless a future feature explicitly marks live standings as unofficial.",
            "Role checks are centralized and mirrored by UI affordances, not hidden inside individual screens.",
          ].map((item) => (
            <p key={item} className="rounded-md border bg-card p-3 leading-6">
              {item}
            </p>
          ))}
        </CardContent>
      </Card>
    </DocsShell>
  )
}
