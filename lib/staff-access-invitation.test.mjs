import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const dialogSource = await readFile(
  new URL(
    "../components/organizations/members/invitation-access-dialog.tsx",
    import.meta.url,
  ),
  "utf8",
)
const pickerSource = await readFile(
  new URL(
    "../components/organizations/members/team-assignment-picker.tsx",
    import.meta.url,
  ),
  "utf8",
)
const screenSource = await readFile(
  new URL(
    "../components/organizations/members/staff-access-screen.tsx",
    import.meta.url,
  ),
  "utf8",
)

test("uses shadcn form primitives for the invitation workflow", () => {
  assert.match(dialogSource, /FieldGroup/)
  assert.match(dialogSource, /<Select/)
  assert.match(dialogSource, /<DialogContent className="flex max-h/)
  assert.match(pickerSource, /<Select/)
  assert.match(pickerSource, /<SelectTrigger/)
  assert.match(pickerSource, /<SelectItem value="none">No team this season<\/SelectItem>/)
  assert.doesNotMatch(pickerSource, /<RadioGroup\s+aria-label=.*team/)
  assert.match(pickerSource, /<Alert>/)
})

test("animates team access in and out and reveals team choices on demand", () => {
  assert.match(
    dialogSource,
    /<PresenceReveal[^>]*collapse[^>]*present=\{role === "team_manager"\}/,
  )
  assert.match(dialogSource, /<TeamAssignmentPicker/)
  assert.match(
    pickerSource,
    /<PresenceReveal[\s\S]*collapse[\s\S]*present=\{!isLoading && assignmentMode === "now" && teams.length > 0\}/,
  )
})

test("exposes explicit pending team assignment states", () => {
  assert.match(pickerSource, /Assign teams now/)
  assert.match(pickerSource, /Assign later/)
  assert.match(screenSource, /Needs team assignment/)
  assert.match(screenSource, /Edit.*invitation/i)
})

test("loads team options only while an access editor is open", () => {
  assert.match(screenSource, /useAssignableTeamsQuery\(organization\?\.id, editorOpen\)/)
})
