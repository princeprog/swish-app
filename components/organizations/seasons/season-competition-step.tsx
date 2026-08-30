"use client"

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
import { Separator } from "@/components/ui/separator"
import type { SeasonCompetitionForm } from "@/components/organizations/seasons/season-form-model"
import type { TiebreakerRule } from "@/services/league-season.service"

const TIEBREAKER_LABELS: Record<TiebreakerRule, string> = {
  head_to_head: "Head-to-head mini-table",
  manual_decision: "Audited league decision",
  point_differential: "Point differential",
  points_for: "Points scored",
  win_percentage: "Win percentage",
}

export function SeasonCompetitionStep({
  competition,
  onChange,
}: {
  competition: SeasonCompetitionForm
  onChange: (competition: SeasonCompetitionForm) => void
}) {
  function update<Key extends keyof SeasonCompetitionForm>(
    key: Key,
    value: SeasonCompetitionForm[Key],
  ) {
    onChange({ ...competition, [key]: value })
  }

  function moveTiebreaker(index: number, direction: -1 | 1) {
    const target = index + direction
    if (index === 0 || target <= 0 || target >= competition.tiebreakers.length) {
      return
    }
    const next = [...competition.tiebreakers]
    ;[next[index], next[target]] = [next[target], next[index]]
    update("tiebreakers", next)
  }

  const showsCrossover =
    competition.qualifyingFormat !== "none" &&
    competition.playoffFormat !== "none"

  return (
    <div className="flex flex-col gap-6">
      <FieldSet>
        <FieldLegend>Competition path</FieldLegend>
        <FieldGroup className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="season-qualifying-format">
              Qualifying format
            </FieldLabel>
            <NativeSelect
              id="season-qualifying-format"
              value={competition.qualifyingFormat}
              onChange={(event) =>
                update(
                  "qualifyingFormat",
                  event.target.value as SeasonCompetitionForm["qualifyingFormat"],
                )
              }
            >
              <NativeSelectOption value="none">No qualifying stage</NativeSelectOption>
              <NativeSelectOption value="single_round_robin">
                Single round robin
              </NativeSelectOption>
              <NativeSelectOption value="double_round_robin">
                Double round robin
              </NativeSelectOption>
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel htmlFor="season-playoff-format">
              Playoff format
            </FieldLabel>
            <NativeSelect
              id="season-playoff-format"
              value={competition.playoffFormat}
              onChange={(event) =>
                update(
                  "playoffFormat",
                  event.target.value as SeasonCompetitionForm["playoffFormat"],
                )
              }
            >
              <NativeSelectOption value="none">No playoffs</NativeSelectOption>
              <NativeSelectOption value="single_elimination">
                Single elimination
              </NativeSelectOption>
              <NativeSelectOption value="double_elimination">
                Double elimination
              </NativeSelectOption>
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel htmlFor="season-pool-count">Pools</FieldLabel>
            <Input
              id="season-pool-count"
              inputMode="numeric"
              max={16}
              min={1}
              type="number"
              value={competition.poolCount}
              onChange={(event) => update("poolCount", Number(event.target.value))}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="season-qualifiers-per-pool">
              Qualifiers per pool
            </FieldLabel>
            <Input
              id="season-qualifiers-per-pool"
              inputMode="numeric"
              max={64}
              min={1}
              type="number"
              value={competition.qualifiersPerPool}
              onChange={(event) =>
                update("qualifiersPerPool", Number(event.target.value))
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="season-slot-duration">
              Default scheduling slot
            </FieldLabel>
            <FieldContent>
              <Input
                id="season-slot-duration"
                inputMode="numeric"
                max={1440}
                min={15}
                type="number"
                value={competition.scheduleSlotDurationMinutes}
                onChange={(event) =>
                  update(
                    "scheduleSlotDurationMinutes",
                    Number(event.target.value),
                  )
                }
              />
              <FieldDescription>Minutes reserved for each game.</FieldDescription>
            </FieldContent>
          </Field>
        </FieldGroup>
      </FieldSet>

      <Separator />

      <FieldSet>
        <FieldLegend>Ranking order</FieldLegend>
        <FieldDescription>
          Rules are applied from top to bottom. Win percentage always comes first.
        </FieldDescription>
        <ol className="divide-y rounded-md border" aria-label="Ordered tiebreakers">
          {competition.tiebreakers.map((rule, index) => (
            <li key={rule} className="flex items-center gap-3 px-3 py-2">
              <span className="w-6 text-sm text-muted-foreground">{index + 1}</span>
              <span className="flex-1 text-sm font-medium">
                {TIEBREAKER_LABELS[rule]}
              </span>
              <Button
                aria-label={`Move ${TIEBREAKER_LABELS[rule]} up`}
                disabled={index <= 1}
                size="icon-sm"
                type="button"
                variant="ghost"
                onClick={() => moveTiebreaker(index, -1)}
              >
                <ArrowUp />
              </Button>
              <Button
                aria-label={`Move ${TIEBREAKER_LABELS[rule]} down`}
                disabled={index === 0 || index === competition.tiebreakers.length - 1}
                size="icon-sm"
                type="button"
                variant="ghost"
                onClick={() => moveTiebreaker(index, 1)}
              >
                <ArrowDown />
              </Button>
            </li>
          ))}
        </ol>
      </FieldSet>

      {showsCrossover ? (
        <>
          <Separator />
          <FieldSet>
            <FieldLegend>Crossover opening round</FieldLegend>
            <FieldDescription>
              Use pool seeds such as A1 vs B2. Each seed can appear once.
            </FieldDescription>
            <div className="flex flex-col gap-3">
              {competition.crossoverTemplate.map((matchup, index) => (
                <div
                  key={`${index}-${matchup.homeSeed}-${matchup.awaySeed}`}
                  className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2"
                >
                  <Input
                    aria-label={`Crossover ${index + 1} home seed`}
                    value={matchup.homeSeed}
                    onChange={(event) => {
                      const next = competition.crossoverTemplate.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, homeSeed: event.target.value.toUpperCase() }
                          : item,
                      )
                      update("crossoverTemplate", next)
                    }}
                  />
                  <span className="text-sm text-muted-foreground">vs</span>
                  <Input
                    aria-label={`Crossover ${index + 1} away seed`}
                    value={matchup.awaySeed}
                    onChange={(event) => {
                      const next = competition.crossoverTemplate.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, awaySeed: event.target.value.toUpperCase() }
                          : item,
                      )
                      update("crossoverTemplate", next)
                    }}
                  />
                  <Button
                    aria-label={`Remove crossover ${index + 1}`}
                    disabled={competition.crossoverTemplate.length === 1}
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      update(
                        "crossoverTemplate",
                        competition.crossoverTemplate.filter(
                          (_, itemIndex) => itemIndex !== index,
                        ),
                      )
                    }
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
              <Button
                className="self-start"
                type="button"
                variant="outline"
                onClick={() =>
                  update("crossoverTemplate", [
                    ...competition.crossoverTemplate,
                    { awaySeed: "", homeSeed: "" },
                  ])
                }
              >
                <Plus />
                Add matchup
              </Button>
            </div>
          </FieldSet>
        </>
      ) : null}
    </div>
  )
}
