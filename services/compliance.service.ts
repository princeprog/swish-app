import { API_ENDPOINTS } from "@/constants/api-config"
import { apiService } from "@/services/api.service"
import type { PaginatedResponse, PaginationParams } from "@/services/pagination"

export type ComplianceResponseType =
  | "file"
  | "short_text"
  | "long_text"
  | "url"
  | "acknowledgement"

export type ComplianceSettingsStatus = "draft" | "published" | "archived"
export type ComplianceWorkflowStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "waived"
  | "reopened"

export type ComplianceReviewQueueScope =
  | "needs_review"
  | "all"
  | "completed"

export type ComplianceRequirement = {
  archived_at: string | null
  created_at: string
  division_settings_id: string
  id: string
  instructions: string | null
  is_required: boolean
  max_file_count: number
  response_type: ComplianceResponseType
  sort_order: number
  title: string
  updated_at: string
}

export type ComplianceSettings = {
  archived_at: string | null
  created_at: string
  created_by_member_id: string
  division_id: string
  id: string
  instructions: string | null
  published_at: string | null
  status: ComplianceSettingsStatus
  submission_deadline_at: string | null
  updated_at: string
}

export type DivisionComplianceResponse = {
  requirements: ComplianceRequirement[]
  settings: ComplianceSettings | null
}

export type ComplianceFileReference = {
  id: string
  name?: string
  original_filename?: string
  status?: string
  verification_status?: string
}

export type TeamComplianceRequirement = ComplianceRequirement & {
  current_attempt_id: string | null
  files?: ComplianceFileReference[]
  requirement_id: string
  review_note: string | null
  response?: unknown
  submission_id: string | null
  waiver_expires_at: string | null
  workflow_status: ComplianceWorkflowStatus | null
}

export type TeamComplianceResponse = {
  clearance: {
    blocking_requirement_count?: number
    pending_requirement_count?: number
    status: "not_required" | "pending" | "blocked" | "cleared"
  } | null
  requirements: TeamComplianceRequirement[]
  settings: ComplianceSettings | null
  team: {
    division_id: string
    team_id: string
    team_name: string
  }
}

export type ComplianceOverviewResponse = {
  counts: {
    blocked: number
    cleared: number
    needs_review: number
    not_required: number
    pending: number
  }
  settings: ComplianceSettings | null
}

export type ComplianceReviewRow = {
  is_required: boolean
  requirement_id: string
  requirement_title: string
  reviewed_at: string | null
  submission_id: string
  submitted_at: string | null
  team_id: string
  team_name: string
  workflow_status: ComplianceWorkflowStatus
}

export type ComplianceReviewSubmission = {
  current_attempt_id: string | null
  division_id: string
  id: string
  is_required: boolean
  requirement_id: string
  requirement_title: string
  response_type: ComplianceResponseType
  review_note: string | null
  reviewed_at: string | null
  submitted_at: string | null
  team_id: string
  team_name: string
  waiver_expires_at: string | null
  waiver_reason: string | null
  workflow_status: ComplianceWorkflowStatus
}

export type ComplianceHistoryAttempt = {
  attempt_number: number
  id: string
  response_type: ComplianceResponseType
  response_value: unknown
  submission_id: string
  submitted_at: string
  submitted_by_member_id: string
}

export type ComplianceHistoryEvent = {
  actor_member_id: string | null
  created_at: string
  event_type: string
  id: string
  metadata: Record<string, unknown>
  submission_attempt_id: string | null
  submission_id: string
}

export type ComplianceHistoryResponse = {
  attempts: ComplianceHistoryAttempt[]
  events: ComplianceHistoryEvent[]
}

export type ComplianceReviewDetailResponse = {
  attempts: ComplianceHistoryAttempt[]
  current_attempt: ComplianceHistoryAttempt | null
  events: ComplianceHistoryEvent[]
  files: ComplianceFileReference[]
  submission: ComplianceReviewSubmission
}

