import type * as React from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { PageEntrance } from "@/components/motion/page-motion";
import { WorkspaceHeader } from "@/components/organizations/shared/workspace-header";
import type { Organization } from "@/services/organization.service";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export function DivisionComplianceWorkspaceShell({
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
