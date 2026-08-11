"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileUp, Loader2, Save, Send } from "lucide-react";
import { toast } from "sonner";

import { ComplianceStatusBadge } from "@/components/organizations/compliance/compliance-status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/hooks/use-auth";
import {
  COMPLIANCE_QUERY_KEYS,
  useTeamComplianceQuery,
} from "@/hooks/use-compliance";
import {
  complianceService,
  sha256File,
  uploadComplianceFile,
  type ComplianceFileReference,
  type TeamComplianceRequirement,
} from "@/services/compliance.service";
import type { Organization } from "@/services/organization.service";
import type { TeamManagerWorkspaceAssignment } from "@/services/team-manager-workspace.service";

type ResponseValue =
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

function dateLabel(value: string | null) {
  return value
    ? new Date(value).toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;
}

function responseValue(value: unknown): ResponseValue | undefined {
  if (typeof value === "string" || typeof value === "boolean") return value;
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  const files = (value as { files?: unknown }).files;
  if (!Array.isArray(files)) return;
  const references = files.filter(
    (file): file is ComplianceFileReference =>
      Boolean(
        file &&
          typeof file === "object" &&
          typeof (file as { id?: unknown }).id === "string",
      ),
  );
  return { files: references };
}

function RequirementCard({
  onChange,
  onSave,
  onSubmit,
  onUpload,
  response,
  requirement,
  uploading,
}: {
  onChange: (value: ResponseValue) => void;
  onSave: () => void;
  onSubmit: () => void;
  onUpload: (files: FileList | null) => void;
  response: ResponseValue;
  requirement: TeamComplianceRequirement;
  uploading: boolean;
}) {
  const canEdit = editable(requirement.workflow_status);
  const fileResponse =
    typeof response === "object" && response !== null && "files" in response
      ? response.files
      : [];
  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{requirement.title}</CardTitle>
            <CardDescription>
              {requirement.is_required ? "Required" : "Optional"} ·{" "}
              {requirement.response_type.replace("_", " ")}
            </CardDescription>
          </div>
          <ComplianceStatusBadge
            status={requirement.workflow_status ?? "draft"}
          />
        </div>
        {requirement.instructions ? (
          <p className="text-sm text-muted-foreground">
            {requirement.instructions}
          </p>
        ) : null}
        {requirement.review_note ? (
          <p className="rounded-md bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
            Review note: {requirement.review_note}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {requirement.response_type === "short_text" ? (
          <Input
            aria-label={`${requirement.title} response`}
            disabled={!canEdit}
            placeholder="Type your response"
            value={typeof response === "string" ? response : ""}
            onChange={(event) => onChange(event.target.value)}
          />
        ) : null}
        {requirement.response_type === "long_text" ? (
          <Textarea
            aria-label={`${requirement.title} response`}
            disabled={!canEdit}
            placeholder="Type your response"
            value={typeof response === "string" ? response : ""}
            onChange={(event) => onChange(event.target.value)}
          />
        ) : null}
        {requirement.response_type === "url" ? (
          <Input
            aria-label={`${requirement.title} link`}
            disabled={!canEdit}
            placeholder="https://"
            type="url"
            value={typeof response === "string" ? response : ""}
            onChange={(event) => onChange(event.target.value)}
          />
        ) : null}
        {requirement.response_type === "acknowledgement" ? (
          <label className="flex items-center gap-3 text-sm">
            <Checkbox
              checked={response === true}
              disabled={!canEdit}
              onCheckedChange={(checked) => onChange(checked === true)}
            />
            I confirm the information above is complete and accurate.
          </label>
        ) : null}
        {requirement.response_type === "file" ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Input
                accept="application/pdf,image/jpeg,image/png"
                className="sr-only"
                disabled={!canEdit || uploading}
                id={`file-upload-${requirement.id}`}
                multiple
                type="file"
                onChange={(event) => onUpload(event.target.files)}
              />
              <Button
                asChild
                disabled={!canEdit || uploading}
                variant="outline"
              >
                <label htmlFor={`file-upload-${requirement.id}`}>
                  <FileUp className="size-4" />
                  {uploading ? "Uploading" : "Choose files"}
                </label>
              </Button>
              <span className="text-xs text-muted-foreground">
                PDF, JPG, or PNG · up to 10 MB each ·{" "}
                {requirement.max_file_count} maximum
              </span>
            </div>
            {fileResponse.length ? (
              <div className="space-y-2">
                {fileResponse.map((file) => (
                  <div
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    key={file.id}
                  >
                    <span>
                      {file.name ?? file.original_filename ?? "Uploaded file"}
                    </span>
                    <ComplianceStatusBadge
                      status={
                        file.status ?? file.verification_status ?? "verified"
                      }
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No files uploaded yet.
              </p>
            )}
          </div>
        ) : null}
        {canEdit ? (
          <div className="flex flex-wrap justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={onSave}>
              <Save className="size-4" />
              Save draft
            </Button>
            <Button size="sm" onClick={onSubmit}>
              <Send className="size-4" />
              Submit for review
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function ManagerComplianceContent({
  assignment,
  organization,
}: {
  assignment: TeamManagerWorkspaceAssignment;
  organization: Organization;
}) {
  const teamId = assignment.team.id;
  const queryClient = useQueryClient();
  const complianceQuery = useTeamComplianceQuery(organization.id, teamId);
  const [responses, setResponses] = React.useState<
    Record<string, ResponseValue>
  >({});
  const [uploadingId, setUploadingId] = React.useState<string | null>(null);
  const saveMutation = useMutation({
    mutationFn: ({
      requirementId,
      response,
    }: {
      requirementId: string;
      response: ResponseValue;
    }) =>
      complianceService.saveDraft(
        organization.id,
        teamId,
        requirementId,
        response,
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: COMPLIANCE_QUERY_KEYS.team(organization.id, teamId),
      }),
  });
  const submitMutation = useMutation({
    mutationFn: (requirementId: string) =>
      complianceService.submit(organization.id, teamId, requirementId),
    onSuccess: () =>
      queryClient.invalidateQueries({
      queryKey: COMPLIANCE_QUERY_KEYS.team(organization.id, teamId),
      }),
  });

  const data = complianceQuery.data;
  React.useEffect(() => {
    if (!data) return;
    setResponses((current) => {
      const next = { ...current };
      for (const requirement of data.requirements) {
        if (
          Object.prototype.hasOwnProperty.call(
            next,
            requirement.requirement_id,
          )
        ) {
          continue;
        }
        const saved = responseValue(requirement.response);
        if (saved !== undefined) {
          next[requirement.requirement_id] = saved;
          continue;
        }
        if (requirement.files?.length) {
          next[requirement.requirement_id] = { files: requirement.files };
        }
      }
      return next;
    });
  }, [data]);

  if (complianceQuery.isLoading)
    return (
      <Skeleton
        aria-label="Loading requirements"
        className="h-[32rem] rounded-lg"
      />
    );
  if (complianceQuery.isError)
    return (
      <Card>
        <CardHeader>
          <CardTitle>We couldn&apos;t load requirements</CardTitle>
          <CardDescription>
            {getApiErrorMessage(complianceQuery.error)}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  if (!data) return null;
  const setResponse = (id: string, value: ResponseValue) =>
    setResponses((current) => ({ ...current, [id]: value }));
  async function save(requirement: TeamComplianceRequirement) {
    try {
      await saveMutation.mutateAsync({
        requirementId: requirement.requirement_id,
        response: responses[requirement.requirement_id] ?? null,
      });
      toast.success("Draft saved");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }
  async function submit(requirement: TeamComplianceRequirement) {
    try {
      await saveMutation.mutateAsync({
        requirementId: requirement.requirement_id,
        response: responses[requirement.requirement_id] ?? null,
      });
      await submitMutation.mutateAsync(requirement.requirement_id);
      toast.success("Submitted for review");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }
  async function upload(
    requirement: TeamComplianceRequirement,
    files: FileList | null,
  ) {
    if (!files?.length) return;
    const existing = responses[requirement.requirement_id];
    const refs =
      typeof existing === "object" && existing !== null && "files" in existing
        ? [...existing.files]
        : [];
    setUploadingId(requirement.requirement_id);
    try {
      for (const [index, file] of Array.from(files).entries()) {
        if (
          !["application/pdf", "image/jpeg", "image/png"].includes(file.type) ||
          file.size > 10 * 1024 * 1024
        )
          throw new Error("Upload a PDF, JPG, or PNG file up to 10 MB.");
        if (refs.length >= requirement.max_file_count)
          throw new Error(
            `Upload no more than ${requirement.max_file_count} files for this requirement.`,
          );
        const prepared = await complianceService.prepareUpload(
          organization.id,
          teamId,
          requirement.requirement_id,
          {
            byteSize: file.size,
            fileOrder: refs.length + index + 1,
            mimeType: file.type,
            originalFilename: file.name,
            sha256: await sha256File(file),
          },
        );
        await uploadComplianceFile(prepared, file);
        await complianceService.completeUpload(
          organization.id,
          teamId,
          requirement.requirement_id,
          prepared.fileId,
        );
        refs.push({ id: prepared.fileId, name: file.name, status: "verified" });
      }
      setResponse(requirement.requirement_id, { files: refs });
      toast.success("File upload verified");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setUploadingId(null);
    }
  }
  return (
    <div className="space-y-5">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Competition clearance</CardTitle>
              <CardDescription>
                {data.settings?.instructions ??
                  "Complete each required item and submit it for organizer review."}
              </CardDescription>
            </div>
            <ComplianceStatusBadge
              status={data.clearance?.status ?? "not_required"}
            />
          </div>
          {data.settings?.submission_deadline_at ? (
            <p className="text-sm font-medium">
              Deadline: {dateLabel(data.settings.submission_deadline_at)}
            </p>
          ) : null}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            A team is cleared when every required item is approved or covered by
            an active waiver. Optional items do not block game starts.
          </p>
        </CardContent>
      </Card>
      <div className="space-y-4">
        {data.requirements.map((requirement) => (
          <RequirementCard
            key={requirement.requirement_id}
            onChange={(value) => setResponse(requirement.requirement_id, value)}
            onSave={() => save(requirement)}
            onSubmit={() => submit(requirement)}
            onUpload={(files) => upload(requirement, files)}
            response={responses[requirement.requirement_id]}
            requirement={requirement}
            uploading={uploadingId === requirement.requirement_id}
          />
        ))}
      </div>
    </div>
  );
}
