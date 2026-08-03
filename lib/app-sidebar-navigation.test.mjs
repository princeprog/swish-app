import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const appSidebarSource = readFileSync(
  new URL("../components/app-sidebar.tsx", import.meta.url),
  "utf8",
)
const teamSwitcherSource = readFileSync(
  new URL("../components/team-switcher.tsx", import.meta.url),
  "utf8",
)

test("organization sidebar does not render the temporary projects quick links", () => {
  assert.equal(appSidebarSource.includes("NavProjects"), false)
  assert.equal(appSidebarSource.includes("Open docs"), false)
  assert.equal(appSidebarSource.includes("All organizations"), false)
})

test("sidebar organization switcher uses a compact dropdown menu", () => {
  assert.equal(teamSwitcherSource.includes("Add team"), false)
  assert.match(teamSwitcherSource, /VISIBLE_ORGANIZATION_LIMIT\s*=\s*3/)
  assert.match(teamSwitcherSource, /DropdownMenu/)
  assert.match(teamSwitcherSource, /Show organizations/)
})
