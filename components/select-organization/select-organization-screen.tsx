"use client";

import * as React from "react";
import { Building2Icon, SearchIcon } from "lucide-react";

import { getApiErrorMessage } from "@/hooks/use-auth";
import { useOrganizationsQuery } from "@/hooks/use-organization";
import {
  filterAndSortOrganizations,
  type OrganizationRoleFilter,
  type OrganizationSort,
} from "@/lib/organization-directory";
import { OrganizationDirectoryCard } from "@/components/select-organization/organization-directory-card";
import { OrganizationDirectoryLoading } from "@/components/select-organization/organization-directory-loading";
import {
  OrganizationDirectoryOverview,
  OrganizationInvitationCard,
  OrganizationsAppHeader,
} from "@/components/select-organization/organization-directory-overview";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ComponentReveal,
  PageEntrance,
  RevealGroup,
} from "@/components/motion/page-motion";

export function SelectOrganizationScreen() {
  const organizationsQuery = useOrganizationsQuery();
  const organizations = React.useMemo(
    () => organizationsQuery.data ?? [],
    [organizationsQuery.data],
  );
  const [query, setQuery] = React.useState("");
  const [role, setRole] = React.useState<OrganizationRoleFilter>("all");
  const [sort, setSort] = React.useState<OrganizationSort>("recent");

  const visibleOrganizations = React.useMemo(
    () => filterAndSortOrganizations(organizations, { query, role, sort }),
    [organizations, query, role, sort],
  );
  const activeCount = organizations.filter(
    (organization) => organization.status === "active",
  ).length;
  const scorekeeperCount = organizations.filter(
    (organization) => organization.access.role === "scorekeeper",
  ).length;

  return (
    <PageEntrance asChild>
      <main className="min-h-screen bg-background text-foreground">
        <OrganizationsAppHeader />

        <RevealGroup asChild>
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
            <ComponentReveal>
              <OrganizationDirectoryOverview
                activeCount={activeCount}
                organizationCount={organizations.length}
                scorekeeperCount={scorekeeperCount}
              />
            </ComponentReveal>

            <section
              className="flex flex-col gap-4"
              aria-labelledby="your-orgs"
            >
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                  <h2 id="your-orgs" className="text-xl font-semibold">
                    Your organizations
                  </h2>

                  <div className="grid gap-3 sm:grid-cols-[minmax(14rem,1fr)_10rem_12rem]">
                    <InputGroup>
                      <InputGroupAddon>
                        <SearchIcon />
                      </InputGroupAddon>
                      <InputGroupInput
                        aria-label="Search organizations"
                        placeholder="Search organizations..."
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                      />
                    </InputGroup>

                    <Select
                      value={role}
                      onValueChange={(value) =>
                        setRole(value as OrganizationRoleFilter)
                      }
                    >
                      <SelectTrigger
                        className="w-full"
                        aria-label="Filter by role"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="all">All roles</SelectItem>
                          <SelectItem value="owner">Owner</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="team_manager">
                            Team manager
                          </SelectItem>
                          <SelectItem value="scorekeeper">Scorekeeper</SelectItem>
                          <SelectItem value="statistician">Statistician</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>

                    <Select
                      value={sort}
                      onValueChange={(value) =>
                        setSort(value as OrganizationSort)
                      }
                    >
                      <SelectTrigger
                        className="w-full"
                        aria-label="Sort organizations"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="recent">Recently updated</SelectItem>
                          <SelectItem value="name">Organization name</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {organizationsQuery.isLoading ? (
                  <ComponentReveal>
                    <OrganizationDirectoryLoading />
                  </ComponentReveal>
                ) : organizationsQuery.isError ? (
                  <ComponentReveal>
                    <Empty className="border">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <Building2Icon />
                        </EmptyMedia>
                        <EmptyTitle>
                          We couldn&apos;t load your organizations
                        </EmptyTitle>
                        <EmptyDescription>
                          {getApiErrorMessage(organizationsQuery.error)}
                        </EmptyDescription>
                      </EmptyHeader>
                      <EmptyContent>
                        <Button onClick={() => organizationsQuery.refetch()}>
                          Try again
                        </Button>
                      </EmptyContent>
                    </Empty>
                  </ComponentReveal>
                ) : visibleOrganizations.length === 0 ? (
                  <ComponentReveal>
                    <Empty className="border">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <SearchIcon />
                        </EmptyMedia>
                        <EmptyTitle>
                          {organizations.length === 0
                            ? "No organizations yet"
                            : "No organizations found"}
                        </EmptyTitle>
                        <EmptyDescription>
                          {organizations.length === 0
                            ? "Create your first organization to start managing a basketball league."
                            : "Try another search term or role filter."}
                        </EmptyDescription>
                      </EmptyHeader>
                      {organizations.length > 0 ? (
                        <EmptyContent>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setQuery("");
                              setRole("all");
                            }}
                          >
                            Clear filters
                          </Button>
                        </EmptyContent>
                      ) : null}
                    </Empty>
                  </ComponentReveal>
                ) : (
                  <ComponentReveal asChild>
                    <div className="grid gap-4 lg:grid-cols-2">
                      {visibleOrganizations.map((organization) => (
                        <OrganizationDirectoryCard
                          key={organization.id}
                          organization={organization}
                        />
                      ))}
                    </div>
                  </ComponentReveal>
                )}
            </section>

            <ComponentReveal>
              <OrganizationInvitationCard />
            </ComponentReveal>
          </div>
        </RevealGroup>
      </main>
    </PageEntrance>
  );
}
