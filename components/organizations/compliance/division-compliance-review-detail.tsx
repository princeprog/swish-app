"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, FileCheck2, ShieldAlert } from "lucide-react";

import { ComplianceStatusBadge } from "@/components/organizations/compliance/compliance-status-badge";
import { DivisionComplianceReviewDecision } from "@/components/organizations/compliance/division-compliance-review-decision";
import { DivisionComplianceReviewEvidence } from "@/components/organizations/compliance/division-compliance-review-evidence";
import { DivisionComplianceReviewHistory } from "@/components/organizations/compliance/division-compliance-review-history";
import { DivisionComplianceWorkspaceShell } from "@/components/organizations/compliance/division-compliance-workspace-shell";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/hooks/use-auth";
import {
  useComplianceReviewDetailQuery,
  useComplianceReviewMutation,
  useComplianceReviewQueueQuery,
} from "@/hooks/use-compliance";
import { useDivisionsQuery } from "@/hooks/use-division";
import { useOrganizationsQuery } from "@/hooks/use-organization";
import {
  buildComplianceReviewHref,
  sanitizeComplianceReviewReturnTo,
} from "@/lib/compliance-review-inbox";
import type { ComplianceReviewAction } from "@/lib/compliance-review-actions";
import type { Organization } from "@/services/organization.service";

function formatDate(value: string | null | undefined) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
function queuePath(slug: string, divisionId: string) {
  return `/organizations/${encodeURIComponent(slug)}/divisions/${encodeURIComponent(divisionId)}/requirements`;
}

function ReviewState({
  action,
  description,
  organization,
  returnTo,
  title,
}: {
  action?: React.ReactNode;
  description: string;
  organization?: Organization;
  returnTo: string;
  title: string;
}) {
  return (
    <DivisionComplianceWorkspaceShell organization={organization} title={title}>
      <div className="grid gap-5">
        <Button asChild className="w-fit" size="sm" variant="ghost">
          <Link href={returnTo}>
            <ArrowLeft data-icon="inline-start" /> Back to review queue
          </Link>
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <FileCheck2 className="size-6 text-muted-foreground" />
            <div className="grid gap-1">
              <h1 className="text-lg font-semibold">{title}</h1>
              <p className="max-w-xl text-sm text-muted-foreground">
                {description}
              </p>
            </div>
            {action}
          </CardContent>
        </Card>
      </div>
    </DivisionComplianceWorkspaceShell>
  );
}

