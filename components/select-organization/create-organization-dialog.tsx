"use client";

import * as React from "react";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/hooks/use-auth";
import { useCreateOrganizationMutation } from "@/hooks/use-organization";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

function slugifyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function CreateOrganizationDialog() {
  const createOrganizationMutation = useCreateOrganizationMutation();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [validationError, setValidationError] = React.useState<string | null>(
    null,
  );

  function resetForm() {
    setName("");
    setSlug("");
    setValidationError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !slug.trim()) {
      setValidationError("Organization name and slug are required.");
      return;
    }

    setValidationError(null);

    try {
      const organization = await createOrganizationMutation.mutateAsync({
        name: name.trim(),
        slug: slug.trim(),
      });
      toast.success(`Created ${organization.name}`);
      setOpen(false);
      resetForm();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen && !createOrganizationMutation.isPending) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <PlusIcon data-icon="inline-start" />
          Create organization
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create organization</DialogTitle>
            <DialogDescription>
              Create a workspace for a school, barangay, company, or community
              basketball league.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field data-invalid={Boolean(validationError)}>
              <FieldLabel htmlFor="organization-name">
                Organization name
              </FieldLabel>
              <FieldContent>
                <Input
                  id="organization-name"
                  autoComplete="organization"
                  aria-invalid={Boolean(validationError)}
                  placeholder="Northside Basketball League"
                  value={name}
                  onChange={(event) => {
                    const nextName = event.target.value;
                    setName(nextName);

                    if (!slug.trim() || slug === slugifyName(name)) {
                      setSlug(slugifyName(nextName));
                    }
                  }}
                />
              </FieldContent>
            </Field>

            <Field data-invalid={Boolean(validationError)}>
              <FieldLabel htmlFor="organization-slug">
                Organization slug
              </FieldLabel>
              <FieldContent>
                <Input
                  id="organization-slug"
                  aria-invalid={Boolean(validationError)}
                  placeholder="northside-league"
                  value={slug}
                  onChange={(event) => setSlug(slugifyName(event.target.value))}
                />
                <FieldDescription>
                  Lowercase letters, numbers, and hyphens only.
                </FieldDescription>
              </FieldContent>
            </Field>

            {validationError || createOrganizationMutation.isError ? (
              <FieldError>
                {validationError ??
                  getApiErrorMessage(createOrganizationMutation.error)}
              </FieldError>
            ) : null}
          </FieldGroup>

          <DialogFooter showCloseButton>
            <Button
              type="submit"
              disabled={createOrganizationMutation.isPending}
            >
              {createOrganizationMutation.isPending ? (
                <>
                  <Spinner data-icon="inline-start" />
                  Creating
                </>
              ) : (
                "Create organization"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
