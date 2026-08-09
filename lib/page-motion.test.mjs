import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const motionSource = readFileSync(
  new URL("../components/motion/page-motion.tsx", import.meta.url),
  "utf8",
)
const motionCss = readFileSync(
  new URL("../app/globals.css", import.meta.url),
  "utf8",
)

const componentRevealCoverage = [
  {
    family: "auth",
    routes: ["/login", "/signup"],
    source: "components/auth/auth-shell.tsx",
  },
  {
    family: "invitations",
    routes: ["/invitations/accept"],
    source: "components/invitations/invitation-accept-screen.tsx",
  },
  {
    family: "documentation",
    routes: [
      "/docs",
      "/docs/architecture",
      "/docs/diagrams",
      "/docs/readiness",
      "/docs/roadmap",
      "/docs/success",
    ],
    source: "app/docs/_components/docs-shell.tsx",
  },
  {
    family: "organization-directory",
    routes: ["/organizations"],
    source: "components/select-organization/select-organization-screen.tsx",
  },
  {
    family: "organization-workspace",
    routes: [
      "/organizations/[slug]",
      "/organizations/[slug]/seasons",
      "/organizations/[slug]/divisions",
      "/organizations/[slug]/teams",
      "/organizations/[slug]/players",
      "/organizations/[slug]/venues",
    ],
    source: "components/organizations/workspace/organization-workspace-view.tsx",
  },
  {
    family: "organization-operations",
    routes: [
      "/organizations/[slug]/schedules",
      "/organizations/[slug]/standings",
      "/organizations/[slug]/members",
    ],
    source: "components/organizations/schedules/organization-schedules-view.tsx",
  },
  {
    family: "roster-and-manager",
    routes: [
      "/organizations/[slug]/teams/[teamId]/roster",
      "/organizations/[slug] (team manager)",
      "/organizations/[slug]/teams (team manager)",
      "/organizations/[slug]/players (team manager)",
      "/organizations/[slug]/schedules (team manager)",
      "/organizations/[slug]/standings (team manager)",
    ],
    source: "components/organizations/team-manager/manager-workspace.tsx",
  },
  {
    family: "scorekeeper",
    routes: [
      "/organizations/[slug]/scorekeeper",
      "/organizations/[slug]/scorekeeper/games/[gameId]",
    ],
    source: "components/organizations/scorekeeper/scorekeeper-game-detail-screen.tsx",
  },
]

test("exposes explicit component reveal primitives", () => {
  assert.match(motionSource, /export function ComponentReveal/)
  assert.match(motionSource, /export function RevealGroup/)
  assert.match(motionSource, /data-motion=\"component-reveal\"/)
  assert.match(motionSource, /data-motion=\"reveal-group\"/)
  assert.match(motionSource, /data-motion-trigger/)
  assert.match(motionSource, /data-motion-pace/)
})

test("uses the balanced page and component motion timings", () => {
  assert.match(
    motionCss,
    /swish-page-entrance 280ms cubic-bezier\(0\.22, 1, 0\.36, 1\)/,
  )
  assert.match(motionCss, /translate3d\(0, 12px, 0\)/)
  assert.match(
    motionCss,
    /swish-component-reveal 220ms cubic-bezier\(0\.22, 1, 0\.36, 1\)/,
  )
  assert.match(motionCss, /translate3d\(0, 8px, 0\)/)
  assert.match(motionCss, /\.component-reveal\.component-reveal-subtle[\s\S]*animation-duration: 160ms/)
  assert.match(motionCss, /\.component-reveal\.component-reveal-subtle[\s\S]*animation-timing-function: cubic-bezier\(0\.33, 1, 0\.68, 1\)/)
})

test("caps standard and compact reveal groups after six items", () => {
  assert.match(motionCss, /45ms/)
  assert.match(motionCss, /25ms/)
  assert.match(motionCss, /:nth-child\(n \+ 6\)/)
  assert.match(motionCss, /reveal-group-compact/)
})

test("replays active component reveals without adding exit motion", () => {
  assert.match(
    motionCss,
    /component-reveal\[data-motion-trigger=\"active\"\]\[data-state=\"active\"\]/,
  )
  assert.match(motionCss, /prefers-reduced-motion: reduce/)
  assert.match(motionCss, /component-reveal/)
  assert.match(motionCss, /reveal-group/)
  assert.doesNotMatch(motionCss, /swish-component-exit/)
})

test("keeps an explicit component reveal coverage list for every route family", () => {
  assert.deepEqual(
    componentRevealCoverage.map(({ family }) => family),
    [
      "auth",
      "invitations",
      "documentation",
      "organization-directory",
      "organization-workspace",
      "organization-operations",
      "roster-and-manager",
      "scorekeeper",
    ],
  )

  for (const entry of componentRevealCoverage) {
    const source = readFileSync(
      new URL(`../${entry.source}`, import.meta.url),
      "utf8",
    )

    assert.ok(entry.routes.length > 0, `${entry.family} needs route coverage`)
    assert.match(
      source,
      /ComponentReveal|RevealGroup/,
      `${entry.family} must use component-level motion primitives`,
    )
  }
})
