import { TeamRosterScreen } from "@/components/organizations/roster/team-roster-screen"

type TeamRosterPageProps = {
  params: Promise<{
    slug: string
    teamId: string
  }>
}

export default async function TeamRosterPage({ params }: TeamRosterPageProps) {
  const { slug, teamId } = await params

  return <TeamRosterScreen slug={slug} teamId={teamId} />
}
