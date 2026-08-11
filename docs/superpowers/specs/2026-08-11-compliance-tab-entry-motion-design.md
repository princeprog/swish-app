# Requirements Tab Entry Motion Design

## Goal

Make switching between the organizer requirements tabs feel responsive without
replaying motion every time the user moves between review and settings.

## Behavior

- The initially active tab renders with the existing page entrance only.
- The first user entry into each other tab uses the existing subtle
  `ComponentReveal` motion.
- Once a tab has been entered during the current page lifetime, later entries
  render immediately with no tab-specific animation.
- A full page refresh starts a new one-time animation lifecycle.
- Changing tabs continues to preserve the existing URL query state and uses the
  existing shadcn `Tabs` keyboard interaction.

## Implementation

Keep the behavior local to `DivisionComplianceScreen`:

- Track visited views in a `Set` held by a ref so tracking does not cause extra
  renders or persist outside the page.
- When `changeView` receives a new view, mark it visited and record whether that
  entry is the first one.
- Wrap only a first-entry panel in the existing subtle `ComponentReveal`.
  Render later entries directly, leaving the panel content and data flow
  unchanged.
- Do not add a new animation library, storage key, global CSS selector, or
  change to the API.

## Accessibility and resilience

- Keep the current tab labels, roles, focus behavior, and URL navigation.
- Reuse the existing motion system so its `prefers-reduced-motion` rules still
  disable or minimize animation for users who request reduced motion.
- The first-entry state is interaction-only and must not block loading, errors,
  mutations, or the review/settings controls.

## Verification

- Add focused assertions covering the visited-view state and one-time reveal
  path in the existing compliance inbox test file.
- Run the focused and full frontend Node test suites, typecheck, production
  build, formatting checks, and `git diff --check`.
- Inspect the organizer requirements route and confirm the first entry animates
  while subsequent tab switches remain immediate.
