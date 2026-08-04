"use client"

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
import { Switch } from "@/components/ui/switch"
import {
  slugifySeasonName,
  type SeasonFormValues,
  type SeasonStatus,
} from "@/components/organizations/seasons/season-form-model"

type SeasonDetailsStepProps = {
  onChange: (values: SeasonFormValues) => void
  validationError: string | null
  values: SeasonFormValues
}

export function SeasonDetailsStep({
  onChange,
  validationError,
  values,
}: SeasonDetailsStepProps) {
  function updateName(name: string) {
    const generatedSlug = slugifySeasonName(values.name)

    onChange({
      ...values,
      name,
      slug:
        !values.slug || values.slug === generatedSlug
          ? slugifySeasonName(name)
          : values.slug,
    })
  }

  return (
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
              onChange({
                ...values,
                slug: slugifySeasonName(event.target.value),
              })
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
            onChange({
              ...values,
              status: event.target.value as SeasonStatus,
            })
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
            onChange({ ...values, publicEnabled: checked })
          }
        />
      </Field>
    </FieldGroup>
  )
}
