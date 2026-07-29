"use client"

import { AppSidebar } from "@/components/app-sidebar"
import {
  workspaceMetrics,
} from "@/components/organizations/workspace/organization-workspace-data"
import { WorkspaceHeader } from "@/components/organizations/shared/workspace-header"
import { WorkspaceHeroCard } from "@/components/organizations/workspace/workspace-hero-card"
import { WorkspaceMainPanels } from "@/components/organizations/workspace/workspace-main-panels"
import { WorkspaceMetricsGrid } from "@/components/organizations/workspace/workspace-metrics-grid"
import { WorkspaceSidePanels } from "@/components/organizations/workspace/workspace-side-panels"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import type { Organization } from "@/services/organization.service"

type OrganizationWorkspaceViewProps = {
  organization: Organization
}

export function OrganizationWorkspaceView({
  organization,
}: OrganizationWorkspaceViewProps) {
  return (
    <SidebarProvider>
      <AppSidebar
        organization={{
          access: organization.access,
          name: organization.name,
          slug: organization.slug,
          status: organization.status,
        }}
      />
      <SidebarInset>
        <WorkspaceHeader
          
          organizationAccess={organization.access}
          organizationName={organization.name}
          organizationSlug={organization.slug}
          pageTitle="Dashboard"
          primaryAction={{
            href: `/organizations/${organization.slug}/seasons`,
            label: "New season",
          }}
        />

        <main className="flex flex-1 flex-col gap-4 bg-background px-4 py-4 lg:px-6 lg:py-5">
          <WorkspaceHeroCard organization={organization} />
          <WorkspaceMetricsGrid metrics={workspaceMetrics} />

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.85fr)]">
            <WorkspaceMainPanels />
            <WorkspaceSidePanels />
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
