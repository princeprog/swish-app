import { History } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  ComplianceHistoryAttempt,
  ComplianceHistoryEvent,
} from "@/services/compliance.service";

function formatDate(value: string | null | undefined) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function eventDescription(event: ComplianceHistoryEvent) {
  const reason = event.metadata?.reason;
  return typeof reason === "string" && reason.trim()
    ? reason
    : event.event_type.replaceAll("_", " ");
}

function attemptLabel(attempt: ComplianceHistoryAttempt) {
  return `Attempt ${attempt.attempt_number} · ${formatDate(attempt.submitted_at)}`;
}

export function DivisionComplianceReviewHistory({
  attempts,
  events,
}: {
  attempts: ComplianceHistoryAttempt[];
  events: ComplianceHistoryEvent[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Review history</CardTitle>
        <CardDescription>
          Attempts and review events remain available for audit.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion collapsible type="single">
          <AccordionItem value="attempts">
            <AccordionTrigger>
              <span className="flex items-center gap-2">
                <History className="size-4" /> Attempts ({attempts.length})
              </span>
            </AccordionTrigger>
            <AccordionContent>
              {attempts.length ? (
                <div className="grid gap-3">
                  {attempts.map((attempt) => (
                    <div className="rounded-md border p-3" key={attempt.id}>
                      <p className="font-medium">{attemptLabel(attempt)}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {attempt.response_type}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No submission attempts recorded yet.
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="events">
            <AccordionTrigger>
              <span className="flex items-center gap-2">
                <History className="size-4" /> Review events ({events.length})
              </span>
            </AccordionTrigger>
            <AccordionContent>
              {events.length ? (
                <div className="grid gap-3">
                  {events.map((event) => (
                    <div className="rounded-md border p-3" key={event.id}>
                      <div className="flex flex-wrap justify-between gap-2">
                        <p className="font-medium capitalize">
                          {event.event_type.replaceAll("_", " ")}
                        </p>
                        <time className="text-xs text-muted-foreground">
                          {formatDate(event.created_at)}
                        </time>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {eventDescription(event)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No review events recorded yet.
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

