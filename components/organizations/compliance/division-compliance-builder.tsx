"use client";

import * as React from "react";
import { Check, PencilLine, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  useArchiveComplianceRequirementMutation,
  useCreateComplianceRequirementMutation,
  usePublishComplianceMutation,
  useUpdateComplianceRequirementMutation,
  useUpdateComplianceSettingsMutation,
} from "@/hooks/use-compliance";
import { getApiErrorMessage } from "@/hooks/use-auth";
import type {
  ComplianceRequirement,
  ComplianceResponseType,
  DivisionComplianceResponse,
} from "@/services/compliance.service";
import { ComplianceStatusBadge } from "./compliance-status-badge";

type BuilderProps = {
  divisionId: string;
  organizationId: string;
  data: DivisionComplianceResponse;
};

const responseTypes: Array<{ label: string; value: ComplianceResponseType }> = [
  { label: "File upload", value: "file" },
  { label: "Short answer", value: "short_text" },
  { label: "Long answer", value: "long_text" },
  { label: "Website link", value: "url" },
  { label: "Confirmation", value: "acknowledgement" },
];

function localDeadline(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function RequirementEditor({
  divisionId,
  onCancel,
  onSaved,
  organizationId,
  requirement,
}: {
  divisionId: string;
  onCancel: () => void;
  onSaved: () => void;
  organizationId: string;
  requirement?: ComplianceRequirement;
}) {
  const createMutation = useCreateComplianceRequirementMutation(
    organizationId,
    divisionId,
  );
  const updateMutation = useUpdateComplianceRequirementMutation(
    organizationId,
    divisionId,
    requirement?.id ?? "new",
  );
  const [title, setTitle] = React.useState(requirement?.title ?? "");
  const [instructions, setInstructions] = React.useState(
    requirement?.instructions ?? "",
  );
  const [responseType, setResponseType] =
    React.useState<ComplianceResponseType>(
      requirement?.response_type ?? "file",
    );
  const [isRequired, setIsRequired] = React.useState(
    requirement?.is_required ?? true,
  );
  const [maxFileCount, setMaxFileCount] = React.useState(
    requirement?.max_file_count ?? 5,
  );

  const mutation = requirement ? updateMutation : createMutation;
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    try {
      const payload = {
        instructions: instructions.trim() || undefined,
        isRequired,
        maxFileCount,
        responseType,
        sortOrder: requirement?.sort_order ?? 0,
        title: title.trim(),
      };
      await mutation.mutateAsync(payload);
      toast.success(requirement ? "Requirement updated" : "Requirement added");
      onSaved();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>
          {requirement ? "Edit requirement" : "Add requirement"}
        </DialogTitle>
        <DialogDescription>
          Define what team managers should submit and how the league will review
          it.
        </DialogDescription>
      </DialogHeader>
      <form className="grid gap-5" onSubmit={save}>
        <FieldGroup>
          <Field>
            <FieldLabel
              htmlFor={`requirement-title-${requirement?.id ?? "new"}`}
            >
              Requirement title
            </FieldLabel>
            <Input
              id={`requirement-title-${requirement?.id ?? "new"}`}
              placeholder="Team registration certificate"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <FieldDescription>
              Use a short title that is easy for team managers to scan.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel
              htmlFor={`requirement-type-${requirement?.id ?? "new"}`}
            >
              Response type
            </FieldLabel>
            <Select
              value={responseType}
              onValueChange={(value) =>
                setResponseType(value as ComplianceResponseType)
              }
            >
              <SelectTrigger
                className="w-full"
                id={`requirement-type-${requirement?.id ?? "new"}`}
              >
                <SelectValue placeholder="Choose a response type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {responseTypes.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel
              htmlFor={`requirement-instructions-${requirement?.id ?? "new"}`}
            >
              Instructions for team managers
            </FieldLabel>
            <Textarea
              id={`requirement-instructions-${requirement?.id ?? "new"}`}
              placeholder="Tell managers exactly what a complete response should include."
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
            />
            <FieldDescription>
              Explain acceptable evidence, naming conventions, or review tips.
            </FieldDescription>
          </Field>
          <Field className="rounded-lg border p-3" orientation="horizontal">
            <FieldContent>
              <FieldLabel
                htmlFor={`requirement-required-${requirement?.id ?? "new"}`}
              >
                Required before a team can compete
              </FieldLabel>
              <FieldDescription>
                Required items contribute to the division clearance decision.
              </FieldDescription>
            </FieldContent>
            <Switch
              checked={isRequired}
              id={`requirement-required-${requirement?.id ?? "new"}`}
              onCheckedChange={setIsRequired}
            />
          </Field>
          {responseType === "file" ? (
            <Field>
              <FieldLabel
                htmlFor={`requirement-max-files-${requirement?.id ?? "new"}`}
              >
                Maximum files
              </FieldLabel>
              <Input
                className="max-w-28"
                id={`requirement-max-files-${requirement?.id ?? "new"}`}
                max={5}
                min={1}
                type="number"
                value={maxFileCount}
                onChange={(event) =>
                  setMaxFileCount(Math.max(1, Number(event.target.value)))
                }
              />
            </Field>
          ) : null}
        </FieldGroup>
        {mutation.isError ? (
          <p className="text-sm text-destructive">
            {getApiErrorMessage(mutation.error)}
          </p>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button disabled={mutation.isPending || !title.trim()} type="submit">
            <Save data-icon="inline-start" />
            {mutation.isPending ? "Saving" : "Save requirement"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function RequirementRow({
  divisionId,
  onEdit,
  organizationId,
  requirement,
}: {
  divisionId: string;
  onEdit: () => void;
  organizationId: string;
  requirement: ComplianceRequirement;
}) {
  const archiveMutation = useArchiveComplianceRequirementMutation(
    organizationId,
    divisionId,
    requirement.id,
  );
  async function archive() {
    try {
      await archiveMutation.mutateAsync();
      toast.success("Requirement archived");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }
  return (
    <div className="flex flex-col gap-3 border-b p-4 last:border-b-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="grid min-w-0 gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{requirement.title}</p>
          <ComplianceStatusBadge
            status={requirement.is_required ? "required" : "optional"}
          />
          <span className="text-xs text-muted-foreground">
            {
              responseTypes.find(
                (item) => item.value === requirement.response_type,
              )?.label
            }
          </span>
        </div>
        {requirement.instructions ? (
          <p className="text-sm text-muted-foreground">
            {requirement.instructions}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 gap-2">
        <Button
          aria-label={`Edit ${requirement.title}`}
          size="sm"
          variant="outline"
          onClick={onEdit}
        >
          <PencilLine data-icon="inline-start" />
          Edit
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              aria-label={`Archive ${requirement.title}`}
              disabled={archiveMutation.isPending}
              size="sm"
              variant="ghost"
            >
              <Trash2 data-icon="inline-start" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Archive this requirement?</AlertDialogTitle>
              <AlertDialogDescription>
                “{requirement.title}” will no longer appear for team managers.
                Existing submissions remain available in the review history.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep requirement</AlertDialogCancel>
              <AlertDialogAction
                disabled={archiveMutation.isPending}
                onClick={archive}
              >
                Archive requirement
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export function DivisionComplianceBuilder({
  divisionId,
  organizationId,
  data,
}: BuilderProps) {
  const settings = data.settings;
  const [instructions, setInstructions] = React.useState(
    settings?.instructions ?? "",
  );
  const [deadline, setDeadline] = React.useState(
    localDeadline(settings?.submission_deadline_at),
  );
  const [editingId, setEditingId] = React.useState<string | "new" | null>(null);
  const settingsMutation = useUpdateComplianceSettingsMutation(
    organizationId,
    divisionId,
  );
  const publishMutation = usePublishComplianceMutation(
    organizationId,
    divisionId,
  );

  React.useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setInstructions(settings?.instructions ?? "");
      setDeadline(localDeadline(settings?.submission_deadline_at));
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [settings?.instructions, settings?.submission_deadline_at]);

  async function saveSettings(event: React.FormEvent) {
    event.preventDefault();
    try {
      await settingsMutation.mutateAsync({
        instructions: instructions.trim() || null,
        submissionDeadlineAt: deadline
          ? new Date(deadline).toISOString()
          : null,
      });
      toast.success("Division guidance saved");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  async function publish() {
    try {
      await publishMutation.mutateAsync();
      toast.success("Requirements published");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid min-w-0 gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">
              Division checklist
            </h2>
            <ComplianceStatusBadge status={settings?.status ?? "draft"} />
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Decide what teams must submit before they can compete in this
            division, then publish the checklist when it is ready.
          </p>
        </div>
        <Button
          className="w-full sm:w-auto"
          onClick={() => setEditingId("new")}
        >
          <Plus data-icon="inline-start" />
          Add requirement
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Checklist guidance</CardTitle>
              <CardDescription>
                Give team managers clear instructions and set the division
                submission deadline.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-5" onSubmit={saveSettings}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="compliance-instructions">
                      Instructions for team managers
                    </FieldLabel>
                    <Textarea
                      id="compliance-instructions"
                      placeholder="Add clear guidance for team managers."
                      value={instructions}
                      onChange={(event) => setInstructions(event.target.value)}
                    />
                    <FieldDescription>
                      Explain what a complete submission should include and
                      where managers can get help.
                    </FieldDescription>
                  </Field>
                  <Field className="max-w-sm">
                    <FieldLabel htmlFor="compliance-deadline">
                      Submission deadline
                    </FieldLabel>
                    <Input
                      id="compliance-deadline"
                      type="datetime-local"
                      value={deadline}
                      onChange={(event) => setDeadline(event.target.value)}
                    />
                    <FieldDescription>
                      Managers can still save drafts after this date, but new
                      submissions may need organizer review.
                    </FieldDescription>
                  </Field>
                </FieldGroup>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button disabled={settingsMutation.isPending} type="submit">
                    <Save data-icon="inline-start" />
                    {settingsMutation.isPending ? "Saving" : "Save guidance"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Checklist requirements</CardTitle>
              <CardDescription>
                Add each item teams must complete before competing. Required
                items contribute to clearance.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {!data.requirements.length && editingId !== "new" ? (
                <div className="grid place-items-center gap-2 px-6 py-12 text-center">
                  <p className="font-medium">No requirements configured</p>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Add the first checklist item to start collecting submissions
                    from team managers.
                  </p>
                </div>
              ) : null}
              {data.requirements.map((requirement) => (
                <RequirementRow
                  divisionId={divisionId}
                  key={requirement.id}
                  onEdit={() => setEditingId(requirement.id)}
                  organizationId={organizationId}
                  requirement={requirement}
                />
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit border-primary/20 bg-primary/5 xl:sticky xl:top-6">
          <CardHeader>
            <CardTitle className="text-base">Publishing summary</CardTitle>
            <CardDescription>
              Review the checklist before making it visible to team managers.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="rounded-lg border bg-background/70 p-4">
              <p className="text-2xl font-semibold tracking-tight">
                {data.requirements.length}
              </p>
              <p className="text-sm text-muted-foreground">
                {data.requirements.length === 1
                  ? "checklist item configured"
                  : "checklist items configured"}
              </p>
            </div>
            <div className="grid gap-3 text-sm">
              <div className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  Required items will be included in clearance checks.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>Team managers will see published instructions.</span>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  className="w-full"
                  disabled={
                    publishMutation.isPending ||
                    !data.requirements.length ||
                    settings?.status === "published"
                  }
                >
                  {publishMutation.isPending
                    ? "Publishing"
                    : settings?.status === "published"
                      ? "Published"
                      : "Publish requirements"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Publish this checklist?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Published requirements apply to new submissions and may
                    change what team managers see. Required items will count
                    toward game clearance.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep as draft</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={publishMutation.isPending}
                    onClick={publish}
                  >
                    Publish checklist
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {settings?.status === "draft" ? (
              <p className="text-xs text-muted-foreground">
                Draft changes stay private until you publish them.
              </p>
            ) : null}
            {settings?.status === "published" ? (
              <p className="text-xs text-muted-foreground">
                Published changes apply to new submissions and may change what
                managers see.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={editingId !== null}
        onOpenChange={(open) => {
          if (!open) setEditingId(null);
        }}
      >
        {editingId === "new" ? (
          <RequirementEditor
            divisionId={divisionId}
            onCancel={() => setEditingId(null)}
            onSaved={() => setEditingId(null)}
            organizationId={organizationId}
          />
        ) : null}
        {editingId && editingId !== "new" ? (
          <RequirementEditor
            divisionId={divisionId}
            onCancel={() => setEditingId(null)}
            onSaved={() => setEditingId(null)}
            organizationId={organizationId}
            requirement={data.requirements.find(
              (requirement) => requirement.id === editingId,
            )}
          />
        ) : null}
      </Dialog>
    </div>
  );
}
