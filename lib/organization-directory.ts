import type {
  Organization,
  OrganizationRole,
} from "../services/organization.service";

export type OrganizationRoleFilter = "all" | OrganizationRole;
export type OrganizationSort = "name" | "recent";

export type OrganizationDirectoryFilters = {
  query: string;
  role: OrganizationRoleFilter;
  sort: OrganizationSort;
};

const ROLE_DETAILS: Record<
  OrganizationRole,
  {
    actionLabel: string;
    badgeLabel: string;
    workspaceLabel: string;
  }
> = {
  admin: {
    actionLabel: "Open workspace",
    badgeLabel: "Admin",
    workspaceLabel: "League operations",
  },
  owner: {
    actionLabel: "Open workspace",
    badgeLabel: "Owner",
    workspaceLabel: "Staff and league administration",
  },
  scorekeeper: {
    actionLabel: "Open scorekeeper",
    badgeLabel: "Scorekeeper",
    workspaceLabel: "Assigned game scoring",
  },
  team_manager: {
    actionLabel: "Open team workspace",
    badgeLabel: "Team manager",
    workspaceLabel: "Assigned team and roster management",
  },
};

export function getOrganizationRoleDetails(role: OrganizationRole) {
  return ROLE_DETAILS[role];
}

export function filterAndSortOrganizations(
  organizations: Organization[],
  filters: OrganizationDirectoryFilters,
): Organization[] {
  const normalizedQuery = filters.query.trim().toLocaleLowerCase();

  return organizations
    .filter((organization) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        organization.name.toLocaleLowerCase().includes(normalizedQuery) ||
        organization.slug.toLocaleLowerCase().includes(normalizedQuery);
      const matchesRole =
        filters.role === "all" || organization.access.role === filters.role;

      return matchesQuery && matchesRole;
    })
    .toSorted((left, right) => {
      if (filters.sort === "name") {
        return left.name.localeCompare(right.name);
      }

      return (
        new Date(right.updated_at).getTime() -
        new Date(left.updated_at).getTime()
      );
    });
}
