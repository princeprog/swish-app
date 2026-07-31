import assert from "node:assert/strict";
import test from "node:test";

import {
  filterAndSortOrganizations,
  getOrganizationRoleDetails,
} from "./organization-directory.ts";

function organization(overrides) {
  return {
    access: {
      membershipId: `membership-${overrides.id}`,
      permissions: ["organization.read"],
      role: "admin",
    },
    created_at: "2026-01-01T00:00:00.000Z",
    status: "active",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const organizations = [
  organization({
    access: {
      membershipId: "membership-scorekeeper",
      permissions: ["organization.read", "games.read.assigned"],
      role: "scorekeeper",
    },
    id: "scorekeeper",
    name: "Westcourt Summer League",
    slug: "westcourt-summer",
    updated_at: "2026-07-30T00:00:00.000Z",
  }),
  organization({
    id: "admin",
    name: "Metro City Hoops",
    slug: "metro-city-hoops",
    updated_at: "2026-07-29T00:00:00.000Z",
  }),
];

test("filters organizations by name, slug, and role", () => {
  assert.deepEqual(
    filterAndSortOrganizations(organizations, {
      query: "westcourt",
      role: "all",
      sort: "recent",
    }).map(({ id }) => id),
    ["scorekeeper"],
  );

  assert.deepEqual(
    filterAndSortOrganizations(organizations, {
      query: "",
      role: "scorekeeper",
      sort: "recent",
    }).map(({ id }) => id),
    ["scorekeeper"],
  );
});

test("sorts organizations by recent update or name", () => {
  assert.deepEqual(
    filterAndSortOrganizations(organizations, {
      query: "",
      role: "all",
      sort: "recent",
    }).map(({ id }) => id),
    ["scorekeeper", "admin"],
  );

  assert.deepEqual(
    filterAndSortOrganizations(organizations, {
      query: "",
      role: "all",
      sort: "name",
    }).map(({ id }) => id),
    ["admin", "scorekeeper"],
  );
});

test("describes role-specific workspaces and actions", () => {
  assert.deepEqual(getOrganizationRoleDetails("scorekeeper"), {
    actionLabel: "Open scorekeeper",
    badgeLabel: "Scorekeeper",
    workspaceLabel: "Assigned game scoring",
  });

  assert.equal(
    getOrganizationRoleDetails("team_manager").actionLabel,
    "Open team workspace",
  );
});
