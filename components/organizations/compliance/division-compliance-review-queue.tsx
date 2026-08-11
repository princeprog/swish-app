"use client";

import * as React from "react";
import { Check, FileCheck2, MessageSquareText } from "lucide-react";
import { toast } from "sonner";

import { ComplianceStatusBadge } from "@/components/organizations/compliance/compliance-status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/hooks/use-auth";
import {
  useComplianceReviewMutation,
  useComplianceReviewQueueQuery,
  useDivisionComplianceOverviewQuery,
} from "@/hooks/use-compliance";

export function DivisionComplianceReviewQueue({
  divisionId,
  organizationId,
}: {
  divisionId: string;
  organizationId: string;
}) {
  const overviewQuery = useDivisionComplianceOverviewQuery(
    organizationId,
    divisionId,
  );
  const queueQuery = useComplianceReviewQueueQuery(organizationId, divisionId);
  const [reasonFor, setReasonFor] = React.useState<{
    requirementId: string;
    teamId: string;
  } | null>(null);
  const [reason, setReason] = React.useState("");

  if (overviewQuery.isLoading || queueQuery.isLoading) {
    return (
      <Skeleton aria-label="Loading review queue" className="h-72 rounded-lg" />
    );
  }
  if (overviewQuery.isError || queueQuery.isError) {
    const error = overviewQuery.error ?? queueQuery.error;
    return (
      <Empty className="border bg-card">
        <EmptyHeader>
          <EmptyTitle>We couldn&apos;t load the review queue</EmptyTitle>
          <EmptyDescription>{getApiErrorMessage(error)}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const rows = queueQuery.data?.data ?? [];
  const counts = overviewQuery.data?.counts;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["Needs review", counts?.pending ?? 0],
          ["Blocked", counts?.blocked ?? 0],
          ["Cleared", counts?.cleared ?? 0],
          ["Not required", counts?.not_required ?? 0],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-2xl">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Review queue</CardTitle>
          <CardDescription>
            Check submitted items and send clear next steps when something needs
            changes.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!rows.length ? (
            <Empty className="border-0">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileCheck2 className="size-5" />
                </EmptyMedia>
                <EmptyTitle>Nothing needs review</EmptyTitle>
                <EmptyDescription>
                  Submitted requirements will appear here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="divide-y">
              {rows.map((row) => (
                <ReviewRow
                  key={row.submission_id}
                  onReason={() => {
                    setReasonFor({
                      requirementId: row.requirement_id,
                      teamId: row.team_id,
                    });
                    setReason("");
                  }}
                  organizationId={organizationId}
                  row={row}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {reasonFor ? (
        <ReasonPanel
          onClose={() => setReasonFor(null)}
          onReasonChange={setReason}
          organizationId={organizationId}
          reason={reason}
          requirementId={reasonFor.requirementId}
          teamId={reasonFor.teamId}
        />
      ) : null}
    </div>
  );
}

function ReviewRow({
  onReason,
  organizationId,
  row,
}: {
  onReason: () => void;
  organizationId: string;
  row: {
    requirement_id: string;
    requirement_title: string;
    submission_id: string;
    team_id: string;
    team_name: string;
    workflow_status: string;
  };
}) {
  const review = useComplianceReviewMutation(
    organizationId,
    row.team_id,
    row.requirement_id,
  );
  async function approve() {
    try {
      await review.approve.mutateAsync();
      toast.success("Requirement approved");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }
  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{row.team_name}</p>
          <ComplianceStatusBadge status={row.workflow_status} />
        </div>
        <p className="text-sm text-muted-foreground">{row.requirement_title}</p>
      </div>
      <div className="flex gap-2">
        <Button disabled={review.approve.isPending} size="sm" onClick={approve}>
          <Check className="size-4" />
          Approve
        </Button>
        <Button
          disabled={review.requestChanges.isPending}
          size="sm"
          variant="outline"
          onClick={onReason}
        >
          <MessageSquareText className="size-4" />
          Request changes
        </Button>
      </div>
    </div>
  );
}

function ReasonPanel({
  onClose,
  onReasonChange,
  organizationId,
  reason,
  requirementId,
  teamId,
}: {
  onClose: () => void;
  onReasonChange: (value: string) => void;
  organizationId: string;
  reason: string;
  requirementId: string;
  teamId: string;
}) {
  const review = useComplianceReviewMutation(
    organizationId,
    teamId,
    requirementId,
  );
  async function save() {
    try {
      await review.requestChanges.mutateAsync(reason.trim());
      toast.success("Changes requested");
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Request changes</CardTitle>
          <CardDescription>
            Tell the team manager what to update before they submit again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            aria-label="Reason for requested changes"
            autoFocus
            placeholder="Example: Upload a clearer copy with all pages visible."
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              disabled={!reason.trim() || review.requestChanges.isPending}
              onClick={save}
            >
              {review.requestChanges.isPending ? "Sending" : "Send note"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
