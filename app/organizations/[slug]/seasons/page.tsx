import { OrganizationSeasonsScreen } from "@/components/organizations/organization-seasons-screen"

type OrganizationSeasonsPageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function OrganizationSeasonsPage({
  params,
}: OrganizationSeasonsPageProps) {
  const { slug } = await params

  return <OrganizationSeasonsScreen slug={slug} />
}
