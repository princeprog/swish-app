import { TeamManagerRequirementsScreen } from "@/components/organizations/compliance/team-manager-requirements-screen";

export default async function RequirementsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const routeParams = await params;
  return <TeamManagerRequirementsScreen slug={routeParams.slug} />;
}
