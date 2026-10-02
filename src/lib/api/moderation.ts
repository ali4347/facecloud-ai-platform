import { apiFetch, apiFetchBlob } from './client'

export type ReviewSource = 'quality' | 'duplicate' | 'identity'
export type ReviewStatus =
  | 'pending' | 'in_review' | 'approved' | 'rejected' | 'corrected' | 'escalated'

export interface ReviewPerson {
  id: number
  username: string
  email: string
}

export interface ModeratorReview {
  id: number
  organization: number
  image_id: number
  /** The photo's own filename, so a row reads before its thumbnail arrives. */
  image_name: string
  source: ReviewSource
  status: ReviewStatus
  ai_recommendation: string
  ai_confidence: number | null
  assigned_moderator: ReviewPerson | null
  claimed_by: ReviewPerson | null
  is_claimed: boolean
  claim_expires_at: string | null
  due_at: string | null
  is_overdue: boolean
  sla_breached_at: string | null
  decision_reason: string
  decision_notes: string
  decided_by: ReviewPerson | null
  decided_at: string | null
  created_at: string
  updated_at: string
}

export interface ModeratorDashboard {
  pending: number
  in_review: number
  escalated: number
  completed_today: number
  approved_total: number
  rejected_total: number
  corrected_total: number
  overdue: number
  due_soon: number
  unassigned: number
  claimed_now: number
  oldest_open_age_hours: number | null
  sla_hours: number
}

export interface BulkFailure {
  review_id: number
  detail: string
}

export interface BulkResult {
  action: string
  requested: number
  succeeded: number[]
  succeeded_count: number
  failed: BulkFailure[]
  failed_count: number
}

export interface ModeratorPerformanceRow {
  moderator_id: number
  username: string
  decided_count: number
  approved: number
  rejected: number
  corrected: number
  on_time: number
  late: number
  on_time_rate: number | null
  average_decision_hours: number | null
  slowest_decision_hours: number | null
}

export interface ModeratorPerformance {
  window_days: number
  since: string
  sla_hours: number
  moderators: ModeratorPerformanceRow[]
  totals: {
    decided_count: number
    on_time: number
    late: number
    on_time_rate: number | null
    average_decision_hours: number | null
    open_now: number
    overdue_now: number
  }
}

export interface ReviewQueueFilters {
  status?: ReviewStatus
  source?: ReviewSource
  /** Only reviews still undecided after their deadline. */
  overdue?: boolean
  assignment?: 'mine' | 'unassigned'
  /** 'due_at' works to the deadline first; reviews without one come last. */
  ordering?: 'due_at'
}

function base(organizationId: number) {
  return `/api/organizations/${organizationId}/moderator`
}

function queryString(filters: ReviewQueueFilters) {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.source) params.set('source', filters.source)
  if (filters.overdue) params.set('overdue', 'true')
  if (filters.assignment) params.set('assignment', filters.assignment)
  if (filters.ordering) params.set('ordering', filters.ordering)
  const query = params.toString()
  return query ? `?${query}` : ''
}

export function listReviews(
  organizationId: number, filters: ReviewQueueFilters = {}, signal?: AbortSignal,
): Promise<ModeratorReview[]> {
  return apiFetch<ModeratorReview[]>(`${base(organizationId)}/reviews/${queryString(filters)}`, { signal })
}

export function getReview(organizationId: number, reviewId: number): Promise<ModeratorReview> {
  return apiFetch<ModeratorReview>(`${base(organizationId)}/reviews/${reviewId}/`)
}

/**
 * The photo behind a review, as a thumbnail.
 *
 * Fetched rather than linked because the API authenticates with a bearer
 * header, which `<img src>` cannot send. The caller turns the blob into an
 * object URL and must revoke it when the image goes away, or the browser holds
 * the bytes for the life of the page.
 */
export function getReviewImage(
  organizationId: number, reviewId: number, size?: number, signal?: AbortSignal,
): Promise<Blob> {
  const query = size ? `?size=${size}` : ''
  return apiFetchBlob(`${base(organizationId)}/reviews/${reviewId}/image/${query}`, { signal })
}

