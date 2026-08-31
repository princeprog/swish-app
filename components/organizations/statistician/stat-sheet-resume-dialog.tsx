"use client";

import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const MIN_REASON_LENGTH = 10;

export function StatSheetResumeDialog({
  disabled = false,
  isPending,
  onResume,
}: {
  disabled?: boolean;
  isPending: boolean;
  onResume: (reason: string) => Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  function close(force = false) {
    if (isPending && !force) return;
    setOpen(false);
    setReason("");
    setError(null);
  }

  async function resume() {
    const normalizedReason = reason.trim();
    if (normalizedReason.length < MIN_REASON_LENGTH) {
      setError("Enter a reason of at least 10 characters.");
      return;
    }

    setError(null);
    try {
      await onResume(normalizedReason);
      close(true);
    } catch {
      setError(
        "We couldn't resume stat entry. Nothing changed, so review the sheet and try again.",
      );
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setError(null);
          setOpen(true);
        } else {
          close();
        }
      }}
    >
      <AlertDialogTrigger asChild>
        <Button disabled={disabled || isPending} variant="outline">
          Resume stat entry
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Resume stat entry?</AlertDialogTitle>
          <AlertDialogDescription>
            The submitted sheet will return to editing so you can correct a
            player statistic. The existing stat events stay in the history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="stat-sheet-resume-reason">
            Correction reason
          </label>
          <Textarea
            aria-describedby="stat-sheet-resume-reason-help"
            id="stat-sheet-resume-reason"
            placeholder="Explain what needs to be corrected."
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              setError(null);
            }}
          />
          <p
            className="text-xs text-muted-foreground"
            id="stat-sheet-resume-reason-help"
          >
            This reason is saved in the private league audit record.
          </p>
        </div>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending || disabled || reason.trim().length < MIN_REASON_LENGTH}
            onClick={(event) => {
              event.preventDefault();
              void resume();
            }}
          >
            {isPending ? "Resuming…" : "Resume stat entry"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
