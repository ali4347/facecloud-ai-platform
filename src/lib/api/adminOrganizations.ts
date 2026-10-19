import { apiFetch } from './client'
import type { ModeratorDataScope, Organization, PlanLimits, PlanUsage } from './organizations'

/** An organization as the administrator sees it: with its owner, its head count and what its plan allows. */
export interface AdminOrganization extends Organization {
  owner?: { id: number; username: string } | null
  member_count?: number
  moderator_count?: number
  limits?: PlanLimits
  usage?: PlanUsage
}

/** Every organization, as the administrator sees them (the backend's admin-only list). Personal workspaces are included. */
export async function listAdminOrganizations(signal?: AbortSignal): Promise<AdminOrganization[]> {
  const data = await apiFetch<AdminOrganization[] | { results: AdminOrganization[] }>('/api/organizations/admin/', { signal })
  return Array.isArray(data) ? data : data.results ?? []
}

export type OrganizationPlan = 'free' | 'team' | 'enterprise'

/**
 * Create an organization with an existing account as its owner. Errors come back as field messages (name, plan, owner_id)
 * or a `detail`; ApiError carries them.
 */
export function createAdminOrganization(body: { name: string; owner_id: number; plan: OrganizationPlan }): Promise<AdminOrganization> {
  return apiFetch<AdminOrganization>('/api/organizations/admin/', { method: 'POST', body })
}

/**
 * Rename, change the plan, change who sees what, or suspend and reactivate (`status`). `reason` goes to the audit trail only.
 * A suspended organization is not deleted: its people get a plain refusal until it is reactivated. A personal workspace cannot be suspended.
 */
export function updateAdminOrganization(
  id: number,
  patch: { name?: string; plan?: OrganizationPlan; status?: 'active' | 'suspended'; moderator_data_scope?: ModeratorDataScope; reason?: string },
): Promise<AdminOrganization> {
  return apiFetch<AdminOrganization>(`/api/organizations/admin/${id}/`, { method: 'PATCH', body: patch })
}
