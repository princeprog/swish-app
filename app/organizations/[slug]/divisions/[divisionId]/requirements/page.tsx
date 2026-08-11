import { DivisionComplianceScreen } from "@/components/organizations/compliance/division-compliance-screen";

export default function DivisionRequirementsPage({
  params,
}: {
  params: { divisionId: string; slug: string };
}) {
  return (
    <DivisionComplianceScreen
      divisionId={params.divisionId}
      slug={params.slug}
    />
  );
}
