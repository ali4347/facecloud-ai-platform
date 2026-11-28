import { ApiError } from './api/client'
import type { LeaveStatus } from './api/leave'

export const LEAVE_REASON_MAX = 500
export const DENY_REASON_MIN = 3

export const LEAVE_STATUS_LABEL: Record<LeaveStatus, string> = {
  pending: 'Pending', approved: 'Approved', denied: 'Denied', cancelled: 'Cancelled',
}

const codeOf = (caught: unknown): string => (caught instanceof ApiError && caught.body && typeof caught.body === 'object'
  ? String((caught.body as Record<string, unknown>).code ?? '') : '')

/** True when the request was already decided or cancelled by the time this action reached the server (the loser of a race). */
export const isNotPending = (caught: unknown) => caught instanceof ApiError && caught.status === 409 && codeOf(caught) === 'leave_request_not_pending'

/** The server's error as a sentence a member or moderator can act on. */
export function leaveSentence(caught: unknown, fallback: string): string {
  const code = codeOf(caught)
  if (code === 'leave_request_pending') return 'You already have a leave request waiting for the moderator. Cancel it first if you want to change it.'
  if (code === 'no_eligible_reviewer') return 'No moderator is available to decide this request right now. Please ask the organization’s owner or the platform administrator.'
  if (code === 'leave_not_available') return 'The owner and the moderators cannot ask to leave here. Ask the platform administrator or the organization’s owner to change your role first.'
  if (code === 'personal_workspace_is_private') return 'Your personal workspace is yours alone, so there is nothing to leave.'
  if (code === 'moderator_required') return 'Only an organization moderator can decide leave requests. The owner can read them.'
  if (code === 'leave_request_not_pending') return 'This request was already decided or cancelled.'
  if (caught instanceof ApiError && caught.status === 404) return 'This organization or request is no longer available to you.'
  return caught instanceof Error && caught.message ? caught.message : fallback
}
