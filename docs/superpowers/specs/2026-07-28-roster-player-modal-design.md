# Roster Player Modal Design

## Goal

Refactor the Add Player and Edit Roster Player modal into a compact, professional form that matches the Teams workflow and keeps roster entry fast.

## Scope

- Replace the custom full-screen card overlay with the shared shadcn `Dialog`.
- Remove the roster preview and all preview-only calculations.
- Preserve the existing create and edit mutations, validation rules, fields, and status values.
- Keep the modal responsive and keyboard accessible.

## Layout

The dialog uses a maximum width of roughly 640 pixels and scrolls within the viewport on smaller screens.

The header contains:

- `Add player to roster` or `Edit roster player`.
- A short description that names the destination team.
- The shared dialog close control.

The form body contains:

1. A compact, read-only team context row with a shield icon, team name, and `Roster assignment` label.
2. A full-width player name field.
3. Jersey number and primary position fields in a two-column layout that collapses to one column on mobile.
4. An Active/Inactive segmented status control with clear selected state.
5. Inline validation or API errors near the form controls.

The footer contains `Cancel` and the primary `Add player` or `Save changes` action. The primary action retains its pending state and loading icon.

## Interaction And Accessibility

- Closing the dialog through the close button, Escape key, or overlay calls the existing close handler.
- Labels remain programmatically associated with inputs.
- Required fields use native `required` attributes in addition to the existing submit validation.
- The status control remains keyboard reachable and does not rely on color alone.
- Existing create and edit behavior remains unchanged.

## Verification

- Run `pnpm typecheck`.
- Open the roster route and exercise both create and edit modal entry points.
- Confirm the preview is absent, the dialog fits desktop and mobile viewports, focus is contained, Escape closes it, and no console errors appear.
- Run `git diff --check` before committing the implementation.
