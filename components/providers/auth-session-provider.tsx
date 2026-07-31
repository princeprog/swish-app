"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { Loader2, RefreshCw } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import {
  AUTHENTICATED_REDIRECT_ROUTE,
  AUTH_ROUTES,
  PROTECTED_ROUTE_PREFIXES,
} from "@/constants/api-config"
import { AUTH_QUERY_KEYS } from "@/hooks/use-auth"
import { SessionExpiredError } from "@/lib/auth-refresh-coordinator"
import { authService } from "@/services/auth.service"

type AuthBootstrapStatus =
  | "checking"
  | "authenticated"
  | "guest"
  | "error"

const SESSION_CHECK_RETRY_DELAYS_MS = [250, 500, 1000]

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.includes(pathname as (typeof AUTH_ROUTES)[number])
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some((routePrefix) =>
    pathname.startsWith(routePrefix),
  )
}

export function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const router = useRouter()
  const [status, setStatus] = React.useState<AuthBootstrapStatus>("checking")
  const [retryNonce, setRetryNonce] = React.useState(0)

  React.useEffect(() => {
    let cancelled = false

    async function bootstrapSession() {
      const onAuthRoute = isAuthRoute(pathname)
      const onProtectedRoute = isProtectedRoute(pathname)

      if (!onAuthRoute && !onProtectedRoute) {
        setStatus("guest")
        return
      }

      setStatus("checking")

      for (let attempt = 0; attempt <= SESSION_CHECK_RETRY_DELAYS_MS.length; attempt += 1) {
        try {
          const me = await queryClient.fetchQuery({
            queryFn: authService.getMe,
            queryKey: AUTH_QUERY_KEYS.me,
            retry: false,
          })

          if (cancelled) {
            return
          }

          queryClient.setQueryData(AUTH_QUERY_KEYS.me, me)
          setStatus("authenticated")

          if (onAuthRoute) {
            router.replace(AUTHENTICATED_REDIRECT_ROUTE)
          }

          return
        } catch (error) {
          if (error instanceof SessionExpiredError) {
            queryClient.removeQueries({ queryKey: AUTH_QUERY_KEYS.me })

            if (cancelled) {
              return
            }

            if (onProtectedRoute && pathname !== "/login") {
              setStatus("guest")
              router.replace("/login?reason=session_expired")
              return
            }

            setStatus("guest")
            return
          }

          if (attempt < SESSION_CHECK_RETRY_DELAYS_MS.length) {
            await wait(SESSION_CHECK_RETRY_DELAYS_MS[attempt])
            continue
          }

          if (cancelled) {
            return
          }

          setStatus("error")
          return
        }
      }
    }

    void bootstrapSession()

    return () => {
      cancelled = true
    }
  }, [pathname, queryClient, retryNonce, router])

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span>Checking your session...</span>
        </div>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="mx-auto max-w-sm space-y-4 px-6 text-center">
          <div className="space-y-2">
            <p className="text-sm font-medium">
              We can&apos;t connect to the server right now.
            </p>
            <p className="text-sm text-muted-foreground">
              Your session has not been changed. Try again once the API is back
              online.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => setRetryNonce((value) => value + 1)}
          >
            <RefreshCw className="size-4" />
            Try again
          </Button>
          <p className="text-sm text-muted-foreground">
            Default API URL: http://localhost:3001
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
