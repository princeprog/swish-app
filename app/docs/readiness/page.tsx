import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DocsShell } from "@/app/docs/_components/docs-shell";
import {
  apiBoundary,
  gameLifecycle,
  invitationFlow,
  mvpUserStories,
  permissionMatrix,
  pilotDefinition,
  publicDataBoundary,
  scorekeeperWorkspaceFlow,
  scoringEvents,
  standingsRules,
} from "@/lib/readiness-docs";

export default function ReadinessPage() {
  return (
    <DocsShell
      eyebrow="Implementation readiness"
      title="The missing planning details before building the MVP."
      summary="This page turns the product idea into implementation-ready rules: user stories, permissions, game lifecycle, scoring events, standings behavior, public data boundaries, pilot scope, and API ownership."
    >
      <Card>
        <CardHeader>
          <CardTitle>MVP User Stories</CardTitle>
          <CardDescription>
            These stories define the first usable product slice without drifting
            into deferred registration, payments, offline mode, or advanced
            stats.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {mvpUserStories.map((story) => (
            <div
              key={story.story}
              className="flex flex-col gap-2 rounded-md border bg-card p-4"
            >
              <Badge variant="secondary" className="w-fit">
                {story.role}
              </Badge>
              <p className="text-sm font-medium leading-6">{story.story}</p>
              <p className="text-sm leading-6 text-muted-foreground">
                Acceptance: {story.acceptance}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
          <CardDescription>
            Permissions should be centralized in the API and mirrored by UI
            affordances in the frontend.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Capability</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Scorekeeper</TableHead>
                <TableHead>Team manager</TableHead>
                <TableHead>Legacy player</TableHead>
                <TableHead>Public</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissionMatrix.map((row) => (
                <TableRow key={row.capability}>
                  <TableCell className="min-w-56 font-medium">
                    {row.capability}
                  </TableCell>
                  <TableCell>{row.owner}</TableCell>
                  <TableCell>{row.admin}</TableCell>
                  <TableCell>{row.scorer}</TableCell>
                  <TableCell>{row.coach}</TableCell>
                  <TableCell>{row.player}</TableCell>
                  <TableCell>{row.publicViewer}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invitation And Staff Access Flow</CardTitle>
          <CardDescription>
            Organization access is owner-managed and enforced centrally by the
            API.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3">
            {invitationFlow.map((item) => (
              <li
                key={item}
                className="rounded-md border bg-card p-3 text-sm leading-6"
              >
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dedicated Scorekeeper Workspace</CardTitle>
          <CardDescription>
            Scorekeepers get an organization-scoped operational view that only
            asks the API for assigned games.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3">
            {scorekeeperWorkspaceFlow.map((item) => (
              <li
                key={item}
                className="rounded-md border bg-card p-3 text-sm leading-6"
              >
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Game Status Lifecycle</CardTitle>
            <CardDescription>
              Status transitions should be explicit because they decide when
              scoring, standings, and public records are official.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {gameLifecycle.map((item) => (
              <div key={item.status} className="rounded-md border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{item.status}</Badge>
                  <span className="text-xs text-muted-foreground">
                    Next: {item.allowedNext}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.meaning}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scoring Event Contract</CardTitle>
            <CardDescription>
              The scoring domain starts with append-only events instead of
              mutable score fields.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {scoringEvents.map((event) => (
              <div key={event.type} className="rounded-md border p-3">
                <p className="font-mono text-xs font-medium">{event.type}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Payload: {event.payload}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Rule: {event.rule}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Standings Rules</CardTitle>
            <CardDescription>
              These rules prevent standings implementation from becoming a
              hidden bundle of assumptions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3">
              {standingsRules.map((rule) => (
                <li
                  key={rule}
                  className="rounded-md border bg-card p-3 text-sm leading-6"
                >
                  {rule}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Public Data Boundary</CardTitle>
            <CardDescription>
              Public pages must feel official without leaking admin-only or
              private operational data.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {publicDataBoundary.map((item) => (
              <div key={item.category} className="rounded-md border p-3">
                <Badge variant="outline">{item.category}</Badge>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.data}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>First Pilot Definition</CardTitle>
            <CardDescription>
              Implementation should optimize for this concrete season shape
              before expanding into broader tournament cases.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3">
              {pilotDefinition.map((item) => (
                <li
                  key={item}
                  className="rounded-md border bg-card p-3 text-sm leading-6"
                >
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Boundary Plan</CardTitle>
            <CardDescription>
              This keeps the Next frontend and Nest backend separate while the
              product contracts mature.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {apiBoundary.map((item) => (
              <div key={item.area} className="rounded-md border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{item.area}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {item.owner}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.boundary}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DocsShell>
  );
}
