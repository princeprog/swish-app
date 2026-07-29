import { StaffAccessScreen } from "@/components/organizations/members/staff-access-screen"

export default async function MembersPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  return <StaffAccessScreen slug={slug} />
}
