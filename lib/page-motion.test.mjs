import assert from "node:assert/strict"
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import test from "node:test"
import * as ts from "typescript"

const motionSource = readFileSync(
  new URL("../components/motion/page-motion.tsx", import.meta.url),
  "utf8",
)
const presenceSource = readFileSync(
  new URL("../components/motion/presence-reveal.tsx", import.meta.url),
  "utf8",
)
const motionCss = readFileSync(
  new URL("../app/globals.css", import.meta.url),
  "utf8",
)
const appRoot = fileURLToPath(new URL("../", import.meta.url))

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
  assert.match(presenceSource, /export function PresenceReveal/)
  assert.match(presenceSource, /present: boolean/)
  assert.match(presenceSource, /collapse\?: boolean/)
  assert.match(presenceSource, /data-motion-collapse/)
  assert.match(presenceSource, /window\.setTimeout/)
  assert.match(presenceSource, /setIsMounted\(true\)/)
  assert.match(presenceSource, /motionState === "exit"/)
  assert.match(motionSource, /data-motion=\"component-reveal\"/)
  assert.match(motionSource, /data-motion=\"reveal-group\"/)
  assert.match(motionSource, /data-motion-trigger/)
  assert.match(motionSource, /data-motion-pace/)
  assert.match(motionSource, /data-motion-phase/)
})

test("uses component-led page and component motion timings", () => {
  assert.match(
    motionCss,
    /swish-page-entrance 140ms cubic-bezier\(0\.22, 1, 0\.36, 1\)/,
  )
  const pageKeyframes = motionCss.match(
    /@keyframes swish-page-entrance[\s\S]*?\n}\n\n@keyframes swish-component-reveal/,
  )?.[0]
  assert.ok(pageKeyframes, "page entrance keyframes should be defined")
  assert.doesNotMatch(pageKeyframes, /transform/)
  assert.match(
    motionCss,
    /swish-component-reveal 260ms cubic-bezier\(0\.22, 1, 0\.36, 1\)/,
  )
  assert.match(motionCss, /translate3d\(0, 10px, 0\)/)
  assert.match(motionCss, /\.component-reveal\.component-reveal-subtle[\s\S]*animation-duration: 180ms/)
  assert.match(motionCss, /translate3d\(0, 4px, 0\)/)
  assert.match(motionCss, /\.component-reveal\.component-reveal-subtle[\s\S]*animation-timing-function: cubic-bezier\(0\.33, 1, 0\.68, 1\)/)
})

test("caps standard and compact reveal groups after six items", () => {
  assert.match(motionCss, /45ms/)
  assert.match(motionCss, /25ms/)
  assert.match(motionCss, /60ms/)
  assert.match(motionCss, /40ms/)
  assert.match(motionCss, /data-motion-phase="secondary"/)
  assert.match(motionCss, /data-motion-phase="tertiary"/)
  assert.match(motionCss, /:nth-child\(n \+ 6\)/)
  assert.match(motionCss, /reveal-group-compact/)
})

test("supports active reveals and presence-aware exit motion", () => {
  assert.match(
    motionCss,
    /component-reveal\[data-motion-trigger=\"active\"\]\[data-state=\"active\"\]/,
  )
  assert.match(motionCss, /data-motion-trigger="active"[\s\S]*animation-delay: 0ms/)
  assert.match(motionCss, /@keyframes swish-component-exit/)
  assert.match(
    motionCss,
    /presence-reveal\[data-motion-state=\"exit\"\][\s\S]*swish-component-exit/,
  )
  assert.match(motionCss, /@keyframes swish-presence-expand/)
  assert.match(motionCss, /@keyframes swish-presence-collapse/)
  assert.match(motionCss, /grid-template-rows: 0fr/)
  assert.match(motionCss, /grid-template-rows: 1fr/)
  assert.match(motionCss, /presence-reveal\[data-motion-collapse=\"true\"\]/)
  assert.match(motionCss, /prefers-reduced-motion: reduce/)
  assert.match(motionCss, /component-reveal/)
  assert.match(motionCss, /presence-reveal/)
  assert.match(motionCss, /reveal-group/)
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

function collectTsxFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(directory, entry.name)

    if (entry.isDirectory()) {
      return collectTsxFiles(fullPath)
    }

    return entry.name.endsWith(".tsx") ? [fullPath] : []
  })
}

function jsxTagName(node) {
  if (ts.isJsxElement(node)) {
    return node.openingElement.tagName.getText(node.getSourceFile())
  }

  if (ts.isJsxSelfClosingElement(node)) {
    return node.tagName.getText(node.getSourceFile())
  }

  return null
}

function collectGroupOwnerNames(files) {
  const names = new Set(["RevealGroup"])

  function containsRevealGroup(node) {
    let found = false

    function visit(node) {
      if (jsxTagName(node) === "RevealGroup") {
        found = true
        return
      }

      ts.forEachChild(node, visit)
    }

    visit(node)
    return found
  }

  for (const filePath of files) {
    const sourceText = readFileSync(filePath, "utf8")

    if (!sourceText.includes("RevealGroup")) {
      continue
    }

    const sourceFile = ts.createSourceFile(
      filePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    )

    function visit(node) {
      if (
        ts.isFunctionDeclaration(node) &&
        node.name?.text &&
        containsRevealGroup(node)
      ) {
        names.add(node.name.text)
      }

      if (
        ts.isVariableDeclaration(node) &&
        node.name &&
        node.initializer &&
        containsRevealGroup(node.initializer) &&
        (ts.isArrowFunction(node.initializer) ||
          ts.isFunctionExpression(node.initializer))
      ) {
        names.add(node.name.getText(sourceFile))
      }

      ts.forEachChild(node, visit)
    }

    visit(sourceFile)
  }

  return names
}

function findCompoundedMotionWrappers(filePath, groupOwnerNames) {
  const sourceText = readFileSync(filePath, "utf8")
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const issues = []

  function visit(node, ancestors = []) {
    const tag = jsxTagName(node)

    if (tag) {
      if (
        ancestors.includes("ComponentReveal") &&
        (tag === "ComponentReveal" || groupOwnerNames.has(tag))
      ) {
        issues.push({
          filePath,
          line:
            sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
              .line + 1,
          tag,
        })
      }

      const nextAncestors = [...ancestors, tag]
      ts.forEachChild(node, (child) => visit(child, nextAncestors))
      return
    }

    ts.forEachChild(node, (child) => visit(child, ancestors))
  }

  visit(sourceFile)
  return issues
}

test("keeps a single animated ancestor for every motion wrapper", () => {
  const files = [
    ...collectTsxFiles(join(appRoot, "app")),
    ...collectTsxFiles(join(appRoot, "components")),
  ]
  const groupOwnerNames = collectGroupOwnerNames(files)
  const issues = files.flatMap((filePath) =>
    findCompoundedMotionWrappers(filePath, groupOwnerNames),
  )

  assert.deepEqual(
    issues,
    [],
    issues
      .map(
        ({ filePath, line, tag }) =>
          `${filePath}:${line} contains nested ${tag}`,
      )
      .join("\n"),
  )
})
