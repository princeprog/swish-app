"use client";

import * as React from "react";
import { Loader2, RotateCcw } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { SendScoringCommandResult } from "@/hooks/use-scoring";
import {
  getCorrectionHistory,
  type CorrectionHistoryContext,
} from "@/lib/scoring-correction-history";
import type { ScoringEvent } from "@/services/scoring.service";

const MIN_CORRECTION_REASON_LENGTH = 8;

type ScoringCorrectionHistoryProps = CorrectionHistoryContext & {
  disabled: boolean;
  error?: string | null;
  events: ScoringEvent[];
  isLoading?: boolean;
  onRetry?: () => void;
  onReverse: (
    eventId: string,
    reason?: string,
  ) => Promise<SendScoringCommandResult>;
};

function correctionReasonError(reason: string, required: boolean) {
  if (!required || reason.trim().length >= MIN_CORRECTION_REASON_LENGTH) {
    return null;
  }

  return "Enter a clear correction reason with at least 8 characters.";
}

export function ScoringCorrectionHistory({
  awayTeamId,
  awayTeamName,
  disabled,
  error,
  events,
  homeTeamId,
  homeTeamName,
  isLoading = false,
  latestEventId,
  onRetry,
  onReverse,
}: ScoringCorrectionHistoryProps) {
  const [selectedEventId, setSelectedEventId] = React.useState<string | null>(
    null,
  );
  const [reason, setReason] = React.useState("");
  const [dialogError, setDialogError] = React.useState<string | null>(null);
  const [requestError, setRequestError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [confirmation, setConfirmation] = React.useState<string | null>(null);

  const history = React.useMemo(
    () =>
      getCorrectionHistory(events, {
        awayTeamId,
        awayTeamName,
        homeTeamId,
        homeTeamName,
        latestEventId,
      }),
    [
      awayTeamId,
      awayTeamName,
      events,
      homeTeamId,
      homeTeamName,
      latestEventId,
    ],
  );
  const selectedEvent = history.find((event) => event.id === selectedEventId);

  function closeDialog() {
    if (isSubmitting) return;
    setSelectedEventId(null);
    setReason("");
    setDialogError(null);
  }

  function openCorrection(eventId: string) {
    setConfirmation(null);
    setRequestError(null);
    setDialogError(null);
    setReason("");
    setSelectedEventId(eventId);
  }

  async function submitCorrection() {
    if (!selectedEvent) return;

    const trimmedReason = reason.trim();
    const reasonError = correctionReasonError(
      trimmedReason,
      selectedEvent.requiresReason,
    );
    if (reasonError) {
      setDialogError(reasonError);
      return;
    }

    setDialogError(null);
    setRequestError(null);
    setIsSubmitting(true);

    let result: SendScoringCommandResult;
    try {
      result = await onReverse(selectedEvent.id, trimmedReason || undefined);
    } catch {
      setRequestError(
        "Something interrupted this correction. Check your connection and try again.",
      );
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);

    if (result.status === "confirmed") {
      closeDialog();
      setConfirmation(`${selectedEvent.label} was corrected.`);
      return;
    }

    if (result.status === "blocked") {
      setRequestError(
        "Reconnect before recording a correction. No change was saved.",
      );
      return;
    }

    setRequestError(
      result.status === "failed" && result.message
        ? result.message
        : "The game state changed before this correction was saved. Review the history and try again.",
    );
  }

  return (
    <section
      aria-labelledby="scoring-correction-history-title"
      className="space-y-3 rounded-lg border bg-card p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3
            className="text-sm font-bold uppercase text-muted-foreground"
            id="scoring-correction-history-title"
          >
            Correction history
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Review recorded scoring actions. Older actions require a reason.
          </p>
        </div>
        {onRetry && error ? (
          <Button onClick={onRetry} size="sm" variant="outline">
            Try again
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
          <Loader2 className="size-4 animate-spin" />
          Loading correction history…
        </div>
      ) : error ? (
        <div
          className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      ) : history.length === 0 ? (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          No scoring events yet.
        </p>
      ) : (
        <ol className="divide-y rounded-md border" aria-label="Scoring events">
          {history.map((event) => (
            <li
              className="flex items-center justify-between gap-3 p-3 first:rounded-t-md last:rounded-b-md"
              key={event.id}
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-medium">
                    {event.label}
                  </span>
                  {event.isReversed ? (
                    <Badge variant="secondary">Corrected</Badge>
                  ) : event.canCorrect ? (
                    <Badge variant="outline">Active</Badge>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  Event {event.sequence}
                </p>
              </div>
              {event.canCorrect ? (
                <Button
                  aria-label={`${event.requiresReason ? "Correct" : "Undo"} ${event.label}`}
                  disabled={disabled}
                  onClick={() => openCorrection(event.id)}
                  size="sm"
                  variant="outline"
                >
                  <RotateCcw className="size-4" />
                  {event.requiresReason ? "Correct" : "Undo"}
                </Button>
              ) : null}
            </li>
          ))}
        </ol>
      )}

      {requestError ? (
        <p className="text-sm text-destructive" role="alert">
          {requestError}
        </p>
      ) : null}
      {confirmation ? (
        <p className="text-sm text-primary" role="status">
          {confirmation}
        </p>
      ) : null}

      <AlertDialog
        open={selectedEvent !== undefined}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedEvent?.requiresReason
                ? "Correct an earlier scoring action?"
                : "Undo the latest scoring action?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedEvent
                ? `${selectedEvent.label} will be reversed and the official game state will be rebuilt.`
                : "Review this scoring action before confirming."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {selectedEvent?.requiresReason ? (
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="scoring-correction-reason">
                Correction reason
              </label>
              <Textarea
                aria-describedby="scoring-correction-reason-help"
                id="scoring-correction-reason"
                placeholder="Explain what needs to be corrected."
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  setDialogError(null);
                }}
              />
              <p
                className="text-xs text-muted-foreground"
                id="scoring-correction-reason-help"
              >
                This reason is saved with the correction record.
              </p>
            </div>
          ) : null}

          {dialogError ? (
            <p className="text-sm text-destructive" role="alert">
              {dialogError}
            </p>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isSubmitting || disabled || !selectedEvent}
              onClick={(event) => {
                event.preventDefault();
                void submitCorrection();
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving…
                </>
              ) : selectedEvent?.requiresReason ? (
                "Save correction"
              ) : (
                "Undo action"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
