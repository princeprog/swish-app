# Division Requirements Review Inbox Design

## Purpose

Make division compliance feel like an official league operations workflow rather than a collection of forms. Organizers should be able to process submissions quickly and confidently; team managers should understand exactly what remains before their team can compete.

The redesign covers both sides of the same workflow:

- organizer/admin division requirements and review
- team-manager requirement submission and clearance

The existing API contract and permission model remain the source of truth. This work is a frontend information-architecture and interaction redesign using the app's existing shadcn/ui component set.

## Design direction

Use the approved **Review Inbox** direction:

- review work is the default organizer view
- configuration is available beside it without competing with the queue
- a selected submission opens in a detail sheet instead of navigating away
- manager work is a guided checklist with visible progress and one clear next step

The visual language stays aligned with the existing Swish workspace: restrained neutral surfaces, semantic status colors, compact operational density, rounded shadcn primitives, and short plain-language copy.

## Organizer experience

### Page shell

Keep the existing authenticated workspace shell with `AppSidebar`, `WorkspaceHeader`, and responsive `SidebarInset` layout. The page title is the division name followed by “Requirements”. Add a breadcrumb or back link to the division list when space allows.

The header contains:

- division name and season context
- settings lifecycle badge: Draft, Published, or Archived
- a primary “Review submissions” affordance
- a secondary “Checklist settings” affordance

### Overview strip

Place a compact status strip above the queue. Use four semantic summary items rather than decorative dashboard cards:

- Needs review
- Blocked
- Cleared
- Not required

Each item is keyboard reachable when it filters the queue. The active filter is visibly indicated without relying on color alone.

### Review queue

Use shadcn primitives as follows:

- `Tabs` for queue scope: Needs review, All submissions, and Completed
- `Input` for team or requirement search
- `Select` for division/status filtering when a select is more appropriate than tabs
- `Table` on desktop with columns for team, requirement, submitted date, status, and action
- stacked `Item` rows on small screens
- `Badge` for workflow state and required/optional metadata
- `Avatar` with `AvatarFallback` for team identity
- `Pagination` for the existing server-side result set
- `Skeleton`, `Empty`, and `Alert` for loading, no-results, and error states

Rows should be selectable by keyboard and mouse. Selecting a row opens the detail sheet and preserves the queue position and filters.

### Submission detail sheet

Use a shadcn `Sheet` with an accessible `SheetTitle` and `SheetDescription`. The sheet is divided into three readable sections:

1. **Submission summary** — team, requirement, response type, submitted time, status, and current reviewer note.
2. **Evidence and response** — text/link/acknowledgement value or private file list. File actions request a short-lived download URL and never expose storage credentials or public asset URLs.
3. **Activity** — immutable attempt and event history shown in an `Accordion` or chronological list.

Keep reviewer actions sticky at the bottom of the sheet:

- Approve
- Request changes
- Waive
- Reopen when the workflow status allows it

Destructive or official transitions use `AlertDialog`. “Request changes” and “Waive” collect a required plain-language reason in a `Dialog` using `Field`, `FieldLabel`, `Textarea`, and validation feedback.

### Checklist settings

Keep the existing route and place the builder in a secondary `Checklist settings` tab; `Review submissions` is the default tab. Keep the current functionality, but compose it with:

- `Card` sections for guidance/deadline and requirement list
- `FieldGroup`/`Field` for labels and validation
- `Select` for response type
- `Switch` for required/optional
- lightweight separated requirement rows; Add and Edit open a shared `Dialog` editor
- `AlertDialog` for archive and publish confirmation
- `Badge` for lifecycle and required/optional state

Published settings should display an explicit “Changes affect new submissions” message where relevant.

## Team-manager experience

### Clearance header

Use a prominent but calm `Card` at the top of the page containing:

- “Competition clearance” title
- team and division context
- `Badge` for Not required, Pending, Blocked, or Cleared
- `Progress` for required-item completion
- submission deadline when present
- a short explanation that approved items or active waivers clear the team

If no published requirements exist, use the existing `Empty` pattern and explain that the organizer has not published the checklist yet.

### Guided requirement list

Use a `Tabs` control for To complete, Submitted, and History; the default tab is To complete. Each requirement is an `Accordion` item with:

- title, required/optional label, response type, and workflow badge
- concise organizer instructions
- current review note when changes are requested
- the correct `Field` control for the response type
- file attachment list using the existing attachment primitive, verification status, and retry affordance
- Save draft and Submit for review actions

Do not hide the next action behind a menu. Disable controls while saving or uploading and explain whether work was saved.

### Responsive behavior

- Desktop: two-column clearance summary and checklist content where it improves scanning; no nested cards for ordinary list rows.
- Tablet: single main column with a compact summary strip.
- Mobile: one-column list, full-width controls, and a sticky bottom action region only when it does not obscure the current field.

## Data and interaction behavior

- Continue using the existing React Query hooks and compliance service methods.
- Invalidate division overview, queue, team compliance, and manager workspace queries after mutations.
- Keep queue filters in URL/search state when practical so a reviewer can refresh or share a filtered view.
- Open reviewer details from queue data and fetch the selected team's compliance details on demand.
- Request private download URLs only when a reviewer or manager explicitly opens a file.
- Preserve draft response hydration so a manager never loses a saved response on refresh.
- Use clear toasts for successful actions and inline `Alert`/field errors for recoverable failures.

## Accessibility and content rules

- All controls have visible labels or meaningful `aria-label` values.
- Sheets, dialogs, and alert dialogs include accessible titles and descriptions.
- Status is conveyed through text plus semantic styling, never color alone.
- Tables have meaningful headers; mobile rows preserve the same information order.
- Keyboard focus remains visible when opening/closing detail surfaces.
- Copy stays plain and user-facing: “Request changes” and “The team can submit again after updating this item.”

## Verification

Before handoff:

- run `pnpm typecheck`
- run `pnpm build`
- run the existing app test suite if available
- manually verify desktop and narrow layouts in the visual companion/dev app
- verify loading, empty, error, disabled, request-changes, approved, waived, and cleared states
- confirm no API secrets or storage URLs are rendered in the UI

## Out of scope

- changes to the compliance database or API contract unless an existing endpoint cannot support the approved interaction
- new public-facing league pages
- player-level requirements
- payments, registration fees, or broader document-management features
