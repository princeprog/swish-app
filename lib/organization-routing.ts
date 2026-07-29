import type {
  Organization,
  OrganizationRole,
} from "@/services/organization.service";

export function getOrganizationLandingPathForRole(
  slug: string,
  role: OrganizationRole,
): string {
  if (role === "scorekeeper") {
    return `/organizations/${slug}/scorekeeper`;
  }

  return `/organizations/${slug}`;
}

export function getOrganizationLandingPath(organization: Organization): string {
  return getOrganizationLandingPathForRole(
    organization.slug,
    organization.access.role,
  );
}
