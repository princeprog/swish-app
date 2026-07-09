import { OrganizationStandingsScreen } from "@/components/organizations/standings/organization-standings-screen"

type OrganizationStandingsPageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function OrganizationStandingsPage({
  params,
}: OrganizationStandingsPageProps) {
  const { slug } = await params

  return <OrganizationStandingsScreen slug={slug} />
}
