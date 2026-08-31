"use client";

import * as React from "react";
import Image from "next/image";
import { Eye, FileCheck2, Loader2, RefreshCw, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getApiErrorMessage } from "@/hooks/use-auth";
import { complianceService } from "@/services/compliance.service";
import type {
  ComplianceFileReference,
  ComplianceHistoryAttempt,
  ComplianceResponseType,
} from "@/services/compliance.service";

type PreviewKind = "pdf" | "image" | "unsupported";
type PreviewState = "loading" | "ready" | "unavailable" | "error" | "unsupported";

type CachedPreview = {
  expiresAt: string;
  url: string;
};

function formatResponse(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "Confirmed" : "Not confirmed";
  if (value === null || value === undefined) return "No response recorded";
  return "A response was submitted. See the evidence below.";
}

function previewKind(file: ComplianceFileReference): PreviewKind {
  const fileName = (file.original_filename ?? file.name ?? "").toLowerCase();
  if (fileName.endsWith(".pdf")) return "pdf";
  if (/\.(jpe?g|png)$/.test(fileName)) return "image";
  return "unsupported";
}

function fileName(file: ComplianceFileReference) {
  return file.original_filename ?? file.name ?? "Evidence file";
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
      return "File is no longer available.";
    default:
      return "File is not ready to view.";
  }
}

function hasFreshExpiry(expiresAt: string) {
  const expiry = Date.parse(expiresAt);
  return Number.isFinite(expiry) && expiry > Date.now() + 5_000;
}

function ResponseValue({
  responseType,
  value,
}: {
  responseType: ComplianceResponseType;
  value: unknown;
}) {
  if (responseType === "file") {
    return (
      <p className="text-sm text-muted-foreground">
        Private evidence files are shown below. Verified files open inside this
        workspace.
      </p>
    );
  }

  if (responseType === "url" && typeof value === "string") {
    return (
      <a
        className="break-all text-sm text-primary underline underline-offset-4"
        href={value}
        rel="noreferrer"
      >
        {value}
      </a>
    );
  }

  return <p className="whitespace-pre-wrap text-sm">{formatResponse(value)}</p>;
}

