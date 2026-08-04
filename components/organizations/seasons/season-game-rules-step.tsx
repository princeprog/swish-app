"use client"

import { Info } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import type { SeasonGameRulesForm } from "@/components/organizations/seasons/season-form-model"
import { SeasonRuleNumberField } from "@/components/organizations/seasons/season-rule-number-field"

type SeasonGameRulesStepProps = {
  invalidField: keyof SeasonGameRulesForm | null
  isEditing: boolean
  onChange: (rules: SeasonGameRulesForm) => void
  rules: SeasonGameRulesForm
  validationError: string | null
}

export function SeasonGameRulesStep({
  invalidField,
  isEditing,
  onChange,
  rules,
  validationError,
}: SeasonGameRulesStepProps) {
  const errorFor = (field: keyof SeasonGameRulesForm) =>
    invalidField === field ? validationError : null

  function update<Key extends keyof SeasonGameRulesForm>(
    key: Key,
    value: SeasonGameRulesForm[Key],
  ) {
    onChange({ ...rules, [key]: value })
  }

  return (
    <div className="flex flex-col gap-6">
      {isEditing ? (
        <Alert>
          <Info />
          <AlertDescription>
            Changes apply to games that have not started. Live and completed
            games keep their original rules.
          </AlertDescription>
        </Alert>
      ) : null}

      <FieldSet>
        <FieldLegend>Game length</FieldLegend>
        <FieldGroup className="grid gap-4 sm:grid-cols-3">
          <SeasonRuleNumberField
            error={errorFor("regulationPeriods")}
            label="Quarters"
            maximum={8}
            minimum={1}
            suffix="Total regulation quarters"
            value={rules.regulationPeriods}
            onChange={(value) => update("regulationPeriods", value)}
          />
          <SeasonRuleNumberField
            error={errorFor("periodMinutes")}
            label="Quarter length"
            maximum={30}
            minimum={1}
            suffix="Minutes per quarter"
            value={rules.periodMinutes}
            onChange={(value) => update("periodMinutes", value)}
          />
          <SeasonRuleNumberField
            error={errorFor("overtimeMinutes")}
            label="Overtime length"
            maximum={30}
            minimum={1}
            suffix="Minutes per overtime"
            value={rules.overtimeMinutes}
            onChange={(value) => update("overtimeMinutes", value)}
          />
        </FieldGroup>
      </FieldSet>

      <Separator />

      <FieldSet>
        <FieldLegend>Shot clock</FieldLegend>
        <FieldGroup>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor="season-rule-shot-clock-enabled">
                Enable shot clock
              </FieldLabel>
              <FieldDescription>
                Turn this off for leagues that do not operate a shot clock.
              </FieldDescription>
            </FieldContent>
            <Switch
              id="season-rule-shot-clock-enabled"
              checked={rules.shotClockEnabled}
              onCheckedChange={(checked) => update("shotClockEnabled", checked)}
            />
          </Field>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <SeasonRuleNumberField
              disabled={!rules.shotClockEnabled}
              error={errorFor("shotClockFullSeconds")}
              label="Full shot clock"
              maximum={99}
              minimum={1}
              suffix="Seconds"
              value={rules.shotClockFullSeconds}
              onChange={(value) => update("shotClockFullSeconds", value)}
            />
            <SeasonRuleNumberField
              disabled={!rules.shotClockEnabled}
              error={errorFor("shotClockShortSeconds")}
              label="Short reset"
              maximum={99}
              minimum={1}
              suffix="Seconds"
              value={rules.shotClockShortSeconds}
              onChange={(value) => update("shotClockShortSeconds", value)}
            />
          </FieldGroup>
        </FieldGroup>
      </FieldSet>

      <Separator />

      <FieldSet>
        <FieldLegend>Fouls and timeouts</FieldLegend>
        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <SeasonRuleNumberField
            error={errorFor("teamFoulsBeforePenalty")}
            label="Team fouls before penalty"
            maximum={20}
            minimum={1}
            suffix="Fouls per quarter"
            value={rules.teamFoulsBeforePenalty}
            onChange={(value) => update("teamFoulsBeforePenalty", value)}
          />
          <SeasonRuleNumberField
            error={errorFor("timeoutsFirstHalf")}
            label="First-half timeouts"
            maximum={10}
            minimum={0}
            suffix="Per team"
            value={rules.timeoutsFirstHalf}
            onChange={(value) => update("timeoutsFirstHalf", value)}
          />
          <SeasonRuleNumberField
            error={errorFor("timeoutsSecondHalf")}
            label="Second-half timeouts"
            maximum={10}
            minimum={0}
            suffix="Per team"
            value={rules.timeoutsSecondHalf}
            onChange={(value) => update("timeoutsSecondHalf", value)}
          />
          <SeasonRuleNumberField
            error={errorFor("timeoutsPerOvertime")}
            label="Overtime timeouts"
            maximum={10}
            minimum={0}
            suffix="Per team, each overtime"
            value={rules.timeoutsPerOvertime}
            onChange={(value) => update("timeoutsPerOvertime", value)}
          />
        </FieldGroup>
      </FieldSet>
    </div>
  )
}
