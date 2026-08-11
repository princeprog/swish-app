import { Badge } from "@/components/ui/badge";

const labels: Record<string, string> = {
  approved: "Approved",
  blocked: "Blocked",
  cleared: "Cleared",
  draft: "Draft",
  not_required: "Not required",
  pending: "Needs attention",
  rejected: "Changes requested",
  reopened: "Reopened",
  submitted: "Submitted",
  under_review: "Under review",
  waived: "Waived",
  required: "Required",
  optional: "Optional",
};

const tones: Record<
  string,
  "default" | "secondary" | "destructive" | "outline" | "ghost"
> = {
  approved: "default",
  blocked: "destructive",
  cleared: "default",
  draft: "secondary",
  not_required: "secondary",
  optional: "secondary",
  pending: "secondary",
  rejected: "destructive",
  reopened: "secondary",
  required: "outline",
  submitted: "default",
  under_review: "secondary",
  waived: "outline",
};

export function ComplianceStatusBadge({
  status,
}: {
  status: string | null | undefined;
}) {
  const value = status ?? "draft";
  return <Badge variant={tones[value] ?? "secondary"}>{labels[value] ?? value.replaceAll("_", " ")}</Badge>;
}
