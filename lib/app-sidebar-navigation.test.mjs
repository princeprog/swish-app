import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const appSidebarSource = readFileSync(
  new URL("../components/app-sidebar.tsx", import.meta.url),
  "utf8",
)

test("organization sidebar does not render the temporary projects quick links", () => {
  assert.equal(appSidebarSource.includes("NavProjects"), false)
  assert.equal(appSidebarSource.includes("Open docs"), false)
  assert.equal(appSidebarSource.includes("All organizations"), false)
})
