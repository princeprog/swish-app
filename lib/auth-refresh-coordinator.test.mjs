import assert from "node:assert/strict"
import test from "node:test"

import {
  SessionExpiredError,
  createSessionRefreshCoordinator,
} from "./auth-refresh-coordinator.ts"

class TestApiError extends Error {
  constructor(status) {
    super(`status ${status}`)
    this.status = status
  }
}

function unauthorized() {
  return new TestApiError(401)
}

test("multiple same-tab refresh attempts share one refresh request", async () => {
  let refreshCalls = 0
  const coordinator = createSessionRefreshCoordinator({
    getMe: async () => {
      throw unauthorized()
    },
    isUnauthorizedError: (error) => error instanceof TestApiError && error.status === 401,
    refresh: async () => {
      refreshCalls += 1
      return { user: { id: "user-1" } }
    },
    withLock: async (_name, callback) => callback(),
  })

  const [first, second] = await Promise.all([
    coordinator.ensureFreshSession(),
    coordinator.ensureFreshSession(),
  ])

  assert.equal(refreshCalls, 1)
  assert.deepEqual(first, { user: { id: "user-1" } })
  assert.deepEqual(second, { user: { id: "user-1" } })
})

test("waiting tab skips refresh when me succeeds after acquiring the lock", async () => {
  let getMeCalls = 0
  let refreshCalls = 0
  const coordinator = createSessionRefreshCoordinator({
    getMe: async () => {
      getMeCalls += 1
      return { user: { id: "user-1" } }
    },
    isUnauthorizedError: (error) => error instanceof TestApiError && error.status === 401,
    refresh: async () => {
      refreshCalls += 1
      return { user: { id: "user-1" } }
    },
    withLock: async (_name, callback) => callback(),
  })

  await assert.doesNotReject(coordinator.ensureFreshSession())
  assert.equal(getMeCalls, 1)
  assert.equal(refreshCalls, 0)
})

test("confirmed refresh 401 is surfaced as a session-expired result", async () => {
  const coordinator = createSessionRefreshCoordinator({
    getMe: async () => {
      throw unauthorized()
    },
    isUnauthorizedError: (error) => error instanceof TestApiError && error.status === 401,
    refresh: async () => {
      throw unauthorized()
    },
    withLock: async (_name, callback) => callback(),
  })

  await assert.rejects(
    coordinator.ensureFreshSession(),
    (error) => error instanceof SessionExpiredError,
  )
})
