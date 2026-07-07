"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  type PageSizeOption,
  type PaginationParams,
} from "@/services/pagination"

function parsePage(value: string | null) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : DEFAULT_PAGE
}

function parsePageSize(value: string | null): PageSizeOption {
  const pageSize = Number(value)
  return PAGE_SIZE_OPTIONS.includes(pageSize as PageSizeOption)
    ? (pageSize as PageSizeOption)
    : DEFAULT_PAGE_SIZE
}

export function useTablePaginationState() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const page = parsePage(searchParams.get("page"))
  const pageSize = parsePageSize(searchParams.get("pageSize"))

  const setParams = React.useCallback(
    (updates: Record<string, string | number | null | undefined>) => {
      const nextParams = new URLSearchParams(searchParams.toString())

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === undefined || value === "") {
          nextParams.delete(key)
        } else {
          nextParams.set(key, String(value))
        }
      }

      const query = nextParams.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const setPage = React.useCallback(
    (nextPage: number) => {
      setParams({ page: nextPage === DEFAULT_PAGE ? null : nextPage })
    },
    [setParams],
  )

  const setPageSize = React.useCallback(
    (nextPageSize: PageSizeOption) => {
      setParams({
        page: null,
        pageSize: nextPageSize === DEFAULT_PAGE_SIZE ? null : nextPageSize,
      })
    },
    [setParams],
  )

  const params = React.useMemo<PaginationParams>(
    () => ({ page, pageSize }),
    [page, pageSize],
  )

  return {
    page,
    pageSize,
    params,
    searchParams,
    setPage,
    setPageSize,
    setParams,
  }
}
