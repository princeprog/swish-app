import { DivisionComplianceScreen } from "@/components/organizations/compliance/division-compliance-screen";

export default async function DivisionRequirementsPage({
  params,
}: {
  params: Promise<{ divisionId: string; slug: string }>;
}) {
  const routeParams = await params;
  return (
    <DivisionComplianceScreen
      divisionId={routeParams.divisionId}
      slug={routeParams.slug}
    />
  );
}
