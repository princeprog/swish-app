# Checklist Settings Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the organizer checklist settings surface into a clean, professional, responsive operations workspace without changing its data or workflow behavior.

**Architecture:** Keep the existing `DivisionComplianceBuilder` client component, React Query mutations, shadcn dialogs, and route URL state. Recompose the builder into a compact header, a framed settings workspace with separated requirement rows, and a responsive publish summary panel. Extend the existing static Node test rather than adding a new test harness.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind v4, existing shadcn/ui components, Node test runner.

## Global Constraints

- Keep `page.tsx` files thin and preserve the existing authenticated route shell.
- Use existing shadcn/ui components and semantic tokens; do not add a UI library or raw color utilities.
- Preserve mutations, permissions, routes, plain-language copy, dialog confirmations, and publish behavior.
- Keep the layout responsive: primary actions remain visible and full width on narrow screens.
- Run the focused test, typecheck, production build, and `git diff --check` before claiming completion.

---

### Task 1: Recompose the checklist settings workspace

**Files:**
- Modify: `components/organizations/compliance/division-compliance-builder.tsx`
- Test: `lib/compliance-review-inbox.test.mjs`

**Interfaces:**
- Consumes the existing `DivisionComplianceResponse`, settings mutation hooks, requirement mutation hooks, and accessible Dialog/AlertDialog behavior.
- Produces the same `DivisionComplianceBuilder` props and mutation callbacks; no API contract changes.

- [ ] **Step 1: Extend the failing static regression test**

Add source assertions that the builder includes the approved settings-workspace language and composition:

```js
assert.match(organizerBuilderSource, /Division checklist/)
assert.match(organizerBuilderSource, /Publishing summary/)
assert.match(organizerBuilderSource, /Published changes apply to new submissions/)
assert.match(organizerBuilderSource, /border-b.*last:border-b-0/)
```

- [ ] **Step 2: Run the focused test to verify the new assertions fail**

Run:

```bash
node --test lib/compliance-review-inbox.test.mjs
```

Expected: the existing tests pass, and the new settings-layout assertions fail because the current builder does not contain the new workspace labels/composition.

- [ ] **Step 3: Implement the layout refactor**

Update the builder presentation while preserving all existing handlers:

1. Add a compact header above the workspace with `Division checklist`, a description, the current `ComplianceStatusBadge`, and the `Add requirement` button.
2. Replace the current nested two-card layout with a responsive `xl:grid-cols-[minmax(0,1fr)_20rem]` workspace. Keep the guidance form and requirement rows in the main column and move the publish content into a concise `Publishing summary` panel.
3. Change the requirement list container to one framed surface with separated rows (`border-b last:border-b-0`) and remove redundant nested row padding/cards.
4. Keep the existing `Dialog` editor and `AlertDialog` archive/publish confirmations. Ensure the editor continues to include `DialogHeader`, `DialogTitle`, `DialogDescription`, `FieldGroup`, `Field`, `FieldLabel`, `FieldDescription`, `Input`, `Textarea`, `Select`, `SelectGroup`, `SelectItem`, and `Switch`.
5. Keep the published-state guidance exact and visible in the publish panel: `Published changes apply to new submissions and may change what managers see.`
6. Replace any remaining raw color utility used by this surface with semantic tokens and keep narrow-screen controls full width where appropriate.

- [ ] **Step 4: Run the focused test, typecheck, and build**

Run:

```bash
node --test lib/compliance-review-inbox.test.mjs
pnpm typecheck
pnpm build
git diff --check
```

Expected: all focused tests pass, TypeScript reports no errors, the Next.js production build completes, and the diff has no whitespace errors.

- [ ] **Step 5: Commit the settings layout**

```bash
git add components/organizations/compliance/division-compliance-builder.tsx lib/compliance-review-inbox.test.mjs
git commit -m "feat(frontend): polish checklist settings workspace"
```

### Task 2: Visual acceptance and handoff

**Files:**
- No additional source files expected.

- [ ] **Step 1: Inspect the organizer settings route**

Open the existing organizer requirements route, choose `Checklist settings`, and verify:

- the header and status are easy to scan;
- guidance, requirements, and publishing summary have clear hierarchy;
- the editor and confirmations remain keyboard accessible;
- the single-column mobile layout keeps `Add requirement`, `Save guidance`, and publish actions visible.

- [ ] **Step 2: Confirm the worktree and commit**

Run:

```bash
git status --short --branch
git log --oneline -3
```

Expected: only the intended settings-layout commit is ahead of the previous branch tip and the worktree is clean.
