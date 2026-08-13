# In-App Compliance Evidence Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** Let administrators inspect verified team-manager evidence inside Swish without opening another browser tab or losing the review context.

**Architecture:** Keep the existing access-controlled \`downloadUrl\` request and short-lived Cloudinary URL. Replace external navigation with local \`previewFile\` state and a second Radix Dialog rendered through the existing shadcn dialog primitive. Select the renderer from the existing filename: PDF uses an iframe, JPEG/PNG use an object-contain image viewer, and any unexpected extension receives an in-app fallback message.

**Tech Stack:** Next.js App Router, React client component, TypeScript, shadcn/Radix Dialog, Tailwind CSS, Node test runner source-level regression tests.

## Global Constraints

- Verified files are the only files eligible for preview.
- Private URLs are fetched on demand and must not be persisted in application storage.
- User-facing copy must explain the next action in plain language.
- Do not modify the backend download contract or Cloudinary storage behavior for this frontend-only change.
- Do not use \`window.open\`, \`_blank\`, or another browser-tab redirect for evidence preview.

---

### Task 1: Add the regression contract for in-app preview

**Files:**

- Modify: \`lib/compliance-review-inbox.test.mjs\` near the existing private-download review tests.
- Read: \`components/organizations/compliance/division-compliance-review-detail.tsx\` as the source under test.

**Interfaces:**

- Consumes: the review detail source string already loaded by \`reviewDetailSource\`.
- Produces: a focused test that fails until the component has local preview state, PDF/image renderers, close copy, and no external-tab navigation.

- [ ] **Step 1: Write the failing test**

Add this test after the existing verified-file test:

    test("admin review previews verified evidence inside Swish", () => {
      assert.match(reviewDetailSource, /setPreviewFile/)
      assert.match(reviewDetailSource, /previewFile !== null/)
      assert.match(reviewDetailSource, /<iframe/)
      assert.match(reviewDetailSource, /<img/)
      assert.match(reviewDetailSource, /Close preview/)
      assert.doesNotMatch(reviewDetailSource, /window\\.open/)
      assert.doesNotMatch(reviewDetailSource, /["']_blank["']/)
    })

- [ ] **Step 2: Run the focused test and verify the expected failure**

Run from \`swish-app\`:

    node --test lib/compliance-review-inbox.test.mjs

Expected: the existing tests pass and the new test fails because the review detail still contains \`window.open\` and has no preview dialog.

### Task 2: Implement the responsive in-app file preview

**Files:**

- Modify: \`components/organizations/compliance/division-compliance-review-detail.tsx\`.

**Interfaces:**

- Consumes: \`ComplianceFileReference\`, \`complianceService.downloadUrl\`, and the existing verified-file guard.
- Produces: local \`previewFile\` state, \`previewKind\` selection, and a controlled \`Dialog\` that renders the file without leaving Swish.

- [ ] **Step 1: Add preview types and filename-based renderer selection**

Import \`Eye\` and \`LoaderCircle\` from \`lucide-react\`. Add:

    type PreviewKind = "pdf" | "image" | "unsupported";

    type PreviewFile = {
      file: ComplianceFileReference;
      url: string;
    };

    function previewKind(file: ComplianceFileReference): PreviewKind {
      const fileName = (file.original_filename ?? file.name ?? "").toLowerCase();
      if (fileName.endsWith(".pdf")) return "pdf";
      if (/\.(jpe?g|png)$/.test(fileName)) return "image";
      return "unsupported";
    }

- [ ] **Step 2: Replace external navigation with preview state**

Add \`previewFile\` state beside \`downloadingFileId\`:

    const [previewFile, setPreviewFile] =
      React.useState<PreviewFile | null>(null);

In \`openPrivateFile\`, keep the verified guard and URL request, but replace the external navigation with:

    setPreviewFile({ file, url: download.url });

Derive the displayed filename and kind before the return:

    const previewFileName =
      previewFile?.file.original_filename ??
      previewFile?.file.name ??
      "Evidence file";
    const previewFileKind = previewFile ? previewKind(previewFile.file) : null;

- [ ] **Step 3: Update the attachment action to describe preview behavior**

Replace the \`ExternalLink\` icon with \`Eye\`, render \`LoaderCircle\` with \`className="animate-spin"\` while the file is loading, and change the verified label from \`Open\` to \`Preview\`. Preserve the existing disabled condition so non-verified files cannot call \`downloadUrl\`.

Update the evidence helper copy to:

    Verified files can be previewed here in a secure, short-lived viewer.

- [ ] **Step 4: Add the controlled preview Dialog**

Render a second \`Dialog\` after the existing reason dialog. It must use \`open={previewFile !== null}\`, clear state when closed, show the filename and short-lived preview copy, render a full-height iframe for PDFs, render a centered scrollable object-contain \`img\` for JPEG/PNG files, show a plain-language fallback for unexpected extensions, and include a \`Close preview\` button.

Use these key renderer branches:

    {previewFileKind === "pdf" ? (
      <iframe
        className="h-full w-full"
        src={previewFile.url}
        title={\`Preview of \${previewFileName}\`}
      />
    ) : previewFileKind === "image" ? (
      <div className="flex h-full items-center justify-center overflow-auto p-4">
        <img
          alt={\`Preview of \${previewFileName}\`}
          className="max-h-full max-w-full object-contain"
          src={previewFile.url}
        />
      </div>
    ) : (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <p className="text-sm text-muted-foreground">
          This file type cannot be previewed here.
        </p>
      </div>
    )}

The dialog content should be responsive, use \`h-[min(90vh,52rem)]\`, \`w-[min(96vw,64rem)]\`, \`max-w-none\`, and a flex-column layout. Use the existing Dialog primitive close control plus the explicit footer button.

- [ ] **Step 5: Run the focused test and verify it passes**

Run:

    node --test lib/compliance-review-inbox.test.mjs

Expected: all focused compliance inbox tests pass, including the no-new-tab preview test.

### Task 3: Verify the frontend and commit the implementation

**Files:**

- Review: \`components/organizations/compliance/division-compliance-review-detail.tsx\`.
- Review: \`lib/compliance-review-inbox.test.mjs\`.
- Review: \`docs/superpowers/specs/2026-08-13-compliance-file-preview-design.md\`.

**Interfaces:**

- Consumes: the completed preview dialog and regression test.
- Produces: a verified frontend change with an intentional implementation commit.

- [ ] **Step 1: Check formatting and the complete focused test**

Run:

    git diff --check
    node --test lib/compliance-review-inbox.test.mjs

Expected: no whitespace errors and all focused tests pass.

- [ ] **Step 2: Run TypeScript validation and production build**

Run:

    pnpm typecheck
    pnpm build

Expected: both commands exit successfully. If \`pnpm lint\` is attempted, report the existing ESLint 9 flat-config blocker separately if it remains unchanged.

- [ ] **Step 3: Inspect the final diff and commit**

Run:

    git diff --stat
    git diff -- components/organizations/compliance/division-compliance-review-detail.tsx lib/compliance-review-inbox.test.mjs
    git status --short

Confirm the diff contains no \`window.open\`, \`_blank\`, or unrelated backend changes, then commit:

    git add -- components/organizations/compliance/division-compliance-review-detail.tsx lib/compliance-review-inbox.test.mjs
    git commit -m "feat(compliance): preview evidence files in app"

