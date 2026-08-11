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
  waived: "Waived",
};

const tones: Record<string, string> = {
  approved: "bg-emerald-600 text-white",
  blocked: "bg-rose-600 text-white",
  cleared: "bg-emerald-600 text-white",
  draft: "bg-muted text-muted-foreground",
  not_required: "bg-muted text-muted-foreground",
  pending: "bg-amber-500 text-white",
  rejected: "bg-amber-500 text-white",
  reopened: "bg-amber-500 text-white",
  submitted: "bg-blue-600 text-white",
  waived: "bg-violet-600 text-white",
};

export function ComplianceStatusBadge({
  status,
}: {
  status: string | null | undefined;
}) {
  const value = status ?? "draft";
  return (
    <Badge className={tones[value] ?? "bg-muted text-muted-foreground"}>
      {labels[value] ?? value.replaceAll("_", " ")}
    </Badge>
  );
}
