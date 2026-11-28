import type {
  AccessState, ArtifactType, DenialReasonCode, DownloadGrant, DownloadRequestItem, DownloadRequestStatus, DownloadRequestSummary,
  EligibilityItem, RequestItemStatus,
} from './api/downloads'
import type { DenialReason, DownloadDecision } from './api/moderatorConsole'

/**
 * Words for the download-approval screens, kept in one place so the member's and the moderator's pages,
 * the gallery and the tests say the same thing. Every code here is one the backend sends
 * (docs/features/download-approval.md); an unknown code falls back to the server's own sentence.
 */

export const REQUEST_STATUS_LABEL: Record<DownloadRequestStatus, string> = {
  pending: 'Pending', in_review: 'In review', approved: 'Approved', partially_approved: 'Partially approved', denied: 'Denied', cancelled: 'Cancelled',
}

export const ITEM_STATUS_LABEL: Record<RequestItemStatus, string> = { pending: 'Waiting', approved: 'Approved', denied: 'Denied' }

export const ACCESS_STATE_LABEL: Record<AccessState, string> = {
  not_requested: 'Not requested', pending: 'Requested', granted: 'Approved', denied: 'Denied', expired: 'Approval expired', revoked: 'Approval withdrawn',
}

export const ARTIFACT_LABEL: Record<ArtifactType, string> = { enhanced: 'Enhanced photo', original: 'Original upload', edited: 'Saved edit' }

/** The reasons a moderator can give. `other` needs a sentence. */
export const DENIAL_REASONS: { code: Exclude<DenialReasonCode, 'no_longer_eligible'>; label: string }[] = [
  { code: 'privacy_or_consent', label: 'Privacy or consent' },
  { code: 'client_restriction', label: 'Client restriction' },
  { code: 'distribution_rights', label: 'Distribution rights' },
  { code: 'incorrect_selection', label: 'Incorrect selection' },
  { code: 'policy_restriction', label: 'Organization policy' },
  { code: 'other', label: 'Other' },
]

export function denialLabel(code: string): string {
  if (code === 'no_longer_eligible') return 'No longer eligible'
  return DENIAL_REASONS.find(reason => reason.code === code)?.label ?? (code ? code.replace(/_/g, ' ') : 'No reason given')
}

/** Tailwind classes for a status chip, in the colours the rest of the app uses. */
export const TONE = {
  neutral: 'bg-surface-mute text-ink-mute border-line',
  waiting: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/25',
  info: 'bg-sky-500/10 text-sky-400 border-sky-500/25',
  ok: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/25',
  mixed: 'bg-violet-500/10 text-violet-400 border-violet-500/25',
  bad: 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/25',
} as const

export const REQUEST_STATUS_TONE: Record<DownloadRequestStatus, keyof typeof TONE> = {
  pending: 'waiting', in_review: 'info', approved: 'ok', partially_approved: 'mixed', denied: 'bad', cancelled: 'neutral',
}

export const ACCESS_STATE_TONE: Record<AccessState, keyof typeof TONE> = {
  not_requested: 'neutral', pending: 'waiting', granted: 'ok', denied: 'bad', expired: 'neutral', revoked: 'bad',
}

/** A request is still open (nothing final yet) in these states; the member may cancel only while it is pending. */
export const OPEN_STATUSES: DownloadRequestStatus[] = ['pending', 'in_review']

/** What a grant allows right now, from the fields the server sends (it re-checks on every download anyway). */
export type GrantState = 'active' | 'expired' | 'revoked' | 'used_up'

export function grantState(grant: DownloadGrant, now = Date.now()): GrantState {
  if (grant.revoked_at) return 'revoked'
  if (grant.expired || new Date(grant.expires_at).getTime() <= now) return 'expired'
  if (grant.max_uses > 0 && grant.use_count >= grant.max_uses) return 'used_up'
  return grant.active ? 'active' : 'expired'
}

export const GRANT_STATE_LABEL: Record<GrantState, string> = {
  active: 'Ready to download', expired: 'Approval expired', revoked: 'Approval withdrawn', used_up: 'Download limit reached',
}

/** Why a download was refused (`reason` of a 403 download_approval_required), as a sentence a member can act on. */
export function refusalSentence(reason: string, fallback = ''): string {
  switch (reason) {
    case 'no_grant': return 'This photo needs a moderator’s approval before it can be downloaded.'
    case 'expired': return 'Your approval for this photo has expired. Request access again to download it.'
    case 'revoked': return 'A moderator withdrew the approval for this photo.'
    case 'used_up': return 'This approval has already been used as many times as allowed.'
    case 'not_approved': return 'This photo is not accepted (it is in review or was rejected), so it cannot be downloaded.'
    case 'not_a_member': return 'You are no longer an active member of this photo’s organization.'
    case 'organization_suspended': return 'This organization is suspended, so nothing can be downloaded from it.'
    case 'bulk_not_allowed': return 'This organization approves downloads photo by photo, so ZIP packages and share links are not available. Request access to the photos instead.'
    default: return fallback || 'This download needs approval from a moderator.'
  }
}

/** True when asking again could help (a new request), false when it cannot (suspended, not a member, not accepted). */
export const refusalCanBeRequested = (reason: string): boolean => ['no_grant', 'expired', 'revoked', 'used_up', 'bulk_not_allowed'].includes(reason)

