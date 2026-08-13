# In-App Compliance Evidence Preview Design

## Goal

Let an administrator inspect a verified file submitted by a team manager without leaving the Swish review workflow or opening a second browser tab.

## Current problem

The review detail sheet requests a short-lived private Cloudinary URL, then sends it to `window.open`. This breaks the review context and makes the file difficult to inspect alongside the submission. Files that are still being checked must remain unavailable, because their verification state is not complete.

## Decision

Keep the existing on-demand private download URL request, but store the returned URL in local component state and render it in a second, focused `Dialog` within the Swish app.

- Verified PDF files render in an iframe sized to the available dialog area.
- Verified JPEG and PNG files render in a fit-to-screen image viewer.
- An unsupported extension gets an in-app explanation instead of external navigation. The current upload contract only permits PDF, JPEG, and PNG, so this is a defensive fallback.
- The preview dialog shows the original filename, a short-lived private-preview explanation, a visible close action, and the built-in Escape/backdrop close behavior.
- The attachment action is labeled and iconified as a preview action rather than an external-link action.
- Signed URLs are fetched only after an administrator selects a verified file and are not persisted in application storage.

## Scope

### Frontend

Modify `components/organizations/compliance/division-compliance-review-detail.tsx` only:

1. Replace `window.open(download.url, ...)` with preview state.
2. Add file-kind detection based on the existing original filename field.
3. Add the preview dialog and responsive content frame.
4. Update visible evidence copy and accessibility labels to describe in-app preview behavior.

Extend `lib/compliance-review-inbox.test.mjs` with source-level regression assertions that verify:

- The review detail still requests `downloadUrl`.
- Verified files use the preview flow.
- The component renders both PDF and image preview paths.
- External-tab navigation is absent.
- The preview has a close action and user-facing private-preview copy.

### Backend

No backend changes are required. The existing private signed URL endpoint remains the source of access-controlled file content, and the prior Cloudinary signing fix remains unchanged.

## User experience

1. The administrator opens a submission in the existing review detail sheet.
2. A verified attachment shows a preview action. Pending, scanning, or rejected attachments remain disabled and explain why.
3. Selecting preview briefly shows the existing loading state while the signed URL is requested.
4. The preview opens over the current Swish page. The administrator can inspect the file, close it, and continue reviewing the same submission.
5. If URL generation fails, the modal does not open and the existing friendly toast error is shown.

## Acceptance criteria

- No file action from the admin review detail calls `window.open`, uses `_blank`, or redirects the user.
- PDFs and supported images are viewable inside a Swish dialog on desktop and narrow screens.
- The dialog is closable through its close control, Escape, or backdrop.
- The user can identify the file being viewed from the dialog title.
- Unverified files cannot be previewed and retain their status guidance.
- Focused frontend regression tests and typecheck pass.

