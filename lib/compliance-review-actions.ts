import type { ComplianceWorkflowStatus } from "@/services/compliance.service"

export type ComplianceReviewAction =
  | "approve"
  | "request_changes"
  | "reopen"
  | "waive"

export function availableComplianceReviewActions(
  status: ComplianceWorkflowStatus,
): ComplianceReviewAction[] {
  switch (status) {
    case "submitted":
    case "under_review":
      return ["approve", "request_changes", "waive"]
    case "rejected":
      return ["reopen", "waive"]
    case "approved":
    case "waived":
      return ["reopen"]
    case "draft":
    case "reopened":
      return ["waive"]
  }
}
