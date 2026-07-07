"use client"

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
import {
  PAGE_SIZE_OPTIONS,
  type PageSizeOption,
  type PaginationMeta,
} from "@/services/pagination"

type DataTablePaginationProps = {
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: PageSizeOption) => void
  pagination: PaginationMeta
}

function getVisiblePages(currentPage: number, totalPages: number) {
  const pages = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1])
  return Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right)
}

export function DataTablePagination({
  onPageChange,
  onPageSizeChange,
  pagination,
}: DataTablePaginationProps) {
  const visiblePages = getVisiblePages(pagination.page, pagination.totalPages)

  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span>Show</span>
        <NativeSelect
          aria-label="Rows per page"
          size="sm"
          value={String(pagination.pageSize)}
          onChange={(event) =>
            onPageSizeChange(Number(event.target.value) as PageSizeOption)
          }
        >
          {PAGE_SIZE_OPTIONS.map((pageSize) => (
            <NativeSelectOption key={pageSize} value={pageSize}>
              {pageSize}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <span>of {pagination.totalItems}</span>
      </div>

      <Pagination className="mx-0 w-auto justify-start sm:justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              aria-disabled={!pagination.hasPreviousPage}
              className={!pagination.hasPreviousPage ? "pointer-events-none opacity-50" : ""}
              href="#"
              onClick={(event) => {
                event.preventDefault()
                if (pagination.hasPreviousPage) {
                  onPageChange(pagination.page - 1)
                }
              }}
            />
          </PaginationItem>
          {visiblePages.map((page, index) => {
            const previousPage = visiblePages[index - 1]
            const showGap = previousPage !== undefined && page - previousPage > 1

            return (
              <PaginationItem key={page}>
                {showGap ? <span className="px-2">...</span> : null}
                <PaginationLink
                  href="#"
                  isActive={page === pagination.page}
                  onClick={(event) => {
                    event.preventDefault()
                    onPageChange(page)
                  }}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            )
          })}
          <PaginationItem>
            <PaginationNext
              aria-disabled={!pagination.hasNextPage}
              className={!pagination.hasNextPage ? "pointer-events-none opacity-50" : ""}
              href="#"
              onClick={(event) => {
                event.preventDefault()
                if (pagination.hasNextPage) {
                  onPageChange(pagination.page + 1)
                }
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
