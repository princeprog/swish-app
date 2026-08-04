"use client"

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type SeasonRuleNumberFieldProps = {
  disabled?: boolean
  label: string
  maximum: number
  minimum: number
  onChange: (value: number) => void
  suffix: string
  value: number
}

export function SeasonRuleNumberField({
  disabled,
  label,
  maximum,
  minimum,
  onChange,
  suffix,
  value,
}: SeasonRuleNumberFieldProps) {
  const id = `season-rule-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`

  return (
    <Field data-disabled={disabled || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <FieldContent>
        <Input
          id={id}
          disabled={disabled}
          inputMode="numeric"
          max={maximum}
          min={minimum}
          type="number"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <FieldDescription>{suffix}</FieldDescription>
      </FieldContent>
    </Field>
  )
}
