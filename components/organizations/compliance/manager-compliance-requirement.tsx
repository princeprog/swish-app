"use client";

import * as React from "react";
import { FileCheck2, FileUp, RefreshCw, Save, Send } from "lucide-react";

import { ComplianceStatusBadge } from "@/components/organizations/compliance/compliance-status-badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import type {
  ComplianceFileReference,
  TeamComplianceRequirement,
} from "@/services/compliance.service";

export type ManagerResponseValue =
  | string
  | boolean
  | { files: ComplianceFileReference[] }
  | null
  | undefined;

function editable(status: string | null) {
  return (
    !status ||
    status === "draft" ||
    status === "rejected" ||
    status === "reopened"
  );
}

export function ManagerComplianceRequirement({
  failedFile,
  onChange,
  onRetry,
  onSave,
  onSubmit,
  onUpload,
  response,
  requirement,
  uploadError,
  uploadProgress,
  uploading,
  saving,
  submitting,
}: {
  failedFile?: File | null;
  onChange: (value: ManagerResponseValue) => void;
  onRetry: () => void;
  onSave: () => void;
  onSubmit: () => void;
  onUpload: (files: FileList | null) => void;
  response: ManagerResponseValue;
  requirement: TeamComplianceRequirement;
  uploadError?: string | null;
  uploadProgress?: number | null;
  uploading: boolean;
  saving: boolean;
  submitting: boolean;
}) {
  const canEdit = editable(requirement.workflow_status);
  const fileResponse =
    typeof response === "object" && response !== null && "files" in response
      ? response.files
      : [];

  return (
    <Accordion collapsible type="single" defaultValue={requirement.requirement_id}>
      <AccordionItem value={requirement.requirement_id}>
        <AccordionTrigger>
          <span className="flex min-w-0 flex-1 flex-col items-start gap-1 pr-3">
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{requirement.title}</span>
              <ComplianceStatusBadge
                status={requirement.workflow_status ?? "draft"}
              />
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              {requirement.is_required ? "Required" : "Optional"} · {requirement.response_type.replace("_", " ")}
            </span>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <FieldGroup>
            {requirement.instructions ? (
              <p className="text-sm text-muted-foreground">
                {requirement.instructions}
              </p>
            ) : null}
            {requirement.review_note ? (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                <p className="font-medium">Changes requested</p>
                <p className="mt-1 text-muted-foreground">{requirement.review_note}</p>
              </div>
            ) : null}
            {requirement.response_type === "short_text" ? (
              <Field>
                <FieldLabel htmlFor={`${requirement.id}-response`}>Response</FieldLabel>
                <Input
                  aria-label={`${requirement.title} response`}
                  disabled={!canEdit}
                  id={`${requirement.id}-response`}
                  placeholder="Type your response"
                  value={typeof response === "string" ? response : ""}
                  onChange={(event) => onChange(event.target.value)}
                />
              </Field>
            ) : null}
            {requirement.response_type === "long_text" ? (
              <Field>
                <FieldLabel htmlFor={`${requirement.id}-response`}>Response</FieldLabel>
                <Textarea
                  aria-label={`${requirement.title} response`}
                  disabled={!canEdit}
                  id={`${requirement.id}-response`}
                  placeholder="Type your response"
                  value={typeof response === "string" ? response : ""}
                  onChange={(event) => onChange(event.target.value)}
                />
              </Field>
            ) : null}
            {requirement.response_type === "url" ? (
              <Field>
                <FieldLabel htmlFor={`${requirement.id}-link`}>Website link</FieldLabel>
                <Input
                  aria-label={`${requirement.title} link`}
                  disabled={!canEdit}
                  id={`${requirement.id}-link`}
                  placeholder="https://"
                  type="url"
                  value={typeof response === "string" ? response : ""}
                  onChange={(event) => onChange(event.target.value)}
                />
              </Field>
            ) : null}
            {requirement.response_type === "acknowledgement" ? (
              <Field className="rounded-lg border p-3" orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor={`${requirement.id}-acknowledgement`}>
                    I confirm the information above is complete and accurate.
                  </FieldLabel>
                  <FieldDescription>
                    This acknowledgement is saved with your submission.
                  </FieldDescription>
                </FieldContent>
                <Checkbox
                  checked={response === true}
                  disabled={!canEdit}
                  id={`${requirement.id}-acknowledgement`}
                  onCheckedChange={(checked) => onChange(checked === true)}
                />
              </Field>
            ) : null}
            {requirement.response_type === "file" ? (
              <Field>
                <FieldLabel htmlFor={`${requirement.id}-file-upload`}>
                  Private evidence files
                </FieldLabel>
                <div className="flex flex-wrap items-center gap-3">
                  <Input
                    accept="application/pdf,image/jpeg,image/png"
                    className="sr-only"
                    disabled={!canEdit || uploading}
                    id={`${requirement.id}-file-upload`}
                    multiple
                    type="file"
                    onChange={(event) => onUpload(event.target.files)}
                  />
                  <Button asChild disabled={!canEdit || uploading} variant="outline">
                    <label htmlFor={`${requirement.id}-file-upload`}>
                      <FileUp data-icon="inline-start" />
                      {uploading ? "Uploading" : "Choose files"}
                    </label>
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    PDF, JPG, or PNG · up to 10 MB each · {requirement.max_file_count} maximum
                  </span>
                </div>
                {uploading && uploadProgress !== null && uploadProgress !== undefined ? (
                  <div className="grid gap-2">
                    <Progress aria-label="Upload progress" value={uploadProgress} />
                    <p className="text-xs text-muted-foreground">Uploading {uploadProgress}%</p>
                  </div>
                ) : null}
                {uploadError ? (
                  <Attachment state="error" className="w-full">
                    <AttachmentMedia>
                      <FileCheck2 />
                    </AttachmentMedia>
                    <AttachmentContent>
                      <AttachmentTitle>{failedFile?.name ?? "File upload failed"}</AttachmentTitle>
                      <AttachmentDescription>{uploadError}</AttachmentDescription>
                    </AttachmentContent>
                    <AttachmentActions>
                      <AttachmentAction aria-label="Retry file upload" onClick={onRetry}>
                        <RefreshCw />
                      </AttachmentAction>
                    </AttachmentActions>
                  </Attachment>
                ) : null}
                {fileResponse.length ? (
                  <AttachmentGroup className="w-full flex-col">
                    {fileResponse.map((file) => (
                      <Attachment className="w-full" key={file.id}>
                        <AttachmentMedia>
                          <FileCheck2 />
                        </AttachmentMedia>
                        <AttachmentContent>
                          <AttachmentTitle>
                            {file.name ?? file.original_filename ?? "Uploaded file"}
                          </AttachmentTitle>
                          <AttachmentDescription>
                            {file.status ?? file.verification_status ?? "Uploaded"}
                          </AttachmentDescription>
                        </AttachmentContent>
                      </Attachment>
                    ))}
                  </AttachmentGroup>
                ) : !uploadError ? (
                  <p className="text-sm text-muted-foreground">No files uploaded yet.</p>
                ) : null}
              </Field>
            ) : null}
            {canEdit ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  className="w-full sm:w-auto"
                  disabled={saving || submitting || uploading}
                  size="sm"
                  variant="ghost"
                  onClick={onSave}
                >
                  <Save data-icon="inline-start" />
                  {saving ? "Saving" : "Save draft"}
                </Button>
                <Button
                  className="w-full sm:w-auto"
                  disabled={saving || submitting || uploading}
                  size="sm"
                  onClick={onSubmit}
                >
                  <Send data-icon="inline-start" />
                  {submitting ? "Submitting" : "Submit for review"}
                </Button>
              </div>
            ) : null}
          </FieldGroup>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
