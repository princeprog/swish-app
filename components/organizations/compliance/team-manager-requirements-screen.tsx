"use client";

import Link from "next/link";
import { FileCheck2 } from "lucide-react";

import { TeamManagerWorkspace } from "@/components/organizations/team-manager/manager-workspace";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/hooks/use-auth";
import { useOrganizationsQuery } from "@/hooks/use-organization";

export function TeamManagerRequirementsScreen({ slug }: { slug: string }) {
  const organizationsQuery = useOrganizationsQuery();
  const organization = organizationsQuery.data?.find(
    (item) => item.slug === slug,
  );
  if (organizationsQuery.isLoading)
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="mx-auto h-96 max-w-6xl rounded-lg" />
      </div>
    );
  if (organizationsQuery.isError || !organization)
    return (
      <main className="min-h-screen bg-background p-6">
        <Empty className="mx-auto max-w-2xl border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileCheck2 className="size-5" />
            </EmptyMedia>
            <EmptyTitle>
              {organization
                ? "We couldn&apos;t load your team workspace"
                : "Organization not found"}
            </EmptyTitle>
            <EmptyDescription>
              {organization
                ? getApiErrorMessage(organizationsQuery.error)
                : "This workspace does not exist or you do not have access to it."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href="/organizations">Back to organizations</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </main>
    );
  return (
    <TeamManagerWorkspace organization={organization} page="requirements" />
  );
}
