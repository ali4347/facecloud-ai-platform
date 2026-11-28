import { apiFetch, changesSoFar } from './client'
import { getSession } from '../session'
import type { ModeratorDataScope, Organization, PlanLimits, PlanUsage } from './organizations'

/**
 * The invitation that makes someone the owner of an organization the administrator created from an e-mail address
 * (backend PR #176, docs/features/admin-owner-invitation.md). The link itself is never returned by the API.
 */
export interface OwnerInvitation {
  id: number
  email: string
  /** `expired` = still pending but its time ran out. */
  status: 'pending' | 'accepted' | 'cancelled' | 'expired' | 'rejected'
  expires_at: string
  created_at: string
  accepted_at: string | null
  /** queued (about to be sent), sent (the mail server accepted it; delivery to the inbox is not known) or failed. Empty on older invitations. */
  email_status: 'queued' | 'sent' | 'failed' | ''
  email_sent_at: string | null
  email_failure_reason: string
  /** True while the organization still waits for its owner. */
  can_resend: boolean
  accepted_by: { id: number; username: string } | null
}

/** An organization as the administrator sees it: with its owner, its head count and what its plan allows. */
export interface AdminOrganization extends Organization {
  /** Null until an invited owner accepts. */
  owner?: { id: number; username: string } | null
  member_count?: number
  moderator_count?: number
  limits?: PlanLimits
  usage?: PlanUsage
  /** Set while `status` is `pending_owner`; null otherwise. */
  owner_invitation?: OwnerInvitation | null
}

/** "Waiting for owner": created from an e-mail address, nobody belongs to it until the invited owner accepts. */
export const isWaitingForOwner = (o: Pick<Organization, 'status'>) => o.status === 'pending_owner'

/*
 * Four admin screens (Organizations, Moderators, Invitations, Users) read this list when they open, and the server allows
 * only 30 reads of it an hour (it shares the invitation limit), so a rehearsal clicking between those screens ran into
 * "too many requests". The list is kept for a minute, for the same person, and dropped as soon as anything is changed
 * (a team, a moderator, an invitation or an account), so a screen never shows seats or counts that the person has just changed.
 */
const KEEP_MS = 60_000
const kept = new Map<string, { who: string; at: number; changes: number; rows: AdminOrganization[] }>()

/**
 * The organizations as the administrator sees them. `kind` is `organization` (shared organizations only: what the
 * screens need; every account's private workspace is also an organization row, so `all` grows with every sign-up),
 * `personal` or `all`. A backend older than PR #176 ignores `kind`, so the rows are narrowed here as well.
 */
export async function listAdminOrganizations(signal?: AbortSignal, kind: 'organization' | 'personal' | 'all' = 'all'): Promise<AdminOrganization[]> {
  const who = getSession()?.email ?? ''
  const hit = kept.get(kind)
  if (hit && hit.who === who && hit.changes === changesSoFar() && Date.now() - hit.at < KEEP_MS) return hit.rows
  const changesBefore = changesSoFar() // counted before asking, so a change made while waiting still makes this answer stale
  const data = await apiFetch<AdminOrganization[] | { results: AdminOrganization[] }>(`/api/organizations/admin/${kind === 'all' ? '' : `?kind=${kind}`}`, { signal })
  const all = Array.isArray(data) ? data : data.results ?? []
  const rows = kind === 'all' ? all : all.filter(o => o.is_personal === (kind === 'personal'))
  kept.set(kind, { who, at: Date.now(), changes: changesBefore, rows })
  return rows
}

export type OrganizationPlan = 'free' | 'team' | 'enterprise'

/**
 * Create an organization with an existing account as its owner (the account owns it at once; no invitation).
 * Kept for callers that already know the account; the Organizations screen invites by e-mail instead.
 */
export function createAdminOrganization(body: { name: string; owner_id: number; plan: OrganizationPlan }): Promise<AdminOrganization> {
  return apiFetch<AdminOrganization>('/api/organizations/admin/', { method: 'POST', body })
}

/** The answer to creating an organization for an owner e-mail address. */
export interface CreatedForOwner extends AdminOrganization {
  /** False when the same request was already made while it still waits (200): the same organization, and no second e-mail. */
  created: boolean
  /** Whether an account with that address exists (it will be asked to sign in) or not (it will register). */
  owner_account_exists: boolean | null
}

/**
 * Create an organization for an owner who may have no account yet. It waits for its owner (`pending_owner`, nobody belongs
 * to it) and the address gets a single-use invitation link; FaceCloud never sends a password. Errors: 400 (bad e-mail,
 * empty name), 403, 429 (ApiError carries the field messages).
 */
export function createOrganizationForOwner(body: { name: string; owner_email: string; plan: OrganizationPlan }): Promise<CreatedForOwner> {
  return apiFetch<CreatedForOwner>('/api/organizations/admin/', { method: 'POST', body })
}

/** The owner invitation of an organization created from an e-mail address. 404 for one created with an existing owner. */
export function getOwnerInvitation(organizationId: number, signal?: AbortSignal): Promise<OwnerInvitation> {
  return apiFetch<OwnerInvitation>(`/api/organizations/admin/${organizationId}/owner-invitation/`, { signal })
}

/** Send a new link (the old one stops working); also reopens an expired or cancelled invitation. 409 once accepted, 403 if suspended. */
export function resendOwnerInvitation(organizationId: number): Promise<OwnerInvitation> {
  return apiFetch<OwnerInvitation>(`/api/organizations/admin/${organizationId}/owner-invitation/resend/`, { method: 'POST' })
}

/** Withdraw the link; the organization keeps waiting and a resend can invite again. 409 unless pending. */
export function cancelOwnerInvitation(organizationId: number): Promise<OwnerInvitation> {
  return apiFetch<OwnerInvitation>(`/api/organizations/admin/${organizationId}/owner-invitation/cancel/`, { method: 'POST' })
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
