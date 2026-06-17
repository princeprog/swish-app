import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import {
  AUTH_COOKIE_NAMES,
  AUTHENTICATED_REDIRECT_ROUTE,
  AUTH_ROUTES,
  PROTECTED_ROUTE_PREFIXES,
} from "@/constants/api-config"

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.includes(pathname as (typeof AUTH_ROUTES)[number])
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some((routePrefix) =>
    pathname.startsWith(routePrefix),
  )
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasAccessToken = request.cookies.has(AUTH_COOKIE_NAMES.access)
  const hasRefreshToken = request.cookies.has(AUTH_COOKIE_NAMES.refresh)
  const hasAuthCookie = hasAccessToken || hasRefreshToken

  if (isAuthRoute(pathname) && hasAuthCookie) {
    return NextResponse.redirect(
      new URL(AUTHENTICATED_REDIRECT_ROUTE, request.url),
    )
  }

  if (isProtectedRoute(pathname) && !hasAuthCookie) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/login", "/signup", "/organizations/:path*"],
}
