import { OrganizationTeamsScreen } from "@/components/organizations/teams/organization-teams-screen"

type OrganizationTeamsPageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function OrganizationTeamsPage({
  params,
}: OrganizationTeamsPageProps) {
  const { slug } = await params

  return <OrganizationTeamsScreen slug={slug} />
}
