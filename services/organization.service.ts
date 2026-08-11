import { API_ENDPOINTS } from "@/constants/api-config";
import { apiService } from "@/services/api.service";

export type Organization = {
  access: OrganizationAccess;
  created_at: string;
  id: string;
  name: string;
  slug: string;
  status: string;
  updated_at: string;
};

export type OrganizationRole =
  | "owner"
  | "admin"
  | "team_manager"
  | "scorekeeper";

export type OrganizationPermission =
  | "divisions.manage"
  | "compliance_requirements_manage"
  | "compliance_submissions_read_assigned"
  | "compliance_submissions_review"
  | "compliance_submissions_submit_assigned"
  | "game.score.assigned"
  | "game.score.override"
  | "games.read.assigned"
  | "members.manage"
  | "organization.manage"
  | "organization.read"
  | "organization.transfer"
  | "players.manage"
  | "players.manage.assigned_team"
  | "players.read.assigned_team"
  | "roster_settings.manage"
  | "rosters.publish"
  | "rosters.read.assigned_division"
  | "rosters.review"
  | "rosters.submit.assigned_team"
  | "schedule.manage"
  | "standings.read"
  | "standings.read.assigned_division"
  | "teams.create"
  | "teams.delete"
  | "teams.read"
  | "teams.read.assigned"
  | "teams.update"
  | "teams.update.assigned"
  | "venues.manage";

export type OrganizationAccess = {
  membershipId: string;
  permissions: OrganizationPermission[];
  role: OrganizationRole;
};

export type CreateOrganizationPayload = {
  name: string;
  slug: string;
};

export const organizationService = {
  create: (data: CreateOrganizationPayload) =>
    apiService.post<Organization, CreateOrganizationPayload>(
      API_ENDPOINTS.organizations.create,
      data,
      {
        credentials: "include",
      },
    ),
  list: () =>
    apiService.get<Organization[]>(API_ENDPOINTS.organizations.list, {
      credentials: "include",
    }),
};
