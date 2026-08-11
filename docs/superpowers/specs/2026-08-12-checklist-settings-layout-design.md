# Checklist Settings Layout Design

## Goal

Make the organizer checklist settings screen feel like a focused operations workspace: easy to scan, safe to publish, and efficient for editing guidance and requirements.

## Direction

Keep the existing authenticated route, React Query mutations, dialogs, confirmations, and URL state unchanged. Refine only the presentation inside `DivisionComplianceBuilder`:

- Add a compact settings header that combines the section title, status badge, short description, and the primary “Add requirement” action.
- Use a responsive two-column layout. The left column contains guidance and the requirement list; the right column contains the publishing summary and consequence copy.
- Replace oversized nested cards with one framed workspace and separated requirement rows. Each row keeps the title, response type, Required/Optional badge, instructions, and edit/archive actions visually distinct.
- Use shadcn `FieldGroup`/`Field` for guidance and requirement metadata, `Dialog` for editing, and `AlertDialog` for archive/publish confirmations.
- Keep the published-state message explicit: changes apply to new submissions and may change what managers see.

## Interaction and states

- Draft, published, loading, mutation-pending, empty, and error states retain their current plain-language behavior.
- “Add requirement” remains the primary action and opens the existing accessible dialog.
- Publish remains disabled when no requirements exist or the checklist is already published.
- Archive remains a confirmed action and preserves existing submissions in history.
- The layout collapses to one column on narrow screens without hiding primary actions.

## Verification

- Add a focused static regression test for the settings header, publish panel, separated requirement rows, and semantic layout primitives.
- Run the focused Node test, frontend typecheck, production build, and `git diff --check`.
- Inspect the organizer requirements route in the local browser at desktop width and confirm the settings tab remains readable and interactive.
