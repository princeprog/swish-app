import { OrganizationSchedulesScreen } from "@/components/organizations/schedules/organization-schedules-screen"

type OrganizationSchedulesPageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function OrganizationSchedulesPage({
  params,
}: OrganizationSchedulesPageProps) {
  const { slug } = await params

  return <OrganizationSchedulesScreen slug={slug} />
}
