# Roster Player Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the oversized roster player form overlay with a compact, accessible dialog and remove the roster preview.

**Architecture:** Refactor only `RosterPlayerFormModal` inside the existing roster client component. Reuse the shared dialog primitives already used by the Teams workflow, preserve the component props and mutation calls, and remove preview-only state derived from the form.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, shadcn/Radix Dialog, lucide-react.

## Global Constraints

- Preserve the existing create and edit mutations, validation rules, fields, and status values.
- Remove the roster preview and all preview-only calculations.
- Keep the modal responsive and keyboard accessible.
- Do not change player assignment behavior or API payloads.
- Commit the implementation as a separate change.

---

### Task 1: Refactor The Roster Player Form Modal

**Files:**
- Modify: `components/organizations/roster/team-roster-view.tsx:1-665`
- Test: No component test runner is configured; verify with TypeScript and the live roster route.

**Interfaces:**
- Consumes: `RosterPlayerFormModal` props and `onSubmit({ jerseyNumber, name, position, status })`.
- Produces: The same `RosterPlayerFormModal` interface and submit payload with a new accessible dialog presentation.

- [ ] **Step 1: Establish the pre-change browser baseline**

Open the roster route, launch `New player`, and record that the current dialog contains `Roster preview` and uses the custom full-screen overlay.

- [ ] **Step 2: Replace preview and overlay imports**

Add the shared dialog imports:

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
```

Keep `X` because the roster filters panel still uses it. Keep `Shield` for the locked team context row.

- [ ] **Step 3: Remove preview-only calculations**

Delete these values from `RosterPlayerFormModal`:

```tsx
const previewName = name.trim() || "Player name"
const previewPosition = position ? formatPlayerPosition(position) : "Position"
const previewInitials = getInitials(previewName)
```

Do not change form state, validation, or the submit payload.

- [ ] **Step 4: Implement the compact dialog**

Replace the custom fixed overlay and Card wrapper with this structure:

```tsx
<Dialog open onOpenChange={(open) => !open && onClose()}>
  <DialogContent className="max-h-[calc(100vh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-2xl">
    <DialogHeader className="gap-1.5 border-b border-border/60 px-6 py-5 pr-14">
      <DialogTitle className="text-lg">
        {mode === "create" ? "Add player to roster" : "Edit roster player"}
      </DialogTitle>
      <DialogDescription>
        Add player details for {team.name}. Team assignment stays locked to this roster.
      </DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>
```

Render the locked team as a non-input context row:

```tsx
<div className="flex items-center gap-3 rounded-md border border-border/60 bg-muted/30 px-3 py-2.5">
  <div className="flex size-8 items-center justify-center rounded-md border border-border/60 bg-background">
    <Shield className="size-4 text-muted-foreground" />
  </div>
  <div className="min-w-0">
    <p className="text-xs text-muted-foreground">Roster assignment</p>
    <p className="truncate text-sm font-medium">{team.name}</p>
  </div>
</div>
```

Use a full-width player name field. Place jersey number and position in `grid gap-5 sm:grid-cols-2`. Add native `required` attributes to name, jersey number, and position controls. Keep the status buttons, but use `aria-pressed={selected}` so the selected state is conveyed without color.

Place the form controls inside `<div className="space-y-5 px-6 py-5">`. Render `FieldError` after the status field when `validationError || errorMessage` is truthy. Put the existing Cancel and pending-aware submit buttons inside `<DialogFooter className="border-t border-border/60 px-6 py-4">`.

- [ ] **Step 5: Type-check the refactor**

Run:

```bash
pnpm typecheck
```

Expected: exit code 0 with `tsc --noEmit`.

- [ ] **Step 6: Verify the live interaction**

At the roster route:

- Open the Add Player dialog and confirm `Roster preview` is absent.
- Confirm the team context, player name, jersey number, position, and status are visible without overflow.
- Tab through every control and confirm focus stays in the dialog.
- Press Escape and confirm the dialog closes.
- Reopen it at desktop and mobile viewport sizes and confirm fields do not overlap.
- Confirm the browser console has no errors.

- [ ] **Step 7: Validate and commit**

Run:

```bash
git diff --check
git status --short
```

Stage only `components/organizations/roster/team-roster-view.tsx`, then commit:

```bash
git commit -m "Refactor roster player modal"
```
