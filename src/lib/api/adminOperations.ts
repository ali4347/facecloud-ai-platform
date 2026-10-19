import { apiFetch } from './client'
import type { Paged } from './adminSystem'

/* What an administrator can do about work that went wrong, the moderation picture across every organization, and
   inviting people by email. Shapes are what the backend sends (operations/serializers.py, operations/jobs.py,
   operations/moderation_overview.py, accounts/serializers.py); a field it does not send is not here. */

// ── Failed uploads ───────────────────────────────────────────────────────────

export interface FailedBatch {
  id: number
  owner_id: number
  owner_username: string
  upload_type: string
  display_name: string
  processing_status: string
  current_stage: string
  total_files: number
  accepted_files: number
  processed_files: number
  processing_failed_files: number
  processing_error: string
  retry_count: number
  processing_started_at: string | null
  processing_finished_at: string | null
  created_at: string
  updated_at: string
  /* Added by the backend's "console gaps" change; missing on a backend without it, so every one is optional. */
  organization_id?: number | null
  organization_name?: string | null
  /** Where most of its failed photos failed, in words ("Face validation"). */
  failure_stage_label?: string
  /** Why, as a sentence; never empty. */
  failure_reason?: string
  failed_images?: number
  failed_at?: string
  /** Whether Retry would be accepted now. */
  can_retry?: boolean
  /** Why it cannot be retried now; empty when it can. */
  retry_blocked_reason?: string
  max_retries?: number
  retries_left?: number
}

export function listFailedBatches(page: number, signal?: AbortSignal): Promise<Paged<FailedBatch>> {
  return apiFetch<Paged<FailedBatch>>(`/api/system/batches/failed/?page=${page}&page_size=10`, { signal })
}

/** Runs the owner's own "retry" for any user's failed batch. Answers 400 with a sentence when there is nothing to retry or the limit is reached. */
export function retryFailedBatch(batchId: number): Promise<{ status: string; stage: string }> {
  return apiFetch(`/api/system/batches/${batchId}/retry/`, { method: 'POST' })
}

// ── Failed jobs, by kind ─────────────────────────────────────────────────────

export interface FailedJob {
  id: number
  owner_id: number
  owner_username: string
  reason: string
  created_at: string
  updated_at: string
  /* Added by the same backend change; optional for the same reason. */
  kind_label?: string
  organization_name?: string | null
  failure_stage_label?: string
  failure_reason?: string
  failed_at?: string
}
export interface FailedJobs { generated_at: string; limit_per_kind: number; kinds: Record<string, FailedJob[]> }

export function listFailedJobs(signal?: AbortSignal): Promise<FailedJobs> {
  return apiFetch<FailedJobs>('/api/system/jobs/failed/?limit_per_kind=10', { signal })
}

// ── Moderation across every organization ─────────────────────────────────────

export interface ModerationOverview {
  /** How old an open review must be to count as stale (the window the request asked for). */
  stale_hours: number
  totals: {
    pending: number; in_review: number; escalated: number; completed_today: number
    approved_total: number; rejected_total: number; corrected_total: number
    stale_open: number; overdue: number; due_soon: number; unassigned: number; claimed_now: number
    sla_hours: number
  }
  organizations_needing_attention: {
    organization_id: number; organization_name: string
    pending: number; in_review: number; escalated: number; stale_open: number; overdue: number
    oldest_open_at: string | null
  }[]
  moderator_workload: { moderator_id: number; username: string; assigned_open: number; decided_total: number }[]
}

export function getModerationOverview(staleHours: number, signal?: AbortSignal): Promise<ModerationOverview> {
  return apiFetch<ModerationOverview>(`/api/system/moderation/?stale_hours=${staleHours}`, { signal })
}

// ── Invitations to create an account ─────────────────────────────────────────

export type InvitationStatus = 'pending' | 'accepted' | 'cancelled' | 'expired'
export interface AccountInvitation {
  id: number
  email: string
  role: 'user' | 'moderator' | 'admin'
  /** The team a moderator invitation is for; null for other roles. */
  organization: { id: number; name: string } | null
  status: InvitationStatus
  invited_by: string | null
  expires_at: string
  accepted_at: string | null
  created_at: string
}

export async function listAccountInvitations(status: InvitationStatus | '', signal?: AbortSignal): Promise<AccountInvitation[]> {
  const data = await apiFetch<AccountInvitation[] | { results?: AccountInvitation[] }>(
    `/api/user/admin/invitations/${status ? `?status=${status}` : ''}`, { signal },
  )
  return Array.isArray(data) ? data : data.results ?? []
}

/** 409 when the address already has an account or a waiting invitation; 400 for a moderator without a team. */
export function inviteAccount(body: { email: string; role: 'user' | 'moderator'; organization_id?: number }): Promise<AccountInvitation> {
  return apiFetch<AccountInvitation>('/api/user/admin/invitations/', { body })
}

export function resendAccountInvitation(id: number): Promise<AccountInvitation> {
  return apiFetch<AccountInvitation>(`/api/user/admin/invitations/${id}/resend/`, { method: 'POST', body: {} })
}

export function cancelAccountInvitation(id: number): Promise<void> {
  return apiFetch<void>(`/api/user/admin/invitations/${id}/`, { method: 'DELETE' })
}