export function getDashboard(organizationId: number, signal?: AbortSignal): Promise<ModeratorDashboard> {
  return apiFetch<ModeratorDashboard>(`${base(organizationId)}/dashboard/`, { signal })
}

export function getPerformance(
  organizationId: number, days = 30, signal?: AbortSignal,
): Promise<ModeratorPerformance> {
  return apiFetch<ModeratorPerformance>(`${base(organizationId)}/metrics/?days=${days}`, { signal })
}

export type DecisionAction = 'approve' | 'reject' | 'correct' | 'keep_in_review'

/**
 * Record a decision. A review that was already decided answers 409, and so
 * does one another moderator currently holds -- show the message rather than
 * retrying, because neither is fixed by trying again.
 */
export function decideReview(
  organizationId: number, reviewId: number,
  body: { action: DecisionAction; reason?: string; notes?: string; group_id?: number },
): Promise<ModeratorReview> {
  return apiFetch<ModeratorReview>(`${base(organizationId)}/reviews/${reviewId}/decision/`, { body })
}

export function escalateReview(
  organizationId: number, reviewId: number, reason = '',
): Promise<ModeratorReview> {
  return apiFetch<ModeratorReview>(`${base(organizationId)}/reviews/${reviewId}/escalate/`, {
    body: { reason },
  })
}

/** Take the review so nobody else works it. Answers 409 if someone else holds it. */
export function claimReview(organizationId: number, reviewId: number): Promise<ModeratorReview> {
  return apiFetch<ModeratorReview>(`${base(organizationId)}/reviews/${reviewId}/claim/`, {
    method: 'POST',
  })
}

/** Give a claimed review back to the queue. */
export function releaseReview(organizationId: number, reviewId: number): Promise<ModeratorReview> {
  return apiFetch<ModeratorReview>(`${base(organizationId)}/reviews/${reviewId}/release/`, {
    method: 'POST',
  })
}

/**
 * One decision across a selection.
 *
 * Answers 200 even when some rows could not be decided, so always read
 * `failed` -- a row that was already decided or is held by another moderator is
 * reported there while the rest still went through.
 */
export function bulkDecide(
  organizationId: number,
  body: { review_ids: number[]; action: 'approve' | 'reject' | 'escalate'; reason?: string; notes?: string },
): Promise<BulkResult> {
  return apiFetch<BulkResult>(`${base(organizationId)}/reviews/bulk-decision/`, { body })
}

/** How many reviews one bulk request may carry; mirrors MODERATION_BULK_MAX_REVIEWS. */
export const BULK_LIMIT = 50

const SOURCE_LABELS: Record<ReviewSource, string> = {
  quality: 'Quality exception',
  duplicate: 'Suspected duplicate',
  identity: 'Identity match',
}

export function sourceLabel(source: ReviewSource): string {
  return SOURCE_LABELS[source] ?? source
}

const STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: 'Pending',
  in_review: 'In review',
  approved: 'Approved',
  rejected: 'Rejected',
  corrected: 'Corrected',
  escalated: 'Escalated',
}

export function statusLabel(status: ReviewStatus): string {
  return STATUS_LABELS[status] ?? status
}

export type DeadlineState = 'overdue' | 'due-soon' | 'on-track' | 'met' | 'missed' | 'none'

/**
 * How a deadline reads in the queue.
 *
 * Deliberately coarse: a moderator needs to know whether something is late,
 * close or fine, not the exact minute. A review that has been decided is
 * reported as met or missed instead -- its deadline is history, so counting
 * down to it would read as work still to do.
 */
export function deadlineState(review: ModeratorReview): DeadlineState {
  if (!review.due_at) return 'none'
  if (review.decided_at) {
    return new Date(review.decided_at) <= new Date(review.due_at) ? 'met' : 'missed'
  }
  if (review.is_overdue) return 'overdue'
  const hoursLeft = (new Date(review.due_at).getTime() - Date.now()) / 3_600_000
  return hoursLeft <= 4 ? 'due-soon' : 'on-track'
}
