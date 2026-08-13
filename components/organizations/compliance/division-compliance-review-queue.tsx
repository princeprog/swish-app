"use client";

import * as React from "react";
import { FileCheck2, Search } from "lucide-react";

import { DivisionComplianceReviewDetail } from "@/components/organizations/compliance/division-compliance-review-detail";
import { ComplianceStatusBadge } from "@/components/organizations/compliance/compliance-status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getApiErrorMessage } from "@/hooks/use-auth";
import {
  useComplianceReviewQueueQuery,
  useDivisionComplianceOverviewQuery,
} from "@/hooks/use-compliance";
import { useTablePaginationState } from "@/hooks/use-table-pagination-state";
import {
  reviewInboxFiltersWithScope,
  reviewInboxTabFromParam,
  type ComplianceReviewQueueScope,
  type ReviewInboxFilters,
} from "@/lib/compliance-review-inbox";
import type { ComplianceReviewRow } from "@/services/compliance.service";
import {
  DEFAULT_PAGE,
  PAGE_SIZE_OPTIONS,
  type PageSizeOption,
} from "@/services/pagination";

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delayMs);
    return () => window.clearTimeout(timeoutId);
  }, [delayMs, value]);

  return debouncedValue;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function pageNumbers(currentPage: number, totalPages: number) {
  const start = Math.max(1, Math.min(currentPage - 1, totalPages - 2));
  return Array.from({ length: Math.min(3, totalPages) }, (_, index) => start + index);
}

const scopeTabs: Array<{
  label: string;
  value: ComplianceReviewQueueScope;
}> = [
  { label: "Needs review", value: "needs_review" },
  { label: "All submissions", value: "all" },
  { label: "Completed", value: "completed" },
];

