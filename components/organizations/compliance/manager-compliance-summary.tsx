"use client";

import { CalendarClock, ShieldCheck } from "lucide-react";

import { ComplianceStatusBadge } from "@/components/organizations/compliance/compliance-status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ComplianceSettings, TeamComplianceResponse } from "@/services/compliance.service";

function dateLabel(value: string | null) {
  return value
    ? new Date(value).toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;
}

export function ManagerComplianceSummary({
  data,
  requiredCount,
  satisfiedRequiredCount,
}: {
  data: TeamComplianceResponse;
  requiredCount: number;
  satisfiedRequiredCount: number;
}) {
  const progress = requiredCount
    ? Math.round((satisfiedRequiredCount / requiredCount) * 100)
    : 100;
  const settings: ComplianceSettings | null = data.settings;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Competition clearance</CardTitle>
            <CardDescription>
              {settings?.instructions ??
                "Complete each required item and submit it for organizer review."}
            </CardDescription>
          </div>
          <ComplianceStatusBadge status={data.clearance?.status ?? "not_required"} />
        </div>
        {settings?.submission_deadline_at ? (
          <div className="flex items-center gap-2 text-sm font-medium">
            <CalendarClock />
            Deadline: {dateLabel(settings.submission_deadline_at)}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-muted-foreground" />
          <div className="grid flex-1 gap-2">
            <div className="flex flex-wrap justify-between gap-2 text-sm">
              <span>Required items complete</span>
              <span className="font-medium">
                {satisfiedRequiredCount} of {requiredCount}
              </span>
            </div>
            <Progress aria-label="Required items complete" value={progress} />
          </div>
          <span className="text-sm font-medium">{progress}%</span>
        </div>
        <p className="text-sm text-muted-foreground">
          A team is cleared when every required item is approved or covered by an
          active waiver. Optional items do not block game starts.
        </p>
      </CardContent>
    </Card>
  );
}
