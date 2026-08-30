import { CompetitionWorkspaceScreen } from "@/components/organizations/competition/competition-workspace-screen"

export default async function CompetitionPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <CompetitionWorkspaceScreen slug={slug} />
}
