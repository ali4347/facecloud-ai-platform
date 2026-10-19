import { apiFetch } from './client'
import type { Organization } from './organizations'

/** Every organization, as the administrator sees them (the backend's admin-only list). Personal workspaces are included. */
export async function listAdminOrganizations(signal?: AbortSignal): Promise<Organization[]> {
  const data = await apiFetch<Organization[] | { results: Organization[] }>('/api/organizations/admin/', { signal })
  return Array.isArray(data) ? data : data.results ?? []
}

export type OrganizationPlan = 'free' | 'team' | 'enterprise'

/**
 * Create an organization with an existing account as its owner. Errors come back as field messages (name, plan, owner_id)
 * or a `detail`; ApiError carries them.
 */
export function createAdminOrganization(body: { name: string; owner_id: number; plan: OrganizationPlan }): Promise<Organization> {
  return apiFetch<Organization>('/api/organizations/admin/', { method: 'POST', body })
}