/** Messages for the create/decision errors whose code is part of the contract. */
export function requestErrorSentence(code: string | null, fallback: string): string {
  switch (code) {
    case 'items_not_eligible': return 'Some of the selected photos cannot be requested, so nothing was sent. Remove them and try again.'
    case 'approval_not_required': return 'This organization no longer requires approval: you can download these photos directly.'
    case 'no_eligible_reviewer': return 'Nobody in this organization can approve your request yet. Ask your organization owner or the FaceCloud administrator to add a moderator.'
    case 'client_token_reused': return 'This request changed since it was first sent. Close this window and select the photos again.'
    case 'organization_suspended': return 'This organization is suspended, so no request can be made.'
    case 'request_closed': return 'This request was already decided or cancelled. The page now shows its latest state.'
    case 'item_already_decided': return 'Another reviewer decided some of these photos a moment ago. The page now shows their decisions.'
    case 'request_changed': return 'This request changed while you were looking at it. It was reloaded: check it and decide again.'
    case 'cannot_decide_own_request': return 'You made this request yourself, so another moderator or the owner has to decide it.'
    default: return fallback
  }
}

/** An eligibility answer by image id, for quick lookups from a gallery tile. */
export const byImage = (items: EligibilityItem[]): Map<number, EligibilityItem> => new Map(items.map(item => [item.image_id, item]))

/** One random token per request dialog; reused on retry so a repeated submit returns the same request. */
export function newClientToken(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

// ── Building a moderator's decision ─────────────────────────────────────────

export type DecisionAction = 'approve_all' | 'approve_selected' | 'deny_selected' | 'deny_all'
export interface ReasonInput { code: string; text: string }

export interface DecisionPlan {
  approve: number[]
  deny: number[]
  /** Left undecided (only deny_selected leaves any). */
  untouched: number[]
}

/** Which pending images each action approves, denies and leaves alone. approve_selected denies every other undecided image. */
export function planDecision(action: DecisionAction, pendingIds: number[], selectedIds: number[]): DecisionPlan {
  const chosen = pendingIds.filter(id => selectedIds.includes(id))
  const rest = pendingIds.filter(id => !selectedIds.includes(id))
  switch (action) {
    case 'approve_all': return { approve: pendingIds, deny: [], untouched: [] }
    case 'deny_all': return { approve: [], deny: pendingIds, untouched: [] }
    case 'approve_selected': return { approve: chosen, deny: rest, untouched: [] }
    case 'deny_selected': return { approve: [], deny: chosen, untouched: rest }
  }
}

/** Why a reason cannot be sent, or '' when it can. */
export function reasonProblem(reason: ReasonInput | undefined): string {
  if (!reason || !reason.code) return 'Choose a reason for the photos you deny.'
  if (!DENIAL_REASONS.some(r => r.code === reason.code)) return 'Choose one of the listed reasons.'
  if (reason.code === 'other' && !reason.text.trim()) return 'Explain the reason when you choose “Other”.'
  if (reason.text.length > 500) return 'Keep the explanation under 500 characters.'
  return ''
}

/**
 * The body of POST .../decision/, or the reason it cannot be sent yet. `overrides` are per-image reasons that replace the
 * general one for those images; they are sent only for images this decision denies.
 */
export function buildDecision(
  action: DecisionAction, pendingIds: number[], selectedIds: number[], reason: ReasonInput | undefined,
  overrides: Record<number, ReasonInput>, expectedVersion: number,
): { body: DownloadDecision } | { error: string } {
  if (pendingIds.length === 0) return { error: 'Every photo in this request is already decided.' }
  const plan = planDecision(action, pendingIds, selectedIds)
  if ((action === 'approve_selected' || action === 'deny_selected') && selectedIds.filter(id => pendingIds.includes(id)).length === 0) {
    return { error: 'Select at least one undecided photo first.' }
  }
  const body: DownloadDecision = { action, expected_version: expectedVersion }
  // Codes are checked by reasonProblem below before they are used, so the narrowing is safe.
  const asReason = (value: ReasonInput): DenialReason => ({ code: value.code as DenialReason['code'], text: value.text.trim() })
  if (action === 'approve_selected') body.item_ids = plan.approve
  if (action === 'deny_selected') body.item_ids = plan.deny
  if (plan.deny.length > 0) {
    const denied = new Set(plan.deny)
    const own = Object.entries(overrides).filter(([id, value]) => denied.has(Number(id)) && value.code)
    // Images with their own reason do not need the general one; any other denied image does.
    const needsGeneral = plan.deny.some(id => !own.some(([oid]) => Number(oid) === id))
    if (needsGeneral) {
      const problem = reasonProblem(reason)
      if (problem) return { error: problem }
      body.reason = asReason(reason!)
    }
    for (const [, value] of own) {
      const problem = reasonProblem(value)
      if (problem) return { error: `A photo’s own reason: ${problem.charAt(0).toLowerCase()}${problem.slice(1)}` }
    }
    if (own.length) body.item_reasons = Object.fromEntries(own.map(([id, value]) => [id, asReason(value)]))
  }
  return { body }
}

// ── Lists and items ─────────────────────────────────────────────────────────

export const STATUS_FILTERS: { value: '' | DownloadRequestStatus; label: string }[] = [
  { value: '', label: 'All' },
  ...(Object.keys(REQUEST_STATUS_LABEL) as DownloadRequestStatus[]).map(value => ({ value, label: REQUEST_STATUS_LABEL[value] })),
]

/** "3 approved · 1 denied · 2 waiting" for one request. */
export function countsLine(request: Pick<DownloadRequestSummary, 'counts'>): string {
  const { total, approved, denied, pending } = request.counts
  const parts = [`${total} photo${total === 1 ? '' : 's'}`]
  if (approved) parts.push(`${approved} approved`)
  if (denied) parts.push(`${denied} denied`)
  if (pending && pending !== total) parts.push(`${pending} waiting`)
  return parts.join(' · ')
}

/** An approved item whose approval still works now, so it can be downloaded. */
export const downloadable = (item: DownloadRequestItem, now = Date.now()) =>
  item.status === 'approved' && item.grant !== null && grantState(item.grant, now) === 'active'
