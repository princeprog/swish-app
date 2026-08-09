"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Building2 } from "lucide-react";

import { OrganizationWorkspaceView } from "@/components/organizations/workspace/organization-workspace-view";
import { PageEntrance } from "@/components/motion/page-motion";
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
import { getOrganizationLandingPath } from "@/lib/organization-routing";

type OrganizationWorkspaceScreenProps = {
  slug: string;
};

function WorkspaceLoadingState() {
  return (
    <PageEntrance asChild>
      <main className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-7xl space-y-6">
        <Skeleton className="h-12 w-80 rounded-xl" />
        <Skeleton className="h-40 rounded-2xl" />
        <div className="grid gap-4 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
          <Skeleton className="h-[480px] rounded-2xl" />
          <div className="space-y-6">
            <Skeleton className="h-56 rounded-2xl" />
            <Skeleton className="h-56 rounded-2xl" />
          </div>
        </div>
      </div>
      </main>
    </PageEntrance>
  );
}

function WorkspaceEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <PageEntrance asChild>
      <main className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-3xl">
        <Empty className="border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Building2 className="size-5" />
            </EmptyMedia>
            <EmptyTitle>{title}</EmptyTitle>
            <EmptyDescription>{description}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href="/organizations">Back to organizations</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
      </main>
    </PageEntrance>
  );
}

export function OrganizationWorkspaceScreen({
  slug,
}: OrganizationWorkspaceScreenProps) {
  const router = useRouter();
  const organizationsQuery = useOrganizationsQuery();
  const organization = organizationsQuery.data?.find(
    (item) => item.slug === slug,
  );
  const landingPath = organization
    ? getOrganizationLandingPath(organization)
    : undefined;

  React.useEffect(() => {
    if (landingPath && landingPath !== `/organizations/${slug}`) {
      router.replace(landingPath);
    }
  }, [landingPath, router, slug]);

  if (organizationsQuery.isLoading) {
    return <WorkspaceLoadingState />;
  }

  if (organizationsQuery.isError) {
    return (
      <WorkspaceEmptyState
        title="We couldn't load this organization"
        description={getApiErrorMessage(organizationsQuery.error)}
      />
    );
  }

  if (!organization) {
    return (
      <WorkspaceEmptyState
        title="Organization not found"
        description="This workspace does not exist or you do not have access to it."
      />
    );
  }

  if (landingPath !== `/organizations/${slug}`) {
    return <WorkspaceLoadingState />;
  }

  return <OrganizationWorkspaceView organization={organization} />;
}
