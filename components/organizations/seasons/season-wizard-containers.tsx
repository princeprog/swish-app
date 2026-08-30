"use client"

import * as React from "react"
import { toast } from "sonner"

import { getApiErrorMessage } from "@/hooks/use-auth"
import {
  useCreateLeagueSeasonMutation,
  useUpdateLeagueSeasonMutation,
} from "@/hooks/use-league-season"
import type { Organization } from "@/services/organization.service"
import type { LeagueSeason } from "@/services/league-season.service"
import {
  createSeasonFormValues,
  seasonToFormValues,
  toCompetitionDefaultsInput,
  toGameRulesInput,
  type SeasonFormValues,
} from "@/components/organizations/seasons/season-form-model"
import { SeasonWizard } from "@/components/organizations/seasons/season-wizard"

export function SeasonCreateWizardModal({
  onClose,
  organization,
}: {
  onClose: () => void
  organization: Organization
}) {
  const mutation = useCreateLeagueSeasonMutation(organization.id)
  const initialValues = React.useMemo(() => createSeasonFormValues(), [])

  async function handleSubmit(values: SeasonFormValues) {
    try {
      const season = await mutation.mutateAsync({
        competitionDefaults: toCompetitionDefaultsInput(values.competition),
        gameRules: toGameRulesInput(values.gameRules),
        name: values.name.trim(),
        organizationId: organization.id,
        publicEnabled: values.publicEnabled,
        scheduleSlotDurationMinutes:
          values.competition.scheduleSlotDurationMinutes,
        slug: values.slug.trim(),
        status: values.status,
      })

      toast.success(`Created ${season.name}`)
      onClose()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  return (
    <SeasonWizard
      errorMessage={mutation.isError ? getApiErrorMessage(mutation.error) : null}
      initialValues={initialValues}
      isPending={mutation.isPending}
      mode="create"
      organizationName={organization.name}
      onClose={onClose}
      onSubmit={handleSubmit}
    />
  )
}

export function SeasonEditWizardModal({
  onClose,
  organization,
  season,
}: {
  onClose: () => void
  organization: Organization
  season: LeagueSeason
}) {
  const mutation = useUpdateLeagueSeasonMutation(organization.id)
  const initialValues = React.useMemo(() => seasonToFormValues(season), [season])

  async function handleSubmit(values: SeasonFormValues) {
    try {
      const updatedSeason = await mutation.mutateAsync({
        leagueSeasonId: season.id,
        payload: {
          competitionDefaults: toCompetitionDefaultsInput(values.competition),
          gameRules: toGameRulesInput(values.gameRules),
          name: values.name.trim(),
          publicEnabled: values.publicEnabled,
          scheduleSlotDurationMinutes:
            values.competition.scheduleSlotDurationMinutes,
          slug: values.slug.trim(),
          status: values.status,
        },
      })

      toast.success(`Updated ${updatedSeason.name}`)
      onClose()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  return (
    <SeasonWizard
      errorMessage={mutation.isError ? getApiErrorMessage(mutation.error) : null}
      initialValues={initialValues}
      isPending={mutation.isPending}
      mode="edit"
      organizationName={organization.name}
      onClose={onClose}
      onSubmit={handleSubmit}
    />
  )
}
