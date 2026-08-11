"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FileCheck2 } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import {
  ComponentReveal,
  PageEntrance,
  RevealGroup,
} from "@/components/motion/page-motion";
import { DivisionComplianceBuilder } from "@/components/organizations/compliance/division-compliance-builder";
import { DivisionComplianceReviewQueue } from "@/components/organizations/compliance/division-compliance-review-queue";
import { WorkspaceHeader } from "@/components/organizations/shared/workspace-header";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { getApiErrorMessage } from "@/hooks/use-auth";
import { useDivisionComplianceQuery } from "@/hooks/use-compliance";
import { useDivisionsQuery } from "@/hooks/use-division";
import { useOrganizationsQuery } from "@/hooks/use-organization";
import type { Organization } from "@/services/organization.service";

type RequirementsView = "review" | "settings";

function TabPanelReveal({
  animate,
  children,
}: {
  animate: boolean;
  children: React.ReactNode;
}) {
  return animate ? (
    <ComponentReveal variant="subtle">{children}</ComponentReveal>
  ) : (
    children
  );
}

export function DivisionComplianceScreen({
  divisionId,
  slug,
}: {
  divisionId: string;
  slug: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const view: RequirementsView =
    searchParams.get("view") === "settings" ? "settings" : "review";
  const visitedViews = React.useRef(
    new Set<RequirementsView>([view]),
  );
  const previousView = React.useRef(view);
  const [revealingView, setRevealingView] =
    React.useState<RequirementsView | null>(null);

  React.useEffect(() => {
    if (previousView.current === view) return;

    previousView.current = view;

    if (visitedViews.current.has(view)) {
      setRevealingView(null);
      return;
    }

    visitedViews.current.add(view);
    setRevealingView(view);
  }, [view]);

  const organizationsQuery = useOrganizationsQuery();
  const organization = organizationsQuery.data?.find(
    (item) => item.slug === slug,
  );
  const complianceQuery = useDivisionComplianceQuery(
    organization?.id,
    divisionId,
  );
  const divisionsQuery = useDivisionsQuery(organization?.id, { pageSize: 50 });
  const division = divisionsQuery.data?.data.find(
    (item) => item.id === divisionId,
  );

  if (
    organizationsQuery.isLoading ||
    (organization && complianceQuery.isLoading)
  )
    return (
      <ScreenShell organization={organization} title="Requirements">
        <Skeleton className="h-64 rounded-lg" />
      </ScreenShell>
    );
  if (organizationsQuery.isError || complianceQuery.isError || !organization) {
    return (
      <ScreenShell organization={organization} title="Requirements">
        <Empty className="border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileCheck2 className="size-5" />
            </EmptyMedia>
            <EmptyTitle>
              {!organization
                ? "Organization not found"
                : "We couldn&apos;t load requirements"}
            </EmptyTitle>
            <EmptyDescription>
              {!organization
                ? "This workspace does not exist or you do not have access to it."
                : getApiErrorMessage(
                    organizationsQuery.error ?? complianceQuery.error,
                  )}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href={`/organizations/${slug}/divisions`}>
                Back to divisions
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      </ScreenShell>
    );
  }

  const data = complianceQuery.data!;
  function changeView(nextView: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextView === "settings") {
      params.set("view", "settings");
    } else {
      params.delete("view");
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <ScreenShell
      organization={organization}
      title={`${division?.name ?? "Division"} requirements`}
    >
      <RevealGroup className="contents">
        <ComponentReveal asChild>
          <div>
            <p className="mb-5 text-sm text-muted-foreground">
              Set the checklist team managers must complete before their games
              can start.
            </p>
            <Tabs value={view} onValueChange={changeView}>
              <TabsList aria-label="Requirements workspace sections">
                <TabsTrigger value="review">Review submissions</TabsTrigger>
                <TabsTrigger value="settings">Checklist settings</TabsTrigger>
              </TabsList>
              <TabsContent className="mt-5" value="review">
                <TabPanelReveal animate={revealingView === "review"}>
                  <DivisionComplianceReviewQueue
                    divisionId={divisionId}
                    organizationId={organization.id}
                  />
                </TabPanelReveal>
              </TabsContent>
              <TabsContent className="mt-5" value="settings">
                <TabPanelReveal animate={revealingView === "settings"}>
                  <DivisionComplianceBuilder
                    data={data}
                    divisionId={divisionId}
                    organizationId={organization.id}
                  />
                </TabPanelReveal>
              </TabsContent>
            </Tabs>
          </div>
        </ComponentReveal>
      </RevealGroup>
    </ScreenShell>
  );
}

function ScreenShell({
  children,
  organization,
  title,
}: {
  children: React.ReactNode;
  organization?: Organization;
  title: string;
}) {
  return (
    <SidebarProvider>
      <AppSidebar
        organization={
          organization
            ? {
                access: organization.access,
                name: organization.name,
                slug: organization.slug,
                status: organization.status,
              }
            : undefined
        }
      />
      <SidebarInset>
        <WorkspaceHeader
          organizationAccess={organization?.access}
          organizationName={organization?.name ?? "Swish"}
          organizationSlug={organization?.slug ?? ""}
          pageTitle={title}
          primaryAction={null}
        />
        <PageEntrance asChild>
          <main className="flex flex-1 flex-col gap-5 bg-background px-4 py-4 lg:px-6 lg:py-5">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </PageEntrance>
      </SidebarInset>
    </SidebarProvider>
  );
}