export function DivisionComplianceReviewQueue({
  divisionId,
  organizationId,
}: {
  divisionId: string;
  organizationId: string;
}) {
  const tablePagination = useTablePaginationState();
  const scope = reviewInboxTabFromParam(tablePagination.searchParams.get("scope"));
  const urlSearch = tablePagination.searchParams.get("search") ?? "";
  const [search, setSearch] = React.useState(urlSearch);
  const debouncedSearch = useDebouncedValue(search, 350);

  React.useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);

  React.useEffect(() => {
    const currentSearch = tablePagination.searchParams.get("search") ?? "";
    if (currentSearch !== debouncedSearch) {
      tablePagination.setParams({
        page: null,
        search: debouncedSearch || null,
      });
    }
  }, [debouncedSearch, tablePagination]);

  const filters = React.useMemo<ReviewInboxFilters>(
    () => ({
      page: tablePagination.page,
      pageSize: tablePagination.pageSize,
      scope,
      search: debouncedSearch,
    }),
    [debouncedSearch, scope, tablePagination.page, tablePagination.pageSize],
  );
  const overviewQuery = useDivisionComplianceOverviewQuery(
    organizationId,
    divisionId,
  );
  const queueQuery = useComplianceReviewQueueQuery(
    organizationId,
    divisionId,
    filters,
  );
  const [selectedRow, setSelectedRow] = React.useState<ComplianceReviewRow | null>(
    null,
  );

  function changeScope(nextScope: ComplianceReviewQueueScope) {
    const nextFilters = reviewInboxFiltersWithScope(filters, nextScope);
    tablePagination.setParams({
      page: null,
      scope: nextFilters.scope === "needs_review" ? null : nextFilters.scope,
    });
  }

  function openRow(row: ComplianceReviewRow) {
    setSelectedRow(row);
  }

  if (overviewQuery.isLoading || queueQuery.isLoading) {
    return (
      <div className="grid gap-5">
        <div className="grid gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton aria-label="Loading review summary" className="h-24 rounded-lg" key={index} />
          ))}
        </div>
        <Skeleton aria-label="Loading review queue" className="h-96 rounded-lg" />
      </div>
    );
  }

  if (overviewQuery.isError || queueQuery.isError) {
    const error = overviewQuery.error ?? queueQuery.error;
    return (
      <Alert variant="destructive">
        <FileCheck2 />
        <AlertTitle>We couldn&apos;t load the review queue</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
          <span>{getApiErrorMessage(error)}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              void overviewQuery.refetch();
              void queueQuery.refetch();
            }}
          >
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const counts = overviewQuery.data?.counts;
  const rows = queueQuery.data?.data ?? [];
  const pagination = queueQuery.data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryItem
          description="Submitted or under review"
          label="Needs review"
          value={counts?.needs_review ?? 0}
          onClick={() => changeScope("needs_review")}
        />
        <SummaryItem
          description="Teams with at least one blocked item"
          label="Blocked teams"
          value={counts?.blocked ?? 0}
          onClick={() => changeScope("needs_review")}
        />
        <SummaryItem
          description="Teams that meet all required items"
          label="Cleared teams"
          value={counts?.cleared ?? 0}
          onClick={() => changeScope("completed")}
        />
        <SummaryItem
          description="Checklist is not published"
          label="Not required"
          value={counts?.not_required ?? 0}
          onClick={() => changeScope("all")}
        />
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-1">
            <CardTitle>Review submissions</CardTitle>
            <CardDescription>
              Search team submissions, open a full review record, and make an
              official decision.
            </CardDescription>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Tabs value={scope} onValueChange={(value) => changeScope(value as ComplianceReviewQueueScope)}>
              <TabsList aria-label="Review queue scope">
                {scopeTabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="relative w-full lg:max-w-sm">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search submissions"
                className="pl-9"
                placeholder="Search teams or requirements"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!rows.length ? (
            <Empty className="border-0 py-16">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileCheck2 />
                </EmptyMedia>
                <EmptyTitle>
                  {debouncedSearch
                    ? "No submissions match your search"
                    : scope === "completed"
                      ? "No completed submissions yet"
                      : "Nothing needs review"}
                </EmptyTitle>
                <EmptyDescription>
                  {debouncedSearch
                    ? "Try a different team name or requirement title."
                    : "Submitted requirements will appear here when team managers send them for review."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team</TableHead>
                      <TableHead>Requirement</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <QueueTableRow key={row.submission_id} row={row} onOpen={openRow} />
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ItemGroup className="gap-2 p-3 md:hidden">
                {rows.map((row) => (
                  <QueueItem key={row.submission_id} row={row} onOpen={openRow} />
                ))}
              </ItemGroup>
            </>
          )}
        </CardContent>
        {rows.length ? (
          <div className="flex flex-col gap-4 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Rows per page</span>
              <Select
                value={String(tablePagination.pageSize)}
                onValueChange={(value) =>
                  tablePagination.setPageSize(Number(value) as PageSizeOption)
                }
              >
                <SelectTrigger className="w-20" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {PAGE_SIZE_OPTIONS.map((pageSize) => (
                      <SelectItem key={pageSize} value={String(pageSize)}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            {totalPages > 1 ? (
              <Pagination className="mx-0 w-auto justify-start sm:justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      aria-disabled={tablePagination.page <= DEFAULT_PAGE}
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        if (tablePagination.page > DEFAULT_PAGE) {
                          tablePagination.setPage(tablePagination.page - 1);
                        }
                      }}
                    />
                  </PaginationItem>
                  {pageNumbers(tablePagination.page, totalPages).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        aria-label={`Go to page ${page}`}
                        href="#"
                        isActive={page === tablePagination.page}
                        onClick={(event) => {
                          event.preventDefault();
                          tablePagination.setPage(page);
                        }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      aria-disabled={tablePagination.page >= totalPages}
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        if (tablePagination.page < totalPages) {
                          tablePagination.setPage(tablePagination.page + 1);
                        }
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            ) : null}
          </div>
        ) : null}
      </Card>

      {selectedRow ? (
        <DivisionComplianceReviewDetail
          open
          onOpenChange={(open) => {
            if (!open) setSelectedRow(null);
          }}
          organizationId={organizationId}
          row={selectedRow}
        />
      ) : null}
    </div>
  );
}

function SummaryItem({
  description,
  label,
  value,
  onClick,
}: {
  description: string;
  label: string;
  value: number;
  onClick: () => void;
}) {
  return (
    <button className="text-left" type="button" onClick={onClick}>
      <Card className="h-full transition-colors hover:border-primary/50">
        <CardHeader className="gap-2 pb-3">
          <CardDescription>{label}</CardDescription>
          <CardTitle className="text-2xl">{value}</CardTitle>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardHeader>
      </Card>
    </button>
  );
}

function QueueTableRow({
  row,
  onOpen,
}: {
  row: ComplianceReviewRow;
  onOpen: (row: ComplianceReviewRow) => void;
}) {
  return (
    <TableRow
      className="cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(row)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(row);
        }
      }}
    >
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            <AvatarFallback>{initials(row.team_name)}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{row.team_name}</span>
        </div>
      </TableCell>
      <TableCell>{row.requirement_title}</TableCell>
      <TableCell className="text-muted-foreground">
        {row.submitted_at ? new Date(row.submitted_at).toLocaleDateString() : "Draft"}
      </TableCell>
      <TableCell>
        <ComplianceStatusBadge status={row.workflow_status} />
      </TableCell>
      <TableCell className="text-right">
        <Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); onOpen(row); }}>
          Open review
        </Button>
      </TableCell>
    </TableRow>
  );
}

function QueueItem({
  row,
  onOpen,
}: {
  row: ComplianceReviewRow;
  onOpen: (row: ComplianceReviewRow) => void;
}) {
  return (
    <Item
      asChild
      className="cursor-pointer"
      variant="outline"
      onClick={() => onOpen(row)}
    >
      <button type="button">
        <ItemMedia>
          <Avatar size="sm">
            <AvatarFallback>{initials(row.team_name)}</AvatarFallback>
          </Avatar>
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{row.team_name}</ItemTitle>
          <ItemDescription>
            {row.requirement_title} · {row.submitted_at ? new Date(row.submitted_at).toLocaleDateString() : "Draft"}
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <ComplianceStatusBadge status={row.workflow_status} />
        </ItemActions>
      </button>
    </Item>
  );
}
