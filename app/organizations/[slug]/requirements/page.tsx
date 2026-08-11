import { TeamManagerRequirementsScreen } from "@/components/organizations/compliance/team-manager-requirements-screen";

export default function RequirementsPage({
  params,
}: {
  params: { slug: string };
}) {
  return <TeamManagerRequirementsScreen slug={params.slug} />;
}
