import { apiFetch } from './client'

/** `pending` moves to one of the other three; the other three are history. Contract: backend docs/features/organization-leave-request.md. */
export type LeaveStatus = 'pending' | 'approved' | 'denied' | 'cancelled'

export interface LeaveRequest {
  id: number
  organization_id: number
  organization_name: string
  member: { id: number; username: string; full_name: string; email: string }
  status: LeaveStatus
  /** What the member wrote (optional, at most 500 characters). */
  reason: string
  submitted_at: string
  reviewed_by: { id: number; username: string } | null
  decided_at: string | null
  /** Why the moderator denied it (required for a denial), or an optional note on an approval. */
  decision_reason: string
  /** The platform administrator decided it as an emergency override. */
  admin_override: boolean
  membership_status: string
}

const base = (organizationId: number) => `/api/organizations/${organizationId}`

/** The member's pending request, else their latest one, else null. */
export async function getMyLeaveRequest(organizationId: number, signal?: AbortSignal): Promise<LeaveRequest | null> {
  const answer = await apiFetch<{ request: LeaveRequest | null }>(`${base(organizationId)}/leave-request/`, { signal })
  return answer?.request ?? null
}

export function requestToLeave(organizationId: number, reason: string): Promise<LeaveRequest> {
  return apiFetch<LeaveRequest>(`${base(organizationId)}/leave-request/`, { method: 'POST', body: reason.trim() ? { reason: reason.trim() } : {} })
}

export function cancelLeaveRequest(organizationId: number): Promise<LeaveRequest> {
  return apiFetch<LeaveRequest>(`${base(organizationId)}/leave-request/cancel/`, { method: 'POST', body: {} })
}

/** `status`: `pending` (the server's default), `approved`, `denied`, `cancelled`, comma separated, or `all`. A plain array, or a `{results}` envelope. */
export async function listLeaveRequests(organizationId: number, status: string, signal?: AbortSignal): Promise<LeaveRequest[]> {
  const answer = await apiFetch<LeaveRequest[] | { results: LeaveRequest[] }>(`${base(organizationId)}/moderator/leave-requests/?status=${encodeURIComponent(status)}`, { signal })
  return Array.isArray(answer) ? answer : answer?.results ?? []
}

export function decideLeaveRequest(organizationId: number, leaveId: number, action: 'approve' | 'deny', reason = ''): Promise<LeaveRequest> {
  return apiFetch<LeaveRequest>(`${base(organizationId)}/moderator/leave-requests/${leaveId}/decision/`, {
    method: 'POST', body: reason.trim() ? { action, reason: reason.trim() } : { action },
  })
}
