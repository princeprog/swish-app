import { OrganizationWorkspaceScreen } from "@/components/organizations/organization-workspace-screen"

type OrganizationWorkspacePageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function OrganizationWorkspacePage({
  params,
}: OrganizationWorkspacePageProps) {
  const { slug } = await params

  return <OrganizationWorkspaceScreen slug={slug} />
}
