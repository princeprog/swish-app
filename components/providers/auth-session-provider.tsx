"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"

import {
  AUTHENTICATED_REDIRECT_ROUTE,
  AUTH_ROUTES,
  PROTECTED_ROUTE_PREFIXES,
} from "@/constants/api-config"
import {
  AUTH_QUERY_KEYS,
  isUnauthorizedApiError,
} from "@/hooks/use-auth"
import { authService } from "@/services/auth.service"

type AuthBootstrapStatus =
  | "checking"
  | "authenticated"
  | "guest"
  | "error"

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
      } catch (meError) {
        if (!isUnauthorizedApiError(meError)) {
          if (!cancelled) {
            setStatus("error")
          }

          return
        }
      }

      try {
        const refreshedSession = await authService.refresh()

        if (cancelled) {
          return
        }

        queryClient.setQueryData(AUTH_QUERY_KEYS.me, refreshedSession)
        setStatus("authenticated")

        if (onAuthRoute) {
          router.replace(AUTHENTICATED_REDIRECT_ROUTE)
        }

        return
      } catch (refreshError) {
        queryClient.removeQueries({ queryKey: AUTH_QUERY_KEYS.me })

        if (cancelled) {
          return
        }

        if (
          onProtectedRoute &&
          isUnauthorizedApiError(refreshError) &&
          pathname !== "/login"
        ) {
          setStatus("guest")
          router.replace("/login")
          return
        }

        if (!isUnauthorizedApiError(refreshError)) {
          setStatus("error")
          return
        }

        setStatus("guest")
      }
    }

    void bootstrapSession()

    return () => {
      cancelled = true
    }
  }, [pathname, queryClient, router])

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
        <div className="space-y-2 text-center">
          <p className="text-sm font-medium">We couldn&apos;t verify your session.</p>
          <p className="text-sm text-muted-foreground">
            Please refresh the page and try again.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
