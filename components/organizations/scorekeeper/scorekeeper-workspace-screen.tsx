"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { ScorekeeperGameList } from "@/components/organizations/scorekeeper/scorekeeper-game-list";
import { ScorekeeperShell } from "@/components/organizations/scorekeeper/scorekeeper-shell";
import {
  getScorekeeperErrorState,
  ScorekeeperFocusedState,
  ScorekeeperLoadingState,
} from "@/components/organizations/scorekeeper/scorekeeper-states";
import { useOrganizationsQuery } from "@/hooks/use-organization";
import { useSchedulesQuery } from "@/hooks/use-schedule";

type ScorekeeperWorkspaceScreenProps = {
  slug: string;
};

export function ScorekeeperWorkspaceScreen({
  slug,
}: ScorekeeperWorkspaceScreenProps) {
  const router = useRouter();
  const organizationsQuery = useOrganizationsQuery();
  const organizations = organizationsQuery.data ?? [];
  const organization = organizations.find((item) => item.slug === slug);
  const isTeamManager = organization?.access.role === "team_manager";
  const schedulesQuery = useSchedulesQuery(
    organization && !isTeamManager ? organization.id : undefined,
  );

  React.useEffect(() => {
    if (isTeamManager) {
      router.replace(`/organizations/${slug}`);
    }
  }, [isTeamManager, router, slug]);

  if (organizationsQuery.isLoading || (organization && isTeamManager)) {
    return <ScorekeeperLoadingState />;
  }

  if (organizationsQuery.isError) {
    const state = getScorekeeperErrorState(organizationsQuery.error);

    return (
      <main className="min-h-screen bg-background p-6 text-foreground">
        <div className="mx-auto max-w-3xl">
          <ScorekeeperFocusedState
            description={state.description}
            icon={state.icon}
            title="We couldn't load this organization"
            onRetry={() => organizationsQuery.refetch()}
          />
        </div>
      </main>
    );
  }

  if (!organization) {
    return (
      <main className="min-h-screen bg-background p-6 text-foreground">
        <div className="mx-auto max-w-3xl">
          <ScorekeeperFocusedState
            description="This workspace does not exist or you do not have access to it."
            icon="not-found"
            title="Organization not found"
            actionHref="/organizations"
            actionLabel="Back to organizations"
          />
        </div>
      </main>
    );
  }

  if (schedulesQuery.isLoading) {
    return <ScorekeeperLoadingState />;
  }

  if (schedulesQuery.isError) {
    const state = getScorekeeperErrorState(schedulesQuery.error);

    return (
      <ScorekeeperShell
        organization={organization}
        organizations={organizations}
      >
        <ScorekeeperFocusedState
          description={state.description}
          icon={state.icon}
          title={state.title}
          onRetry={() => schedulesQuery.refetch()}
        />
      </ScorekeeperShell>
    );
  }

  const games = schedulesQuery.data ?? [];

  return (
    <ScorekeeperShell organization={organization} organizations={organizations}>
      {games.length === 0 ? (
        <ScorekeeperFocusedState
          description="You do not have assigned games in this organization yet."
          title="No assigned games"
        />
      ) : (
        <ScorekeeperGameList games={games} organization={organization} />
      )}
    </ScorekeeperShell>
  );
}
