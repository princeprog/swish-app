import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DocsShell } from "@/app/docs/_components/docs-shell"
import { MermaidDiagram } from "@/app/docs/_components/mermaid-diagram"
import { diagrams, schemaGroups } from "@/lib/diagram-docs"

export default function DiagramsPage() {
  return (
    <DocsShell
      eyebrow="System diagrams"
      title="Visual maps for the Basketball League OS product plan."
      summary="These diagrams capture the planning model for database groups, the MVP user journey, role access, invitations, and scoring event flow."
    >
      <Card>
        <CardHeader>
          <CardTitle>PostgreSQL Schema Groups</CardTitle>
          <CardDescription>
            Planning-level grouping for future backend and database work. The
            Nest API will live outside this docs app when implementation starts.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Schema</TableHead>
                <TableHead>Tables</TableHead>
                <TableHead>Purpose</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schemaGroups.map((group) => (
                <TableRow key={group.schema}>
                  <TableCell className="font-mono text-xs">
                    {group.schema}
                  </TableCell>
                  <TableCell className="min-w-64 text-sm">
                    {group.tables}
                  </TableCell>
                  <TableCell className="min-w-72 text-sm text-muted-foreground">
                    {group.purpose}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-6">
        {diagrams.map((diagram) => (
          <Card key={diagram.title}>
            <CardHeader>
              <CardTitle>{diagram.title}</CardTitle>
              <CardDescription>{diagram.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <MermaidDiagram chart={diagram.source} />
            </CardContent>
          </Card>
        ))}
      </div>
    </DocsShell>
  )
}
