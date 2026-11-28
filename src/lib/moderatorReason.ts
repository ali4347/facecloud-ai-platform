import { ApiError } from './api/client'

/**
 * The reason the Platform Administrator must give when they add a moderator themselves (create the account, invite
 * them, or change someone's role to moderator) instead of the organization's owner inviting them. Backend PR #176:
 * `reason`, at least 8 characters once runs of spaces are collapsed, at most 500; recorded in the organization's audit
 * trail (`admin_moderator_override`), which the owner can read. Not asked for any other role.
 */
export const MODERATOR_REASON_MIN = 8
export const MODERATOR_REASON_MAX = 500

/** The reason as the server will keep it: trimmed, inner runs of whitespace collapsed to one space. */
export const normalizeReason = (value: string): string => value.split(/\s+/).filter(Boolean).join(' ')

/** Why the reason cannot be sent yet, or '' when it can. */
export function reasonProblem(value: string): string {
  const reason = normalizeReason(value)
  if (!reason) return 'Give the reason for this moderator assignment. It is recorded in the organization’s audit trail.'
  if (reason.length < MODERATOR_REASON_MIN) return `Write at least ${MODERATOR_REASON_MIN} characters, so the reason means something to the organization’s owner.`
  if (reason.length > MODERATOR_REASON_MAX) return `Keep the reason under ${MODERATOR_REASON_MAX} characters.`
  return ''
}

/** The server's own sentence about `reason` (400 {"reason": [...]}), when that is what it refused. */
export function serverReasonError(caught: unknown): string {
  if (!(caught instanceof ApiError) || !caught.body || typeof caught.body !== 'object') return ''
  const value = (caught.body as Record<string, unknown>).reason
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
  return typeof value === 'string' ? value : ''
}
