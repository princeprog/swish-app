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
import { FieldError } from "@/components/ui/field"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import {
  getSeasonGameRulesValidationError,
  type SeasonGameRulesForm,
  type SeasonFormValues,
  validateSeasonDetails,
  validateSeasonCompetition,
} from "@/components/organizations/seasons/season-form-model"
import { SeasonGameRulesStep } from "@/components/organizations/seasons/season-game-rules-step"
import { SeasonDetailsStep } from "@/components/organizations/seasons/season-details-step"
import { SeasonCompetitionStep } from "@/components/organizations/seasons/season-competition-step"

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
  const [step, setStep] = React.useState<1 | 2 | 3>(1)
  const [values, setValues] = React.useState(initialValues)
  const [validationError, setValidationError] = React.useState<string | null>(
    null,
  )
  const [invalidRuleField, setInvalidRuleField] = React.useState<
    keyof SeasonGameRulesForm | null
  >(null)
  const title = mode === "create" ? "Create season" : "Edit season"

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

    if (step === 2) {
      const error = getSeasonGameRulesValidationError(values.gameRules)
      setValidationError(error?.message ?? null)
      setInvalidRuleField(error?.field ?? null)

      if (!error) setStep(3)
      return
    }

    const error = validateSeasonCompetition(values.competition)
    setValidationError(error)
    if (error) return

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

        <div className="flex flex-col gap-2" aria-label={`Step ${step} of 3`}>
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className={cn(step !== 1 && "text-muted-foreground")}>
              1. Season details
            </span>
            <span className={cn(step !== 2 && "text-muted-foreground")}>
              2. Game rules
            </span>
            <span className={cn(step !== 3 && "text-muted-foreground")}>
              3. Competition
            </span>
          </div>
          <Progress value={(step / 3) * 100} />
        </div>

        <form
          className="flex flex-col gap-6"
          noValidate
          onSubmit={handleSubmit}
        >
          {step === 1 ? (
            <SeasonDetailsStep
              validationError={validationError}
              values={values}
              onChange={setValues}
            />
          ) : step === 2 ? (
            <SeasonGameRulesStep
              invalidField={invalidRuleField}
              isEditing={mode === "edit"}
              rules={values.gameRules}
              validationError={validationError}
              onChange={(gameRules) => {
                setValidationError(null)
                setInvalidRuleField(null)
                setValues((current) => ({ ...current, gameRules }))
              }}
            />
          ) : (
            <SeasonCompetitionStep
              competition={values.competition}
              onChange={(competition) => {
                setValidationError(null)
                setValues((current) => ({ ...current, competition }))
              }}
            />
          )}

          {(step === 1 && validationError) || errorMessage ? (
            <FieldError>
              {step === 1 && validationError ? validationError : errorMessage}
            </FieldError>
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
                  setInvalidRuleField(null)
                  setStep((current) => (current === 3 ? 2 : 1))
                }}
              >
                <ArrowLeft data-icon="inline-start" />
                Back
              </Button>
            )}
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : step < 3 ? (
                <ArrowRight data-icon="inline-end" />
              ) : (
                <CalendarDays data-icon="inline-start" />
              )}
              {isPending
                ? mode === "create"
                  ? "Creating"
                  : "Saving"
                : step < 3
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
