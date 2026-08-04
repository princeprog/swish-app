"use client"

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type SeasonRuleNumberFieldProps = {
  disabled?: boolean
  error?: string | null
  label: string
  maximum: number
  minimum: number
  onChange: (value: number) => void
  suffix: string
  value: number
}

export function SeasonRuleNumberField({
  disabled,
  error,
  label,
  maximum,
  minimum,
  onChange,
  suffix,
  value,
}: SeasonRuleNumberFieldProps) {
  const id = `season-rule-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
  const errorId = `${id}-error`

  return (
    <Field
      data-disabled={disabled || undefined}
      data-invalid={Boolean(error) || undefined}
    >
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <FieldContent>
        <Input
          id={id}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={Boolean(error) || undefined}
          disabled={disabled}
          inputMode="numeric"
          max={maximum}
          min={minimum}
          type="number"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <FieldDescription>{suffix}</FieldDescription>
        {error ? <FieldError id={errorId}>{error}</FieldError> : null}
      </FieldContent>
    </Field>
  )
}
