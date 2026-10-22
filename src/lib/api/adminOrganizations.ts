import { apiFetch, changesSoFar } from './client'
import { getSession } from '../session'
import type { ModeratorDataScope, Organization, PlanLimits, PlanUsage } from './organizations'

/** An organization as the administrator sees it: with its owner, its head count and what its plan allows. */
export interface AdminOrganization extends Organization {
  owner?: { id: number; username: string } | null
  member_count?: number
  moderator_count?: number
  limits?: PlanLimits
  usage?: PlanUsage
}

/*
 * Four admin screens (Organizations, Moderators, Invitations, Users) read this list when they open, and the server allows
 * only 30 reads of it an hour (it shares the invitation limit), so a rehearsal clicking between those screens ran into
 * "too many requests". The list is kept for a minute, for the same person, and dropped as soon as anything is changed
 * (a team, a moderator, an invitation or an account), so a screen never shows seats or counts that the person has just changed.
 */
const KEEP_MS = 60_000
let kept: { who: string; at: number; changes: number; rows: AdminOrganization[] } | null = null

/** Every organization, as the administrator sees them (the backend's admin-only list). Personal workspaces are included. */
export async function listAdminOrganizations(signal?: AbortSignal): Promise<AdminOrganization[]> {
  const who = getSession()?.email ?? ''
  if (kept && kept.who === who && kept.changes === changesSoFar() && Date.now() - kept.at < KEEP_MS) return kept.rows
  const changesBefore = changesSoFar() // counted before asking, so a change made while waiting still makes this answer stale
  const data = await apiFetch<AdminOrganization[] | { results: AdminOrganization[] }>('/api/organizations/admin/', { signal })
  const rows = Array.isArray(data) ? data : data.results ?? []
  kept = { who, at: Date.now(), changes: changesBefore, rows }
  return rows
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
