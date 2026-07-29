import type { Organization } from "@/services/organization.service"

export function canManageOrganizationSchedule(organization: Organization) {
  return organization.access.permissions.includes("schedule.manage")
}
