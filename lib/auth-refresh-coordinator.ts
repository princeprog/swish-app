const AUTH_REFRESH_LOCK_NAME = "swish-auth-refresh"

export class SessionExpiredError extends Error {
  constructor() {
    super("Session expired")
    this.name = "SessionExpiredError"
  }
}

type AuthSession = {
  user: unknown
}

type LockCallback<T> = () => Promise<T>

type CreateSessionRefreshCoordinatorOptions<TSession extends AuthSession> = {
  getMe: () => Promise<TSession>
  isUnauthorizedError: (error: unknown) => boolean
  refresh: () => Promise<TSession>
  withLock?: <T>(name: string, callback: LockCallback<T>) => Promise<T>
}

type SessionRefreshCoordinator<TSession extends AuthSession> = {
  ensureFreshSession: () => Promise<TSession>
}

async function withBrowserAuthLock<T>(
  name: string,
  callback: LockCallback<T>,
): Promise<T> {
  const locks = globalThis.navigator?.locks

  if (!locks) {
    return callback()
  }

  return locks.request(name, { mode: "exclusive" }, callback)
}

export function createSessionRefreshCoordinator<TSession extends AuthSession>({
  getMe,
  isUnauthorizedError,
  refresh,
  withLock = withBrowserAuthLock,
}: CreateSessionRefreshCoordinatorOptions<TSession>): SessionRefreshCoordinator<TSession> {
  let refreshPromise: Promise<TSession> | null = null

  async function refreshInsideLock(): Promise<TSession> {
    return withLock(AUTH_REFRESH_LOCK_NAME, async () => {
      try {
        return await getMe()
      } catch (error) {
        if (!isUnauthorizedError(error)) {
          throw error
        }
      }

      try {
        return await refresh()
      } catch (error) {
        if (isUnauthorizedError(error)) {
          throw new SessionExpiredError()
        }

        throw error
      }
    })
  }

  return {
    ensureFreshSession: () => {
      refreshPromise ??= refreshInsideLock().finally(() => {
        refreshPromise = null
      })

      return refreshPromise
    },
  }
}
