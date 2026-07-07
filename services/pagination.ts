export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const
export const DEFAULT_PAGE = 1
export const DEFAULT_PAGE_SIZE = 10

export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number]

export type PaginationParams = {
  page?: number
  pageSize?: PageSizeOption
}

export type PaginationMeta = {
  hasNextPage: boolean
  hasPreviousPage: boolean
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export type PaginatedResponse<T> = {
  data: T[]
  pagination: PaginationMeta
}

export function getDefaultPaginationMeta(): PaginationMeta {
  return {
    hasNextPage: false,
    hasPreviousPage: false,
    page: DEFAULT_PAGE,
    pageSize: DEFAULT_PAGE_SIZE,
    totalItems: 0,
    totalPages: 1,
  }
}
