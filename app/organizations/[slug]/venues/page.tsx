import { OrganizationVenuesScreen } from "@/components/organizations/venues/organization-venues-screen"

type OrganizationVenuesPageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function OrganizationVenuesPage({
  params,
}: OrganizationVenuesPageProps) {
  const { slug } = await params

  return <OrganizationVenuesScreen slug={slug} />
}
