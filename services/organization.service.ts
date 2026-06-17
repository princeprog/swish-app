import { API_ENDPOINTS } from "@/constants/api-config"
import { apiService } from "@/services/api.service"

export type Organization = {
  created_at: string
  id: string
  name: string
  slug: string
  status: string
  updated_at: string
}

export type CreateOrganizationPayload = {
  name: string
  slug: string
}

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
}