function DecisionSaved({
  action,
  nextHref,
  returnTo,
}: {
  action: ComplianceReviewAction;
  nextHref?: string;
  returnTo: string;
}) {
  const actionLabel =
    action === "approve"
      ? "approved"
      : action === "request_changes"
        ? "sent back for changes"
        : action === "waive"
          ? "waived"
          : "reopened";

  return (
    <Card className="border-emerald-500/30 bg-emerald-500/5 lg:sticky lg:top-5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="size-5 text-emerald-600" /> Decision saved
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <p className="text-sm text-muted-foreground">
          This requirement was {actionLabel}. The official review record is up to
          date.
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {nextHref ? (
            <Button asChild>
              <Link href={nextHref}>Review next submission</Link>
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link href={returnTo}>Back to queue</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function DivisionComplianceReviewWorkspace({
  divisionId,
  slug,
  submissionId,
}: {
  divisionId: string;
  slug: string;
  submissionId: string;
}) {
  const searchParams = useSearchParams();
  const organizationsQuery = useOrganizationsQuery();
  const organization = organizationsQuery.data?.find(
    (item) => item.slug === slug,
  );
  const divisionsQuery = useDivisionsQuery(organization?.id, { pageSize: 50 });
  const division = divisionsQuery.data?.data.find(
    (item) => item.id === divisionId,
  );
  const detailQuery = useComplianceReviewDetailQuery(
    organization?.id,
    submissionId,
    Boolean(organization),
  );
  const nextQueueQuery = useComplianceReviewQueueQuery(
    organization?.id,
    divisionId,
    {
      page: 1,
      pageSize: 20,
      scope: "needs_review",
      search: "",
    },
  );
  const submission = detailQuery.data?.submission;
  const review = useComplianceReviewMutation(
    organization?.id ?? "",
    submission?.team_id ?? "",
    submission?.requirement_id ?? "",
  );
  const [savedAction, setSavedAction] =
    React.useState<ComplianceReviewAction | null>(null);

  const currentQueuePath = queuePath(slug, divisionId);
  const returnTo = sanitizeComplianceReviewReturnTo(
    searchParams.get("returnTo"),
    currentQueuePath,
  );
  const title = `${division?.name ?? "Division"} review`;

  async function handleDecisionSaved(action: ComplianceReviewAction) {
    await nextQueueQuery.refetch().catch(() => undefined);
    setSavedAction(action);
  }

  if (organizationsQuery.isLoading) {
    return (
      <DivisionComplianceWorkspaceShell organization={organization} title={title}>
        <div className="grid gap-5" aria-busy="true" aria-label="Loading review workspace">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-36 rounded-xl" />
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <Skeleton className="h-[36rem] rounded-xl" />
            <Skeleton className="h-[28rem] rounded-xl" />
          </div>
        </div>
      </DivisionComplianceWorkspaceShell>
    );
  }

  if (organizationsQuery.isError || !organization) {
    return (
      <ReviewState
        description={
          organization
            ? getApiErrorMessage(organizationsQuery.error)
            : "This workspace does not exist or you do not have access to it."
        }
        organization={organization}
        returnTo={returnTo}
        title="Review workspace unavailable"
      />
    );
  }

  if (detailQuery.isLoading) {
    return (
      <DivisionComplianceWorkspaceShell organization={organization} title={title}>
        <div className="grid gap-5" aria-busy="true" aria-label="Loading submission details">
          <Button asChild className="w-fit" size="sm" variant="ghost">
            <Link href={returnTo}>
              <ArrowLeft data-icon="inline-start" /> Back to review queue
            </Link>
          </Button>
          <Skeleton className="h-36 rounded-xl" />
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <Skeleton className="h-[36rem] rounded-xl" />
            <Skeleton className="h-[28rem] rounded-xl" />
          </div>
        </div>
      </DivisionComplianceWorkspaceShell>
    );
  }

  if (detailQuery.isError) {
    return (
      <ReviewState
        action={
          <Button size="sm" variant="outline" onClick={() => void detailQuery.refetch()}>
            Try again
          </Button>
        }
        description={getApiErrorMessage(detailQuery.error)}
        organization={organization}
        returnTo={returnTo}
        title="We couldn&apos;t load this submission"
      />
    );
  }

  if (!submission) {
    return (
      <ReviewState
        description="This submission may have been removed or is no longer available to review."
        organization={organization}
        returnTo={returnTo}
        title="Submission not found"
      />
    );
  }

  if (submission.division_id !== divisionId) {
    return (
      <ReviewState
        description="This submission belongs to a different division and cannot be opened from this review queue."
        organization={organization}
        returnTo={returnTo}
        title="Submission is outside this division"
      />
    );
  }

  const nextRow = nextQueueQuery.data?.data.find(
    (row) => row.submission_id !== submissionId,
  );
  const nextHref = nextRow
    ? buildComplianceReviewHref(
        slug,
        divisionId,
        nextRow.submission_id,
        returnTo,
      )
    : undefined;
  const status = submission.workflow_status;
  const currentAttempt = detailQuery.data?.current_attempt ?? null;

  return (
    <DivisionComplianceWorkspaceShell organization={organization} title={title}>
      <div className="grid gap-5">
        <Button asChild className="w-fit" size="sm" variant="ghost">
          <Link href={returnTo}>
            <ArrowLeft data-icon="inline-start" /> Back to review queue
          </Link>
        </Button>

        <section className="grid gap-4 rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="grid gap-1">
              <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Team submission
              </p>
              <h1 className="text-2xl font-semibold tracking-tight">
                {submission.requirement_title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {submission.team_name} · Submitted {formatDate(submission.submitted_at)}
              </p>
            </div>
            <ComplianceStatusBadge status={status} />
          </div>
          <dl className="grid gap-4 border-t pt-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Team</dt>
              <dd className="mt-1 font-medium">{submission.team_name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Requirement</dt>
              <dd className="mt-1 font-medium">{submission.requirement_title}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Submitted</dt>
              <dd className="mt-1 font-medium">{formatDate(submission.submitted_at)}</dd>
            </div>
          </dl>
        </section>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <div className="grid gap-5 lg:col-start-1 lg:row-start-1">
            <DivisionComplianceReviewEvidence
              currentAttempt={currentAttempt}
              files={detailQuery.data?.files ?? []}
              organizationId={organization.id}
              responseType={submission.response_type}
              teamId={submission.team_id}
            />
            {submission.review_note ? (
              <Alert>
                <ShieldAlert />
                <AlertTitle>Reviewer note</AlertTitle>
                <AlertDescription>{submission.review_note}</AlertDescription>
              </Alert>
            ) : null}
          </div>

          <aside className="lg:col-start-2 lg:row-start-1">
            {savedAction ? (
              <DecisionSaved
                action={savedAction}
                nextHref={nextHref}
                returnTo={returnTo}
              />
            ) : (
              <DivisionComplianceReviewDecision
                onSaved={handleDecisionSaved}
                review={review}
                status={status}
                teamName={submission.team_name}
              />
            )}
          </aside>

          <div className="lg:col-span-2 lg:row-start-2">
            <DivisionComplianceReviewHistory
              attempts={detailQuery.data?.attempts ?? []}
              events={detailQuery.data?.events ?? []}
            />
          </div>
        </div>
      </div>
    </DivisionComplianceWorkspaceShell>
  );
}
