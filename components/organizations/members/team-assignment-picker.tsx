"use client"

import * as React from "react"
import Link from "next/link"
import { TriangleAlert } from "lucide-react"

import {
  getInvitationTeamIds,
  groupTeamsBySeason,
  replaceSeasonSelection,
  type InvitationAssignmentMode,
} from "@/lib/team-assignment-selection"
import { PresenceReveal } from "@/components/motion/presence-reveal"
import type { Team } from "@/services/team.service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

export type { InvitationAssignmentMode }

export function TeamAssignmentPicker({
  assignmentMode,
  disabled = false,
  error,
  isLoading = false,
  onChange,
  onModeChange,
  organizationSlug,
  selectedIds,
  teams,
}: {
  assignmentMode: InvitationAssignmentMode
  disabled?: boolean
  error?: string
  isLoading?: boolean
  onChange: (teamIds: string[]) => void
  onModeChange: (mode: InvitationAssignmentMode) => void
  organizationSlug: string
  selectedIds: string[]
  teams: Team[]
}) {
  const options = teams.map((team) => ({
    id: team.id,
    leagueSeasonId: team.league_season_id ?? team.division_id,
    leagueSeasonName: team.league_season_name ?? "Season",
    name: team.name,
  }))
  const groups = groupTeamsBySeason(options)

  return (
    <fieldset className="flex flex-col gap-3 rounded-lg border p-4">
      <legend className="px-1 text-sm font-medium">Team access</legend>
      <FieldDescription>
        Choose one team per season, or assign access after the invitation is accepted.
      </FieldDescription>

      <RadioGroup
        aria-label="Team assignment timing"
        className="grid gap-3 sm:grid-cols-2"
        disabled={disabled || isLoading}
        value={assignmentMode}
        onValueChange={(value) => onModeChange(value as InvitationAssignmentMode)}
      >
        <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3 has-[:checked]:border-primary has-[:checked]:bg-muted/40">
          <RadioGroupItem id="assign-teams-now" value="now" />
          <span className="flex flex-col gap-1">
            <span className="text-sm font-medium">Assign teams now</span>
            <span className="text-xs text-muted-foreground">
              Give the manager team access as soon as they accept.
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3 has-[:checked]:border-primary has-[:checked]:bg-muted/40">
          <RadioGroupItem id="assign-teams-later" value="later" />
          <span className="flex flex-col gap-1">
            <span className="text-sm font-medium">Assign later</span>
            <span className="text-xs text-muted-foreground">
              The manager will wait until an owner assigns a team.
            </span>
          </span>
        </label>
      </RadioGroup>

      {isLoading ? (
        <div aria-busy="true" aria-label="Loading teams" className="flex flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : null}

      {!isLoading && !teams.length ? (
        <Alert>
          <TriangleAlert />
          <AlertTitle>No teams are available yet</AlertTitle>
          <AlertDescription>
            You can invite this manager now and assign a team later, or{" "}
            <Link className="font-medium underline underline-offset-4" href={`/organizations/${organizationSlug}/teams`}>
              create a team first
            </Link>
            .
          </AlertDescription>
        </Alert>
      ) : null}

      <PresenceReveal
        animateOnMount={false}
        collapse
        className="flex max-h-64 flex-col gap-4 overflow-y-auto rounded-md border p-3"
        present={!isLoading && assignmentMode === "now" && teams.length > 0}
        variant="subtle"
      >
        {groups.map((group) => {
          const seasonTeamIds = group.teams.map((team) => team.id)
          const selectedTeamId =
            group.teams.find((team) => selectedIds.includes(team.id))?.id ?? "none"

          return (
            <Field key={group.seasonId} data-invalid={Boolean(error)}>
              <FieldLabel htmlFor={`team-access-${group.seasonId}`}>
                {group.seasonLabel}
              </FieldLabel>
              <Select
                disabled={disabled}
                value={selectedTeamId}
                onValueChange={(teamId) =>
                  onChange(replaceSeasonSelection(selectedIds, seasonTeamIds, teamId))
                }
              >
                <SelectTrigger
                  id={`team-access-${group.seasonId}`}
                  aria-invalid={Boolean(error)}
                  className="w-full"
                >
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent position="popper" align="start">
                  <SelectGroup>
                    <SelectItem value="none">No team this season</SelectItem>
                    {group.teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          )
        })}
      </PresenceReveal>

      {error ? <FieldError>{error}</FieldError> : null}
    </fieldset>
  )
}

export function resolveTeamAssignmentIds(
  role: string,
  assignmentMode: InvitationAssignmentMode,
  selectedIds: string[],
) {
  return getInvitationTeamIds(role, assignmentMode, selectedIds)
}
