import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const schedulesSource = await readFile(
  new URL(
    "../components/organizations/schedules/organization-schedules-view.tsx",
    import.meta.url,
  ),
  "utf8",
)

test("keeps the schedule board separated from the filter controls", () => {
  assert.match(
    schedulesSource,
    /<ComponentReveal className="mt-4">\s*<ScheduleBoard/,
  )
})

test("uses one height contract for schedule search and filters", () => {
  assert.match(
    schedulesSource,
    /const scheduleFilterControlClassName = "h-9 w-full"/,
  )
  assert.match(
    schedulesSource,
    /className=\{`\$\{scheduleFilterControlClassName\} pl-9`\}/,
  )
  assert.equal(
    schedulesSource.match(/className=\{scheduleFilterControlClassName\}/g)
      ?.length,
    3,
  )
})
