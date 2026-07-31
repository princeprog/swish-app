import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function OrganizationCardSkeleton() {
  return (
    <Card size="sm" aria-label="Loading organization">
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <Skeleton className="size-12 rounded-md" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-7 w-20" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-12 w-full" />
        <div className="flex justify-between gap-4">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-9 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}

export function OrganizationDirectoryLoading() {
  return (
    <div
      className="grid gap-4 lg:grid-cols-2"
      aria-busy="true"
      aria-label="Loading organizations"
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <OrganizationCardSkeleton key={index} />
      ))}
    </div>
  );
}