export function DivisionComplianceReviewEvidence({
  currentAttempt,
  files,
  organizationId,
  responseType,
  teamId,
}: {
  currentAttempt: ComplianceHistoryAttempt | null;
  files: ComplianceFileReference[];
  organizationId: string;
  responseType: ComplianceResponseType;
  teamId: string;
}) {
  const verifiedFiles = React.useMemo(
    () => files.filter((file) => file.verification_status === "verified"),
    [files],
  );
  const verifiedFileKey = verifiedFiles.map((file) => file.id).join("|");
  const [selectedFileId, setSelectedFileId] = React.useState<string | null>(
    null,
  );
  const [previewState, setPreviewState] = React.useState<PreviewState>(
    "unavailable",
  );
  const [previewError, setPreviewError] = React.useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [previewRetry, setPreviewRetry] = React.useState(0);
  const previewCache = React.useRef(new Map<string, CachedPreview>());

  React.useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setSelectedFileId((current) =>
        current && verifiedFiles.some((file) => file.id === current)
          ? current
          : verifiedFiles[0]?.id ?? null,
      );
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [verifiedFileKey, verifiedFiles]);

  const selectedFile = verifiedFiles.find(
    (file) => file.id === selectedFileId,
  );

  React.useEffect(() => {
    let cancelled = false;

    if (!selectedFile) {
      const frameId = window.requestAnimationFrame(() => {
        if (cancelled) return;
        setPreviewUrl(null);
        setPreviewError(null);
        setPreviewState("unavailable");
      });
      return () => {
        cancelled = true;
        window.cancelAnimationFrame(frameId);
      };
    }

    const cachedPreview = previewCache.current.get(selectedFile.id);
    if (cachedPreview && hasFreshExpiry(cachedPreview.expiresAt)) {
      const frameId = window.requestAnimationFrame(() => {
        if (cancelled) return;
        setPreviewUrl(cachedPreview.url);
        setPreviewError(null);
        setPreviewState(
          previewKind(selectedFile) === "unsupported" ? "unsupported" : "ready",
        );
      });
      return () => {
        cancelled = true;
        window.cancelAnimationFrame(frameId);
      };
    }

    const loadingFrameId = window.requestAnimationFrame(() => {
      if (cancelled) return;
      setPreviewState("loading");
      setPreviewUrl(null);
      setPreviewError(null);
    });

    void complianceService
      .downloadUrl(organizationId, teamId, selectedFile.id)
      .then((download) => {
        if (cancelled) return;
        previewCache.current.set(selectedFile.id, download);
        setPreviewUrl(download.url);
        setPreviewState(
          previewKind(selectedFile) === "unsupported" ? "unsupported" : "ready",
        );
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setPreviewError(getApiErrorMessage(error));
        setPreviewState("error");
      });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(loadingFrameId);
    };
  }, [
    organizationId,
    previewRetry,
    selectedFile,
    teamId,
  ]);

  const currentResponse = currentAttempt?.response_value;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Response and evidence</CardTitle>
        <CardDescription>
          Review the submitted response and any private evidence without leaving
          Swish.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <section className="grid gap-2" aria-labelledby="submitted-response-title">
          <div>
            <h2 className="font-medium" id="submitted-response-title">
              Submitted response
            </h2>
            <p className="text-sm text-muted-foreground">{responseType}</p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-4">
            <ResponseValue responseType={responseType} value={currentResponse} />
          </div>
        </section>

        <section className="grid gap-3" aria-labelledby="private-evidence-title">
          <div>
            <h2 className="font-medium" id="private-evidence-title">
              Private evidence
            </h2>
            <p className="text-sm text-muted-foreground">
              The first verified file opens automatically. Additional verified
              files can be selected below.
            </p>
          </div>

          {files.length ? (
            <div className="grid gap-3">
              <div className="grid gap-2">
                {files.map((file) => {
                  const isVerified = file.verification_status === "verified";
                  const isSelected = file.id === selectedFileId;
                  return (
                    <div
                      className="flex items-center justify-between gap-3 rounded-lg border p-3"
                      key={file.id}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <FileCheck2 className="size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {fileName(file)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {fileStatusDescription(file)}
                          </p>
                        </div>
                      </div>
                      {isVerified ? (
                        <Button
                          aria-pressed={isSelected}
                          className="shrink-0"
                          size="sm"
                          variant={isSelected ? "secondary" : "outline"}
                          onClick={() => setSelectedFileId(file.id)}
                        >
                          <Eye data-icon="inline-start" />
                          {isSelected ? "Viewing" : "Preview"}
                        </Button>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <div
                aria-live="polite"
                className="min-h-80 overflow-hidden rounded-lg border bg-muted/20 sm:min-h-[28rem]"
              >
                {previewState === "loading" ? (
                  <div
                    aria-busy="true"
                    aria-label="Loading evidence preview"
                    className="flex h-full min-h-80 flex-col items-center justify-center gap-3 p-6 text-center"
                  >
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Preparing a secure preview…
                    </p>
                  </div>
                ) : previewState === "error" ? (
                  <div className="flex h-full min-h-80 flex-col items-center justify-center gap-3 p-6 text-center">
                    <ShieldAlert className="size-5 text-destructive" />
                    <div>
                      <p className="font-medium">Preview unavailable</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {previewError ?? "We could not prepare this file preview."}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPreviewRetry((value) => value + 1)}
                    >
                      <RefreshCw data-icon="inline-start" /> Retry
                    </Button>
                  </div>
                ) : previewState === "unavailable" ? (
                  <div className="flex h-full min-h-80 flex-col items-center justify-center gap-2 p-6 text-center">
                    <FileCheck2 className="size-5 text-muted-foreground" />
                    <p className="font-medium">No verified evidence to preview</p>
                    <p className="text-sm text-muted-foreground">
                      The file must finish checking before it can be opened here.
                    </p>
                  </div>
                ) : previewState === "unsupported" ? (
                  <div className="flex h-full min-h-80 flex-col items-center justify-center gap-2 p-6 text-center">
                    <FileCheck2 className="size-5 text-muted-foreground" />
                    <p className="font-medium">Preview is not available</p>
                    <p className="text-sm text-muted-foreground">
                      This file type cannot be previewed inside Swish.
                    </p>
                  </div>
                ) : selectedFile && previewUrl ? (
                  previewKind(selectedFile) === "pdf" ? (
                    <iframe
                      className="h-full min-h-80 w-full sm:min-h-[28rem]"
                      src={previewUrl}
                      title={`Preview of ${fileName(selectedFile)}`}
                      onError={() => {
                        setPreviewError(
                          "The preview could not be displayed. Try again.",
                        );
                        setPreviewState("error");
                      }}
                    />
                  ) : (
                    <div className="flex h-full min-h-80 items-center justify-center overflow-auto p-4 sm:min-h-[28rem]">
                      <Image
                        alt={`Preview of ${fileName(selectedFile)}`}
                        className="max-h-full max-w-full object-contain"
                        src={previewUrl}
                        width={1200}
                        height={800}
                        unoptimized
                        onError={() => {
                          setPreviewError(
                            "The preview could not be displayed. Try again.",
                          );
                          setPreviewState("error");
                        }}
                      />
                    </div>
                  )
                ) : null}
              </div>

              <p className="text-xs text-muted-foreground">
                Secure previews remain available only for a short time and are
                refreshed automatically when needed.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
              No private evidence files were attached to this submission.
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
