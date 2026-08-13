import { DivisionComplianceReviewWorkspace } from "@/components/organizations/compliance/division-compliance-review-detail";

export default async function DivisionRequirementReviewPage({
  params,
}: {
  params: Promise<{
    divisionId: string;
    slug: string;
    submissionId: string;
  }>;
}) {
  const routeParams = await params;

  return (
    <DivisionComplianceReviewWorkspace
      divisionId={routeParams.divisionId}
      slug={routeParams.slug}
      submissionId={routeParams.submissionId}
    />
  );
}

