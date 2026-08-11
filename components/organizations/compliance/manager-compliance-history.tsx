"use client";

import { History as HistoryIcon } from "lucide-react";

import { ComplianceStatusBadge } from "@/components/organizations/compliance/compliance-status-badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import type {
  ComplianceHistoryResponse,
  TeamComplianceRequirement,
} from "@/services/compliance.service";

function dateLabel(value: string | null | undefined) {
  return value
    ? new Date(value).toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Not recorded";
}

export function ManagerComplianceHistory({
  history,
  requirement,
}: {
  history?: ComplianceHistoryResponse;
  requirement: TeamComplianceRequirement;
}) {
  const attempts = history?.attempts ?? [];
  const events = history?.events ?? [];

  return (
    <section className="grid gap-3 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-medium">{requirement.title}</h3>
          <p className="text-sm text-muted-foreground">
            Immutable attempts and organizer decisions
          </p>
        </div>
        <ComplianceStatusBadge status={requirement.workflow_status ?? "draft"} />
      </div>
      {requirement.review_note ? (
        <p className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
          Review note: {requirement.review_note}
        </p>
      ) : null}
      <Accordion collapsible type="single">
        <AccordionItem value="attempts">
          <AccordionTrigger>
            <span className="flex items-center gap-2">
              <HistoryIcon /> Attempts ({attempts.length})
            </span>
          </AccordionTrigger>
          <AccordionContent>
            {attempts.length ? (
              <div className="grid gap-2">
                {attempts.map((attempt) => (
                  <div className="rounded-md border p-3 text-sm" key={attempt.id}>
                    <p className="font-medium">Attempt {attempt.attempt_number}</p>
                    <p className="text-muted-foreground">
                      Submitted {dateLabel(attempt.submitted_at)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No attempts recorded.</p>
            )}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="events">
          <AccordionTrigger>
            <span className="flex items-center gap-2">
              <HistoryIcon /> Events ({events.length})
            </span>
          </AccordionTrigger>
          <AccordionContent>
            {events.length ? (
              <div className="grid gap-2">
                {events.map((event) => (
                  <div className="rounded-md border p-3 text-sm" key={event.id}>
                    <div className="flex flex-wrap justify-between gap-2">
                      <p className="font-medium capitalize">
                        {event.event_type.replaceAll("_", " ")}
                      </p>
                      <time className="text-muted-foreground">
                        {dateLabel(event.created_at)}
                      </time>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No events recorded.</p>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}

export function ManagerComplianceHistoryEmpty() {
  return (
    <Empty className="border-0 py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HistoryIcon />
        </EmptyMedia>
        <EmptyTitle>No completed requirements yet</EmptyTitle>
        <EmptyDescription>
          Approved and waived requirements will appear here with their immutable
          history.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
