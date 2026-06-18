import { OrganizationPlayersScreen } from "@/components/organizations/players/organization-players-screen"

type OrganizationPlayersPageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function OrganizationPlayersPage({
  params,
}: OrganizationPlayersPageProps) {
  const { slug } = await params

  return <OrganizationPlayersScreen slug={slug} />
}
