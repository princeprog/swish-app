import { OrganizationDivisionsScreen } from "@/components/organizations/divisions/organization-divisions-screen"

type OrganizationDivisionsPageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function OrganizationDivisionsPage({
  params,
}: OrganizationDivisionsPageProps) {
  const { slug } = await params

  return <OrganizationDivisionsScreen slug={slug} />
}
