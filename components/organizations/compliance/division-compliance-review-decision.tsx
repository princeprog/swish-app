"use client";

import * as React from "react";
import { Check, RotateCcw, Send, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { availableComplianceReviewActions } from "@/lib/compliance-review-actions";
import type { ComplianceReviewAction } from "@/lib/compliance-review-actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/hooks/use-auth";
import type { useComplianceReviewMutation } from "@/hooks/use-compliance";
import type { ComplianceWorkflowStatus } from "@/services/compliance.service";

type ReviewMutations = ReturnType<typeof useComplianceReviewMutation>;

const actionLabels: Record<ComplianceReviewAction, string> = {
  approve: "Approve",
  request_changes: "Request changes",
  reopen: "Reopen",
  waive: "Waive",
};

function actionDescription(action: ComplianceReviewAction) {
  switch (action) {
    case "approve":
      return "Mark this requirement complete for the team.";
    case "request_changes":
      return "Send the team manager a reason and ask for a new submission.";
    case "waive":
      return "Record that this requirement does not apply or is excused.";
    case "reopen":
      return "Return the requirement to an active review state.";
  }
}

export function DivisionComplianceReviewDecision({
  review,
  status,
  teamName,
  onSaved,
}: {
  onSaved: (action: ComplianceReviewAction) => Promise<void> | void;
  review: ReviewMutations;
  status: ComplianceWorkflowStatus;
  teamName: string;
}) {
  const actions = availableComplianceReviewActions(status);
  const [selectedAction, setSelectedAction] =
    React.useState<ComplianceReviewAction | null>(null);
  const [reason, setReason] = React.useState("");
  const [expiresAt, setExpiresAt] = React.useState("");
  const [decisionError, setDecisionError] = React.useState<string | null>(null);
  const [approveConfirmationOpen, setApproveConfirmationOpen] =
    React.useState(false);

  const isPending =
    review.approve.isPending ||
    review.requestChanges.isPending ||
    review.waive.isPending ||
    review.reopen.isPending;

  async function commitAction(action: ComplianceReviewAction) {
    setDecisionError(null);
    try {
      if (action === "approve") {
        await review.approve.mutateAsync();
        toast.success("Requirement approved");
      } else if (action === "request_changes") {
        await review.requestChanges.mutateAsync(reason.trim());
        toast.success("Changes requested");
      } else if (action === "waive") {
        await review.waive.mutateAsync({
          expiresAt: expiresAt
            ? new Date(expiresAt).toISOString()
            : undefined,
          reason: reason.trim(),
        });
        toast.success("Requirement waived");
      } else {
        await review.reopen.mutateAsync(reason.trim());
        toast.success("Requirement reopened");
      }
      setApproveConfirmationOpen(false);
      await onSaved(action);
    } catch (error) {
      setDecisionError(getApiErrorMessage(error));
    }
  }

  function submitDecision(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedAction) {
      setDecisionError("Choose a decision to continue.");
      return;
    }
    if (selectedAction === "approve") {
      setApproveConfirmationOpen(true);
      return;
    }
    if (!reason.trim()) {
      setDecisionError("Add a reason so the team manager understands what happens next.");
      return;
    }
    void commitAction(selectedAction);
  }

  return (
    <Card className="lg:sticky lg:top-5">
      <CardHeader>
        <CardTitle>Record decision</CardTitle>
        <CardDescription>
          Choose the official outcome for this submission. The decision and any
          note are saved to the review record.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5" onSubmit={submitDecision}>
          <div className="grid gap-2" role="group" aria-label="Review decision">
            {actions.map((action) => {
              const selected = action === selectedAction;
              return (
                <button
                  aria-pressed={selected}
                  className={`grid gap-1 rounded-lg border p-3 text-left transition-colors ${
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                  key={action}
                  type="button"
                  onClick={() => {
                    setSelectedAction(action);
                    setDecisionError(null);
                  }}
                >
                  <span className="flex items-center gap-2 font-medium">
                    {action === "approve" ? (
                      <Check className="size-4" />
                    ) : action === "reopen" ? (
                      <RotateCcw className="size-4" />
                    ) : (
                      <Send className="size-4" />
                    )}
                    {actionLabels[action]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {actionDescription(action)}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedAction && selectedAction !== "approve" ? (
            <div className="grid gap-4">
              <Field>
                <FieldLabel htmlFor="review-decision-reason">
                  Reason <span className="text-destructive">*</span>
                </FieldLabel>
                <Textarea
                  id="review-decision-reason"
                  placeholder="Explain the decision and the next step."
                  value={reason}
                  onChange={(event) => {
                    setReason(event.target.value);
                    if (decisionError) setDecisionError(null);
                  }}
                />
                <FieldDescription>
                  This note is visible to {teamName} and stays with the review record.
                </FieldDescription>
              </Field>
              {selectedAction === "waive" ? (
                <Field>
                  <FieldLabel htmlFor="review-waiver-expires-at">
                    Waiver expiry (optional)
                  </FieldLabel>
                  <Input
                    id="review-waiver-expires-at"
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(event) => setExpiresAt(event.target.value)}
                  />
                  <FieldDescription>
                    Leave blank for a waiver with no expiry.
                  </FieldDescription>
                </Field>
              ) : null}
            </div>
          ) : null}

          {decisionError ? (
            <Alert role="alert" variant="destructive">
              <ShieldAlert />
              <AlertTitle>Decision not saved</AlertTitle>
              <AlertDescription>{decisionError}</AlertDescription>
            </Alert>
          ) : null}

          <Button disabled={!selectedAction || isPending} type="submit">
            {isPending ? "Saving decision…" : selectedAction ? `${actionLabels[selectedAction]} submission` : "Choose a decision"}
          </Button>
        </form>
      </CardContent>

      <AlertDialog
        open={approveConfirmationOpen}
        onOpenChange={setApproveConfirmationOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve this submission?</AlertDialogTitle>
            <AlertDialogDescription>
              This marks the requirement as complete for {teamName}. The decision
              becomes part of the official review record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={review.approve.isPending}
              onClick={() => void commitAction("approve")}
            >
              Approve submission
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
