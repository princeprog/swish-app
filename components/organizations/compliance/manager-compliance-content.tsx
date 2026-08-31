"use client";

import * as React from "react";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { FileCheck2 } from "lucide-react";
import { toast } from "sonner";

import { ManagerComplianceHistory, ManagerComplianceHistoryEmpty } from "@/components/organizations/compliance/manager-compliance-history";
import { ManagerComplianceRequirement, type ManagerResponseValue } from "@/components/organizations/compliance/manager-compliance-requirement";
import { ManagerComplianceSummary } from "@/components/organizations/compliance/manager-compliance-summary";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

type ManagerChecklistTab = "to_complete" | "submitted" | "history";

function responseValue(value: unknown): ManagerResponseValue | undefined {
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

function requirementsForTab(
  requirements: TeamComplianceRequirement[],
  tab: ManagerChecklistTab,
) {
  if (tab === "to_complete") {
    return requirements.filter((requirement) =>
      ["draft", "rejected", "reopened"].includes(
        requirement.workflow_status ?? "draft",
      ),
    );
  }
  if (tab === "submitted") {
    return requirements.filter((requirement) =>
      ["submitted", "under_review"].includes(
        requirement.workflow_status ?? "draft",
      ),
    );
  }
  return requirements.filter((requirement) =>
    ["approved", "waived"].includes(requirement.workflow_status ?? "draft"),
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
  const [tab, setTab] = React.useState<ManagerChecklistTab>("to_complete");
  const [responses, setResponses] = React.useState<
    Record<string, ManagerResponseValue>
  >({});
  const [uploadingId, setUploadingId] = React.useState<string | null>(null);
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [submittingId, setSubmittingId] = React.useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState<Record<string, number>>({});
  const [uploadErrors, setUploadErrors] = React.useState<Record<string, string | null>>({});
  const [failedFiles, setFailedFiles] = React.useState<Record<string, File | null>>({});

  const saveMutation = useMutation({
    mutationFn: ({
      requirementId,
      response,
    }: {
      requirementId: string;
      response: ManagerResponseValue;
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
    mutationFn: ({
      requirementId,
      response,
    }: {
      requirementId: string;
      response: ManagerResponseValue;
    }) =>
      complianceService.submit(
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

  const data = complianceQuery.data;
  const historyQueries = useQueries({
    queries:
      data?.requirements.map((requirement) => ({
        enabled: tab === "history",
        queryFn: () =>
          complianceService.history(
            organization.id,
            teamId,
            requirement.requirement_id,
          ),
        queryKey: COMPLIANCE_QUERY_KEYS.history(
          organization.id,
          teamId,
          requirement.requirement_id,
        ),
        retry: false,
      })) ?? [],
  });

  React.useEffect(() => {
    if (!data) return;
    const frameId = window.requestAnimationFrame(() => {
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
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [data]);

  if (complianceQuery.isLoading) {
    return (
      <Skeleton
        aria-label="Loading requirements"
        className="h-[32rem] rounded-lg"
      />
    );
  }
  if (complianceQuery.isError) {
    return (
      <Alert variant="destructive">
        <FileCheck2 />
        <AlertTitle>We couldn&apos;t load requirements</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
          <span>{getApiErrorMessage(complianceQuery.error)}</span>
          <Button size="sm" variant="outline" onClick={() => void complianceQuery.refetch()}>
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  if (!data) return null;
  if (!data.settings || data.requirements.length === 0) {
    return (
      <Empty className="border bg-card py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileCheck2 />
          </EmptyMedia>
          <EmptyTitle>No competition requirements yet</EmptyTitle>
          <EmptyDescription>
            The league organizer has not published requirements for this
            division. You can return here when the checklist is available.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const requiredRequirements = data.requirements.filter(
    (requirement) => requirement.is_required,
  );
  const satisfiedRequiredCount = requiredRequirements.filter((requirement) =>
    ["approved", "waived"].includes(requirement.workflow_status ?? ""),
  ).length;
  const visibleRequirements = requirementsForTab(data.requirements, tab);
  const historyLoading = historyQueries.some((query) => query.isLoading);
  const historyByRequirementId = new Map(
    data.requirements.map((requirement, index) => [
      requirement.requirement_id,
      historyQueries[index]?.data,
    ]),
  );

  function setResponse(id: string, value: ManagerResponseValue) {
    setResponses((current) => ({ ...current, [id]: value }));
  }

  async function save(requirement: TeamComplianceRequirement) {
    setSavingId(requirement.requirement_id);
    try {
      await saveMutation.mutateAsync({
        requirementId: requirement.requirement_id,
        response: responses[requirement.requirement_id] ?? null,
      });
      toast.success("Draft saved");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSavingId(null);
    }
  }

  async function submit(requirement: TeamComplianceRequirement) {
    setSubmittingId(requirement.requirement_id);
    try {
      await submitMutation.mutateAsync({
        requirementId: requirement.requirement_id,
        response: responses[requirement.requirement_id] ?? null,
      });
      toast.success("Submitted for review");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSubmittingId(null);
    }
  }

  async function uploadFiles(
    requirement: TeamComplianceRequirement,
    files: File[],
  ) {
    if (!files.length) return;
    const existing = responses[requirement.requirement_id];
    const refs =
      typeof existing === "object" && existing !== null && "files" in existing
        ? [...existing.files]
        : [];
    let activeFile: File | null = null;
    setUploadingId(requirement.requirement_id);
    setUploadErrors((current) => ({ ...current, [requirement.requirement_id]: null }));
    try {
      for (const file of files) {
        activeFile = file;
        if (
          !["application/pdf", "image/jpeg", "image/png"].includes(file.type) ||
          file.size > 10 * 1024 * 1024
        ) {
          throw new Error("Upload a PDF, JPG, or PNG file up to 10 MB.");
        }
        if (refs.length >= requirement.max_file_count) {
          throw new Error(
            `Upload no more than ${requirement.max_file_count} files for this requirement.`,
          );
        }
        const prepared = await complianceService.prepareUpload(
          organization.id,
          teamId,
          requirement.requirement_id,
          {
            byteSize: file.size,
            fileOrder: refs.length + 1,
            mimeType: file.type,
            originalFilename: file.name,
            sha256: await sha256File(file),
          },
        );
        setUploadProgress((current) => ({
          ...current,
          [requirement.requirement_id]: 0,
        }));
        await uploadComplianceFile(prepared, file, (percent) =>
          setUploadProgress((current) => ({
            ...current,
            [requirement.requirement_id]: percent,
          })),
        );
        await complianceService.completeUpload(
          organization.id,
          teamId,
          requirement.requirement_id,
          prepared.fileId,
        );
        refs.push({ id: prepared.fileId, name: file.name, status: "verified" });
      }
      setResponse(requirement.requirement_id, { files: refs });
      setSavingId(requirement.requirement_id);
      try {
        await saveMutation.mutateAsync({
          requirementId: requirement.requirement_id,
          response: { files: refs },
        });
      } catch (error) {
        const message = getApiErrorMessage(error);
        setFailedFiles((current) => ({
          ...current,
          [requirement.requirement_id]: null,
        }));
        setUploadErrors((current) => ({
          ...current,
          [requirement.requirement_id]: `Files uploaded, but the draft could not be saved. ${message}`,
        }));
        toast.error("Files uploaded, but the draft could not be saved");
        return;
      } finally {
        setSavingId(null);
      }
      setFailedFiles((current) => ({ ...current, [requirement.requirement_id]: null }));
      setUploadErrors((current) => ({ ...current, [requirement.requirement_id]: null }));
      toast.success("File uploaded and saved");
    } catch (error) {
      const message = getApiErrorMessage(error);
      setFailedFiles((current) => ({
        ...current,
        [requirement.requirement_id]: activeFile,
      }));
      setUploadErrors((current) => ({
        ...current,
        [requirement.requirement_id]: message,
      }));
      toast.error(message);
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <div className="grid gap-5">
      <ManagerComplianceSummary
        data={data}
        requiredCount={requiredRequirements.length}
        satisfiedRequiredCount={satisfiedRequiredCount}
      />

      <Tabs value={tab} onValueChange={(value) => setTab(value as ManagerChecklistTab)}>
        <TabsList aria-label="Requirements checklist sections">
          <TabsTrigger value="to_complete">To complete</TabsTrigger>
          <TabsTrigger value="submitted">Submitted</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent className="mt-4" value="to_complete">
          {visibleRequirements.length ? (
            <div className="grid gap-3">
              {visibleRequirements.map((requirement) => (
                <ManagerComplianceRequirement
                  failedFile={failedFiles[requirement.requirement_id]}
                  key={requirement.requirement_id}
                  onChange={(value) => setResponse(requirement.requirement_id, value)}
                  onRetry={() => {
                    const failedFile = failedFiles[requirement.requirement_id];
                    if (failedFile) void uploadFiles(requirement, [failedFile]);
                  }}
                  onSave={() => void save(requirement)}
                  onSubmit={() => void submit(requirement)}
                  onUpload={(files) => {
                    void uploadFiles(requirement, files ? Array.from(files) : []);
                  }}
                  response={responses[requirement.requirement_id]}
                  requirement={requirement}
                  saving={savingId === requirement.requirement_id}
                  submitting={submittingId === requirement.requirement_id}
                  uploadError={uploadErrors[requirement.requirement_id]}
                  uploadProgress={uploadProgress[requirement.requirement_id]}
                  uploading={uploadingId === requirement.requirement_id}
                />
              ))}
            </div>
          ) : (
            <Empty className="border bg-card py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileCheck2 />
                </EmptyMedia>
                <EmptyTitle>Nothing to complete</EmptyTitle>
                <EmptyDescription>
                  Draft, returned, and reopened requirements will appear here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </TabsContent>
        <TabsContent className="mt-4" value="submitted">
          {visibleRequirements.length ? (
            <div className="grid gap-3">
              {visibleRequirements.map((requirement) => (
                <ManagerComplianceRequirement
                  failedFile={failedFiles[requirement.requirement_id]}
                  key={requirement.requirement_id}
                  onChange={(value) => setResponse(requirement.requirement_id, value)}
                  onRetry={() => {
                    const failedFile = failedFiles[requirement.requirement_id];
                    if (failedFile) void uploadFiles(requirement, [failedFile]);
                  }}
                  onSave={() => void save(requirement)}
                  onSubmit={() => void submit(requirement)}
                  onUpload={(files) => {
                    void uploadFiles(requirement, files ? Array.from(files) : []);
                  }}
                  response={responses[requirement.requirement_id]}
                  requirement={requirement}
                  saving={savingId === requirement.requirement_id}
                  submitting={submittingId === requirement.requirement_id}
                  uploadError={uploadErrors[requirement.requirement_id]}
                  uploadProgress={uploadProgress[requirement.requirement_id]}
                  uploading={uploadingId === requirement.requirement_id}
                />
              ))}
            </div>
          ) : (
            <Empty className="border bg-card py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileCheck2 />
                </EmptyMedia>
                <EmptyTitle>No submissions in review</EmptyTitle>
                <EmptyDescription>
                  Submitted and under-review requirements will appear here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </TabsContent>
        <TabsContent className="mt-4" value="history">
          {historyLoading ? (
            <Skeleton aria-label="Loading requirement history" className="h-64 rounded-lg" />
          ) : visibleRequirements.length ? (
            <div className="grid gap-3">
              {visibleRequirements.map((requirement) => (
                <ManagerComplianceHistory
                  history={historyByRequirementId.get(requirement.requirement_id)}
                  key={requirement.requirement_id}
                  requirement={requirement}
                />
              ))}
            </div>
          ) : (
            <ManagerComplianceHistoryEmpty />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
