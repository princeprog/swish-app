"use client";

import * as React from "react";
import {
  Check,
  Eye,
  FileCheck2,
  History,
  Loader2,
  RotateCcw,
  Send,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

import { ComplianceStatusBadge } from "@/components/organizations/compliance/compliance-status-badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/hooks/use-auth";
import {
  useComplianceReviewDetailQuery,
  useComplianceReviewMutation,
} from "@/hooks/use-compliance";
import { complianceService } from "@/services/compliance.service";
import type {
  ComplianceFileReference,
  ComplianceHistoryEvent,
  ComplianceHistoryAttempt,
  ComplianceReviewRow,
} from "@/services/compliance.service";

type DivisionComplianceReviewDetailProps = {
  organizationId: string;
  row: ComplianceReviewRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ReasonAction = "request_changes" | "waive" | "reopen";

type PreviewKind = "pdf" | "image" | "unsupported";

type PreviewFile = {
  file: ComplianceFileReference;
  url: string;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatResponse(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "Confirmed" : "Not confirmed";
  if (value === null || value === undefined) return "No response recorded";
  return "A response was submitted. See the evidence below.";
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

function fileStatusDescription(file: ComplianceFileReference) {
  switch (file.verification_status) {
    case "verified":
      return "Verified private evidence";
    case "pending_upload":
      return "Upload did not finish. Ask the team manager to upload it again.";
    case "uploaded":
    case "scanning":
      return "File is still being checked. Try again shortly.";
    case "rejected":
      return "File could not be verified. Ask the team manager to upload it again.";
    case "deleted":
      return "File is no longer available";
    default:
      return "File is not ready to view";
  }
}

function previewKind(file: ComplianceFileReference): PreviewKind {
  const fileName = (file.original_filename ?? file.name ?? "").toLowerCase();
  if (fileName.endsWith(".pdf")) return "pdf";
  if (/\.(jpe?g|png)$/.test(fileName)) return "image";
  return "unsupported";
}

function ComplianceEvidenceAttachment({
  downloadingFileId,
  file,
  onOpen,
}: {
  downloadingFileId: string | null;
  file: ComplianceFileReference;
  onOpen: (file: ComplianceFileReference) => void;
}) {
  const fileName = file.original_filename ?? file.name ?? "Evidence file";
  const isVerified = file.verification_status === "verified";

  return (
    <Attachment className="w-full">
      <AttachmentMedia>
        <FileCheck2 />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>{fileName}</AttachmentTitle>
        <AttachmentDescription>
          {fileStatusDescription(file)}
        </AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction
          aria-label={
            isVerified
              ? `Preview ${fileName}`
              : `${fileName} is not ready to view`
          }
          disabled={
            file.verification_status !== "verified" ||
            downloadingFileId === file.id
          }
          onClick={() => onOpen(file)}
        >
          {downloadingFileId === file.id ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Eye />
          )}
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  );
}

export function DivisionComplianceReviewDetail({
  organizationId,
  row,
  open,
  onOpenChange,
}: DivisionComplianceReviewDetailProps) {
  const detailQuery = useComplianceReviewDetailQuery(
    organizationId,
    row.submission_id,
    open,
  );
  const review = useComplianceReviewMutation(
    organizationId,
    row.team_id,
    row.requirement_id,
  );
  const [reasonAction, setReasonAction] = React.useState<ReasonAction | null>(
    null,
  );
  const [reason, setReason] = React.useState("");
  const [expiresAt, setExpiresAt] = React.useState("");
  const [downloadingFileId, setDownloadingFileId] = React.useState<string | null>(
    null,
  );
  const [previewFile, setPreviewFile] = React.useState<PreviewFile | null>(
    null,
  );

  React.useEffect(() => {
    if (!open) setPreviewFile(null);
  }, [open]);

  const submission = detailQuery.data?.submission;
  const status = submission?.workflow_status ?? row.workflow_status;
  const canReview = status === "submitted" || status === "under_review";
  const canReopen = ["approved", "rejected", "waived"].includes(status);
  const canWaive = status !== "approved";

  function openReasonDialog(action: ReasonAction) {
    setReasonAction(action);
    setReason("");
    setExpiresAt("");
  }

  async function approve() {
    try {
      await review.approve.mutateAsync();
      toast.success("Requirement approved");
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function saveReason() {
    if (!reason.trim() || !reasonAction) return;
    try {
      if (reasonAction === "request_changes") {
        await review.requestChanges.mutateAsync(reason.trim());
        toast.success("Changes requested");
      } else if (reasonAction === "waive") {
        await review.waive.mutateAsync({
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
          reason: reason.trim(),
        });
        toast.success("Requirement waived");
      } else {
        await review.reopen.mutateAsync(reason.trim());
        toast.success("Requirement reopened");
      }
      setReasonAction(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function openPrivateFile(file: ComplianceFileReference) {
    if (file.verification_status !== "verified") {
      toast.info(fileStatusDescription(file));
      return;
    }
    setDownloadingFileId(file.id);
    try {
      const download = await complianceService.downloadUrl(
        organizationId,
        row.team_id,
        file.id,
      );
      setPreviewFile({ file, url: download.url });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setDownloadingFileId(null);
    }
  }

  const loading = detailQuery.isLoading;
  const error = detailQuery.error;
  const files = detailQuery.data?.files ?? [];
  const attempts = detailQuery.data?.attempts ?? [];
  const events = detailQuery.data?.events ?? [];
  const previewFileName =
    previewFile?.file.original_filename ?? previewFile?.file.name ?? "Evidence file";
  const previewFileKind = previewFile ? previewKind(previewFile.file) : null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full gap-0 p-0 sm:max-w-xl">
          <SheetHeader className="border-b">
            <SheetTitle>{row.requirement_title}</SheetTitle>
            <SheetDescription>
              {row.team_name} · Review submission details and history.
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="min-h-0 flex-1">
            <div className="grid gap-6 p-4 pb-8">
              {loading ? (
                <div className="grid gap-3" aria-label="Loading submission details">
                  <Skeleton className="h-24 w-full rounded-lg" />
                  <Skeleton className="h-32 w-full rounded-lg" />
                  <Skeleton className="h-24 w-full rounded-lg" />
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <ShieldAlert />
                  <AlertTitle>We couldn&apos;t load this submission</AlertTitle>
                  <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
                </Alert>
              ) : (
                <>
                  <section className="grid gap-3 rounded-lg border bg-card p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Team</p>
                        <p className="font-medium">{row.team_name}</p>
                      </div>
                      <ComplianceStatusBadge status={status} />
                    </div>
                    <div className="grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-muted-foreground">Requirement</p>
                        <p>{row.requirement_title}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Submitted</p>
                        <p>
                          {formatDate(submission?.submitted_at ?? row.submitted_at)}
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className="grid gap-3">
                    <div>
                      <h3 className="font-medium">Response</h3>
                      <p className="text-sm text-muted-foreground">
                        {submission?.response_type ?? "Response"}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-4 text-sm whitespace-pre-wrap">
                      {submission?.response_type === "file"
                        ? "Private evidence files are attached below."
                        : formatResponse(
                            detailQuery.data?.current_attempt?.response_value,
                          )}
                    </div>
                  </section>

                  <section className="grid gap-3">
                    <div>
                      <h3 className="font-medium">Private evidence</h3>
                      <p className="text-sm text-muted-foreground">
                        Verified files can be previewed here in a secure, short-lived viewer.
                      </p>
                    </div>
                    {files.length ? (
                      <AttachmentGroup className="w-full flex-col">
                        {files.map((file) => (
                          <ComplianceEvidenceAttachment
                            downloadingFileId={downloadingFileId}
                            file={file}
                            key={file.id}
                            onOpen={(selectedFile) =>
                              void openPrivateFile(selectedFile)
                            }
                          />
                        ))}
                      </AttachmentGroup>
                    ) : (
                      <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                        No private evidence files were attached.
                      </p>
                    )}
                  </section>

                  {submission?.review_note ? (
                    <Alert>
                      <Send />
                      <AlertTitle>Reviewer note</AlertTitle>
                      <AlertDescription>{submission.review_note}</AlertDescription>
                    </Alert>
                  ) : null}

                  <section className="grid gap-3">
                    <div>
                      <h3 className="font-medium">Immutable activity</h3>
                      <p className="text-sm text-muted-foreground">
                        Attempts and review events remain available for audit.
                      </p>
                    </div>
                    <Accordion collapsible type="single">
                      <AccordionItem value="attempts">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <History /> Attempts ({attempts.length})
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
                              No immutable attempts recorded yet.
                            </p>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="events">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <History /> Review events ({events.length})
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
                  </section>
                </>
              )}
            </div>
          </ScrollArea>
          <SheetFooter className="sticky bottom-0 border-t bg-popover">
            <div className="grid gap-2 sm:grid-cols-2">
              {canReview ? (
                <>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button disabled={review.approve.isPending}>
                        <Check data-icon="inline-start" /> Approve
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Approve this submission?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This marks the requirement as complete for {row.team_name}.
                          The decision becomes part of the official review record.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          disabled={review.approve.isPending}
                          onClick={approve}
                        >
                          Approve submission
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button
                    disabled={review.requestChanges.isPending}
                    variant="outline"
                    onClick={() => openReasonDialog("request_changes")}
                  >
                    <Send data-icon="inline-start" /> Request changes
                  </Button>
                </>
              ) : null}
              {canWaive ? (
                <Button
                  disabled={review.waive.isPending}
                  variant="outline"
                  onClick={() => openReasonDialog("waive")}
                >
                  Waive requirement
                </Button>
              ) : null}
              {canReopen ? (
                <Button
                  disabled={review.reopen.isPending}
                  variant="ghost"
                  onClick={() => openReasonDialog("reopen")}
                >
                  <RotateCcw data-icon="inline-start" /> Reopen
                </Button>
              ) : null}
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog
        open={reasonAction !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setReasonAction(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reasonAction === "request_changes"
                ? "Request changes"
                : reasonAction === "waive"
                  ? "Waive requirement"
                  : "Reopen requirement"}
            </DialogTitle>
            <DialogDescription>
              Add a clear note so the team manager understands what happens next.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="reviewer-reason">Reviewer note</FieldLabel>
              <Textarea
                id="reviewer-reason"
                placeholder="Explain the decision and the next step."
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
              <FieldDescription>
                This note is visible to the assigned team manager.
              </FieldDescription>
            </Field>
            {reasonAction === "waive" ? (
              <Field>
                <FieldLabel htmlFor="waiver-expires-at">
                  Waiver expiry (optional)
                </FieldLabel>
                <Input
                  id="waiver-expires-at"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(event) => setExpiresAt(event.target.value)}
                />
                <FieldDescription>
                  Leave blank for a waiver with no expiry.
                </FieldDescription>
              </Field>
            ) : null}
          </FieldGroup>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReasonAction(null)}>
              Cancel
            </Button>
            <Button
              disabled={
                !reason.trim() ||
                review.requestChanges.isPending ||
                review.waive.isPending ||
                review.reopen.isPending
              }
              onClick={saveReason}
            >
              {reasonAction === "request_changes"
                ? "Send request"
                : reasonAction === "waive"
                  ? "Save waiver"
                  : "Reopen requirement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={previewFile !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setPreviewFile(null);
        }}
      >
        <DialogContent className="flex h-[min(90vh,52rem)] w-[min(96vw,64rem)] max-w-none flex-col gap-4 p-4 sm:p-6">
          <DialogHeader className="pr-8">
            <DialogTitle>{previewFileName}</DialogTitle>
            <DialogDescription>
              This private preview is available for a short time.
            </DialogDescription>
          </DialogHeader>
          {previewFile ? (
            <div className="min-h-0 flex-1 overflow-hidden rounded-lg border bg-muted/20">
              {previewFileKind === "pdf" ? (
                <iframe
                  className="h-full w-full"
                  src={previewFile.url}
                  title={`Preview of ${previewFileName}`}
                />
              ) : previewFileKind === "image" ? (
                <div className="flex h-full items-center justify-center overflow-auto p-4">
                  <img
                    alt={`Preview of ${previewFileName}`}
                    className="max-h-full max-w-full object-contain"
                    src={previewFile.url}
                  />
                </div>
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    This file type cannot be previewed here.
                  </p>
                </div>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewFile(null)}>
              Close preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
