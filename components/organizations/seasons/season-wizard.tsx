"use client"

import * as React from "react"
import { ArrowLeft, ArrowRight, CalendarDays, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import {
  slugifySeasonName,
  type SeasonFormValues,
  type SeasonStatus,
  validateSeasonDetails,
} from "@/components/organizations/seasons/season-form-model"

type SeasonWizardProps = {
  errorMessage?: string | null
  initialValues: SeasonFormValues
  isPending: boolean
  mode: "create" | "edit"
  onClose: () => void
  onSubmit: (values: SeasonFormValues) => Promise<void>
  organizationName: string
}

export function SeasonWizard({
  errorMessage,
  initialValues,
  isPending,
  mode,
  onClose,
  onSubmit,
  organizationName,
}: SeasonWizardProps) {
  const [step, setStep] = React.useState<1 | 2>(1)
  const [values, setValues] = React.useState(initialValues)
  const [validationError, setValidationError] = React.useState<string | null>(
    null,
  )
  const title = mode === "create" ? "Create season" : "Edit season"

  function updateName(name: string) {
    setValues((current) => {
      const generatedSlug = slugifySeasonName(current.name)

      return {
        ...current,
        name,
        slug:
          !current.slug || current.slug === generatedSlug
            ? slugifySeasonName(name)
            : current.slug,
      }
    })
  }

  function goToRules() {
    const error = validateSeasonDetails(values)
    setValidationError(error)

    if (!error) setStep(2)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (step === 1) {
      goToRules()
      return
    }

    await onSubmit(values)
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isPending) onClose()
      }}
    >
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? `Add a season and its game rules for ${organizationName}.`
              : `Update this season for ${organizationName}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2" aria-label={`Step ${step} of 2`}>
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className={cn(step !== 1 && "text-muted-foreground")}>
              1. Season details
            </span>
            <span className={cn(step !== 2 && "text-muted-foreground")}>
              2. Game rules
            </span>
          </div>
          <Progress value={step * 50} />
        </div>

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          {step === 1 ? (
            <FieldGroup>
              <Field data-invalid={validationError?.includes("name") || undefined}>
                <FieldLabel htmlFor="season-wizard-name">Season name</FieldLabel>
                <FieldContent>
                  <Input
                    id="season-wizard-name"
                    aria-invalid={validationError?.includes("name") || undefined}
                    placeholder="2026 Summer League"
                    value={values.name}
                    onChange={(event) => updateName(event.target.value)}
                  />
                  <FieldDescription>
                    Use the name shown to league staff and public viewers.
                  </FieldDescription>
                </FieldContent>
              </Field>

              <Field data-invalid={validationError?.includes("slug") || undefined}>
                <FieldLabel htmlFor="season-wizard-slug">Season slug</FieldLabel>
                <FieldContent>
                  <Input
                    id="season-wizard-slug"
                    aria-invalid={validationError?.includes("slug") || undefined}
                    value={values.slug}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        slug: slugifySeasonName(event.target.value),
                      }))
                    }
                  />
                  <FieldDescription>
                    Lowercase letters, numbers, and hyphens only.
                  </FieldDescription>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="season-wizard-status">Status</FieldLabel>
                <NativeSelect
                  id="season-wizard-status"
                  value={values.status}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      status: event.target.value as SeasonStatus,
                    }))
                  }
                >
                  <NativeSelectOption value="draft">Draft</NativeSelectOption>
                  <NativeSelectOption value="active">Active</NativeSelectOption>
                  <NativeSelectOption value="inactive">Inactive</NativeSelectOption>
                </NativeSelect>
              </Field>

              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="season-wizard-public">
                    Enable public season pages
                  </FieldLabel>
                  <FieldDescription>
                    Public viewers can open published schedules and results.
                  </FieldDescription>
                </FieldContent>
                <Switch
                  id="season-wizard-public"
                  checked={values.publicEnabled}
                  onCheckedChange={(checked) =>
                    setValues((current) => ({
                      ...current,
                      publicEnabled: checked,
                    }))
                  }
                />
              </Field>
            </FieldGroup>
          ) : (
            <div className="rounded-md border p-4 text-sm text-muted-foreground">
              Game rule fields are ready for the next implementation slice.
            </div>
          )}

          {validationError || errorMessage ? (
            <FieldError>{validationError ?? errorMessage}</FieldError>
          ) : null}

          <DialogFooter>
            {step === 1 ? (
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => {
                  setValidationError(null)
                  setStep(1)
                }}
              >
                <ArrowLeft data-icon="inline-start" />
                Back
              </Button>
            )}
            <Button
              type={step === 1 ? "button" : "submit"}
              disabled={isPending}
              onClick={step === 1 ? goToRules : undefined}
            >
              {isPending ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : step === 1 ? (
                <ArrowRight data-icon="inline-end" />
              ) : (
                <CalendarDays data-icon="inline-start" />
              )}
              {isPending
                ? mode === "create"
                  ? "Creating"
                  : "Saving"
                : step === 1
                  ? "Continue"
                  : mode === "create"
                    ? "Create season"
                    : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