export type UpdateComplianceSettingsPayload = {
  instructions?: string | null
  submissionDeadlineAt?: string | null
  status?: "draft" | "archived"
}

export type CreateComplianceRequirementPayload = {
  instructions?: string
  isRequired?: boolean
  maxFileCount?: number
  responseType: ComplianceResponseType
  sortOrder: number
  title: string
}

export type PrepareComplianceUploadPayload = {
  byteSize: number
  fileOrder: number
  mimeType: string
  originalFilename: string
  sha256: string
}

export type PreparedComplianceUpload = {
  expiresAt: string
  fields: Record<string, string>
  fileId: string
  uploadUrl: string
}

export const complianceService = {
  getDivision: (organizationId: string, divisionId: string) =>
    apiService.get<DivisionComplianceResponse>(
      API_ENDPOINTS.compliance.divisionSettings(organizationId, divisionId),
      { credentials: "include" },
    ),
  updateDivisionSettings: (
    organizationId: string,
    divisionId: string,
    payload: UpdateComplianceSettingsPayload,
  ) =>
    apiService.patch<ComplianceSettings, UpdateComplianceSettingsPayload>(
      API_ENDPOINTS.compliance.updateDivisionSettings(organizationId, divisionId),
      payload,
      { credentials: "include" },
    ),
  createRequirement: (
    organizationId: string,
    divisionId: string,
    payload: CreateComplianceRequirementPayload,
  ) =>
    apiService.post<ComplianceRequirement, CreateComplianceRequirementPayload>(
      API_ENDPOINTS.compliance.createRequirement(organizationId, divisionId),
      payload,
      { credentials: "include" },
    ),
  updateRequirement: (
    organizationId: string,
    divisionId: string,
    requirementId: string,
    payload: Partial<CreateComplianceRequirementPayload>,
  ) =>
    apiService.patch<ComplianceRequirement>(
      API_ENDPOINTS.compliance.updateRequirement(
        organizationId,
        divisionId,
        requirementId,
      ),
      payload,
      { credentials: "include" },
    ),
  archiveRequirement: (
    organizationId: string,
    divisionId: string,
    requirementId: string,
  ) =>
    apiService.delete<ComplianceRequirement>(
      API_ENDPOINTS.compliance.archiveRequirement(
        organizationId,
        divisionId,
        requirementId,
      ),
      { credentials: "include" },
    ),
  publish: (organizationId: string, divisionId: string) =>
    apiService.post<ComplianceSettings>(
      API_ENDPOINTS.compliance.publish(organizationId, divisionId),
      undefined,
      { credentials: "include" },
    ),
  getOverview: (organizationId: string, divisionId: string) =>
    apiService.get<ComplianceOverviewResponse>(
      API_ENDPOINTS.compliance.overview(organizationId, divisionId),
      { credentials: "include" },
    ),
  getReviewQueue: (
    organizationId: string,
    divisionId: string,
    params: PaginationParams & {
      scope?: ComplianceReviewQueueScope
      search?: string
      status?: ComplianceWorkflowStatus
    },
  ) =>
    apiService.get<PaginatedResponse<ComplianceReviewRow>>(
      API_ENDPOINTS.compliance.reviewQueue(organizationId, divisionId),
      { credentials: "include", query: params },
    ),
  getReviewDetail: (organizationId: string, submissionId: string) =>
    apiService.get<ComplianceReviewDetailResponse>(
      API_ENDPOINTS.compliance.reviewDetail(organizationId, submissionId),
      { credentials: "include" },
    ),
  getTeam: (organizationId: string, teamId: string) =>
    apiService.get<TeamComplianceResponse>(
      API_ENDPOINTS.compliance.team(organizationId, teamId),
      { credentials: "include" },
    ),
  saveDraft: (
    organizationId: string,
    teamId: string,
    requirementId: string,
    response: unknown,
  ) =>
    apiService.patch(
      API_ENDPOINTS.compliance.saveDraft(
        organizationId,
        teamId,
        requirementId,
      ),
      { response },
      { credentials: "include" },
    ),
  submit: (
    organizationId: string,
    teamId: string,
    requirementId: string,
    response?: unknown,
  ) =>
    apiService.post(
      API_ENDPOINTS.compliance.submit(organizationId, teamId, requirementId),
      response === undefined ? undefined : { response },
      { credentials: "include" },
    ),
  approve: (organizationId: string, teamId: string, requirementId: string) =>
    apiService.post(
      API_ENDPOINTS.compliance.approve(organizationId, teamId, requirementId),
      undefined,
      { credentials: "include" },
    ),
  requestChanges: (
    organizationId: string,
    teamId: string,
    requirementId: string,
    reason: string,
  ) =>
    apiService.post(
      API_ENDPOINTS.compliance.requestChanges(
        organizationId,
        teamId,
        requirementId,
      ),
      { reason },
      { credentials: "include" },
    ),
  waive: (
    organizationId: string,
    teamId: string,
    requirementId: string,
    reason: string,
    expiresAt?: string,
  ) =>
    apiService.post(
      API_ENDPOINTS.compliance.waive(organizationId, teamId, requirementId),
      { reason, expiresAt },
      { credentials: "include" },
    ),
  reopen: (
    organizationId: string,
    teamId: string,
    requirementId: string,
    reason: string,
  ) =>
    apiService.post(
      API_ENDPOINTS.compliance.reopen(organizationId, teamId, requirementId),
      { reason },
      { credentials: "include" },
    ),
  history: (organizationId: string, teamId: string, requirementId: string) =>
    apiService.get<ComplianceHistoryResponse>(
      API_ENDPOINTS.compliance.history(organizationId, teamId, requirementId),
      { credentials: "include" },
    ),
  prepareUpload: (
    organizationId: string,
    teamId: string,
    requirementId: string,
    payload: PrepareComplianceUploadPayload,
  ) =>
    apiService.post<PreparedComplianceUpload, PrepareComplianceUploadPayload>(
      API_ENDPOINTS.compliance.prepareUpload(
        organizationId,
        teamId,
        requirementId,
      ),
      payload,
      { credentials: "include" },
    ),
  completeUpload: (
    organizationId: string,
    teamId: string,
    requirementId: string,
    fileId: string,
  ) =>
    apiService.post(
      API_ENDPOINTS.compliance.completeUpload(
        organizationId,
        teamId,
        requirementId,
        fileId,
      ),
      undefined,
      { credentials: "include" },
    ),
  deleteUpload: (
    organizationId: string,
    teamId: string,
    requirementId: string,
    fileId: string,
  ) =>
    apiService.delete(
      API_ENDPOINTS.compliance.deleteUpload(
        organizationId,
        teamId,
        requirementId,
        fileId,
      ),
      { credentials: "include" },
    ),
  downloadUrl: (organizationId: string, teamId: string, fileId: string) =>
    apiService.post<{ url: string; expiresAt: string }>(
      API_ENDPOINTS.compliance.downloadUrl(organizationId, teamId, fileId),
      undefined,
      { credentials: "include" },
    ),
}

export async function uploadComplianceFile(
  prepared: PreparedComplianceUpload,
  file: File,
  onProgress?: (percent: number) => void,
) {
  await new Promise<void>((resolve, reject) => {
    const form = new FormData()
    for (const [key, value] of Object.entries(prepared.fields)) {
      form.append(key, value)
    }
    form.append("file", file)

    const request = new XMLHttpRequest()
    request.open("POST", prepared.uploadUrl)
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100))
      }
    })
    request.addEventListener("load", () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress?.(100)
        resolve()
      } else {
        reject(new Error("The file could not be uploaded. Try again."))
      }
    })
    request.addEventListener("error", () =>
      reject(new Error("The file could not be uploaded. Try again.")),
    )
    request.addEventListener("abort", () =>
      reject(new Error("The file could not be uploaded. Try again.")),
    )
    request.send(form)
  })
}

export async function sha256File(file: File) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer())
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}
