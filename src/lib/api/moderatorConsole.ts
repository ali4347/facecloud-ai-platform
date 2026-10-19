import { apiFetch, apiFetchBlob } from './client'

/** The moderator console's screens beyond the review queue: Batches, Identity Review, Audit, Rejected Images, Reports. */

const root = (organizationId: number) => `/api/organizations/${organizationId}`
const base = (organizationId: number) => `${root(organizationId)}/moderator`

/** The API hands out absolute preview addresses; the client wants the path. They need the Authorization header, so they are fetched, not linked. */
export function pathOf(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.pathname + parsed.search
  } catch {
    return url
  }
}

export function getPreview(url: string, signal?: AbortSignal): Promise<Blob> {
  return apiFetchBlob(pathOf(url), { signal })
}

/** A plain array when no `?page=` is sent, a `{count, results}` envelope otherwise; everything here is read as an array. */
async function array<T>(path: string, signal?: AbortSignal): Promise<T[]> {
  const data = await apiFetch<T[] | { results: T[] }>(path, { signal })
  return Array.isArray(data) ? data : data.results ?? []
}

// ── Batches ──────────────────────────────────────────────────────────────────

export type BatchOutcome = 'accepted' | 'rejected' | 'needs_review' | 'failed' | 'cancelled' | 'processing'

export interface BatchCounts { accepted: number; rejected: number; needs_review: number; failed: number }

export interface ModeratorBatch {
  id: number
  owner_username: string
  /** single | multiple | zip */
  upload_type: string
  /** The ZIP's file name, else the label, else "Upload <id>". */
  name: string
  /** pending | queued | processing | completed | partial | failed | cancelled */
  processing_status: string
  progress_percentage: number
  counts: BatchCounts
  total_files: number
  processed_files: number
  processing_failed_files: number
  processing_error: string
  retry_count: number
  created_at: string
}

export interface ModeratorBatchImage {
  id: number
  original_name: string
  file_size: number
  outcome: BatchOutcome
  rejection_reason: string
  failure_reason: string | null
  preview_url: string | null
}

export interface ModeratorBatchDetail { batch: ModeratorBatch; images: ModeratorBatchImage[] }

export const listModeratorBatches = (organizationId: number, signal?: AbortSignal) =>
  array<ModeratorBatch>(`${base(organizationId)}/batches/`, signal)

export const getModeratorBatch = (organizationId: number, batchId: number, signal?: AbortSignal) =>
  apiFetch<ModeratorBatchDetail>(`${base(organizationId)}/batches/${batchId}/`, { signal })

export const retryBatch = (organizationId: number, batchId: number) =>
  apiFetch<ModeratorBatch>(`${base(organizationId)}/batches/${batchId}/retry/`, { method: 'POST', body: {} })

export const cancelBatch = (organizationId: number, batchId: number) =>
  apiFetch<ModeratorBatch>(`${base(organizationId)}/batches/${batchId}/cancel/`, { method: 'POST', body: {} })

/** Runs enhancement again for every eligible photo of the batch; originals and earlier outputs are kept. */
export const reprocessBatch = (organizationId: number, batchId: number, reason: string) =>
  apiFetch<{ job_id: number; status: string; total_images: number }>(
    `${base(organizationId)}/batches/${batchId}/reprocess/`, { method: 'POST', body: { level: 'auto', style: 'natural', reason } })

// ── Identity Review ──────────────────────────────────────────────────────────

export interface PersonRef { id: number; username: string }

export interface IdentityFolder {
  id: number
  display_name: string
  owner: PersonRef
  member_count: number
  photos_in_organization: number
  /** A percentage, 0 to 100. */
  matching_confidence: number | null
  cover_images: { id: number; preview_url: string }[]
  updated_at: string
}

export interface MergeSuggestion {
  /** A percentage, 0 to 100. */
  similarity: number
  /** The folder to merge away. */
  source: IdentityFolder
  /** The folder to keep. */
  target: IdentityFolder
}

export const listIdentityFolders = (organizationId: number, signal?: AbortSignal) =>
  array<IdentityFolder>(`${base(organizationId)}/identity-groups/`, signal)

export const listMergeSuggestions = (organizationId: number, signal?: AbortSignal) =>
  array<MergeSuggestion>(`${base(organizationId)}/identity-groups/suggested-merges/`, signal)

export const mergeFolders = (organizationId: number, sourceId: number, targetId: number, reason: string) =>
  apiFetch<{ source: { id: number; state: string }; target: { id: number; member_count: number; display_name: string } }>(
    `${base(organizationId)}/identity-groups/merge/`,
    { method: 'POST', body: { source_group_id: sourceId, target_group_id: targetId, reason } })

// ── Audit ────────────────────────────────────────────────────────────────────

export interface OrgAuditEvent {
  id: number
  actor: { id: number; username: string; email: string } | null
  actor_name: string
  action: string
  /** A sentence without the actor, e.g. "Approved face.jpg." */
  message: string
  target_type: string
  target_id: number | null
  /** The photo, upload or folder name; null when there is none or it is gone. */
  target_label: string | null
  from_status: string | null
  to_status: string | null
  reason: string
  created_at: string
}

export interface AuditFilters { action?: string; actor?: number; q?: string; target_type?: string; target_id?: number }

function auditQuery(filters: AuditFilters, extra: Record<string, string> = {}): string {
  const params = new URLSearchParams(extra)
  for (const [key, value] of Object.entries(filters)) if (value !== undefined && value !== '') params.set(key, String(value))
  const query = params.toString()
  return query ? `?${query}` : ''
}

export const listOrgAudit = (organizationId: number, filters: AuditFilters = {}, signal?: AbortSignal) =>
  array<OrgAuditEvent>(`${root(organizationId)}/audit/${auditQuery(filters)}`, signal)

export interface OrgAuditPage { count: number; next: string | null; results: OrgAuditEvent[] }

/** One page of the trail (newest first), for the Audit screen. */
export async function listOrgAuditPage(organizationId: number, filters: AuditFilters, page: number, signal?: AbortSignal): Promise<OrgAuditPage> {
  return apiFetch<OrgAuditPage>(`${root(organizationId)}/audit/${auditQuery(filters, { page: String(page), page_size: '25' })}`, { signal })
}

// ── Rejected Images ──────────────────────────────────────────────────────────

export interface OrgImageRow {
  id: number
  original_name: string
  batch_id: number
  uploader: PersonRef
  created_at: string
  width: number | null
  height: number | null
  file_size: number
  /** accepted | rejected | needs_review (rejected includes files refused at upload). */
  decision: string
  /** Reason codes; for a refused file, its one sentence. */
  rejection_reasons: string[]
  overall_score: number | null
  /** Null for a refused file. */
  preview_url: string | null
  /** The newest review of this photo, when there is one. */
  review_id: number | null
}

export const listOrgImages = (organizationId: number, decision: 'rejected' | 'needs_review' | 'accepted', q: string, signal?: AbortSignal) => {
  const params = new URLSearchParams({ decision })
  if (q) params.set('q', q)
  return array<OrgImageRow>(`${base(organizationId)}/images/?${params}`, signal)
}

// ── Reports ──────────────────────────────────────────────────────────────────

export interface ModeratorReport {
  id: number
  requested_by_name: string
  report_type: string
  format: string
  status: string
  date_from: string | null
  date_to: string | null
  download_url: string | null
  file_size: number | null
  failure_reason: string
  generated_at: string | null
  expires_at: string | null
  created_at: string
}

export const listModeratorReports = (organizationId: number, signal?: AbortSignal) =>
  array<ModeratorReport>(`${base(organizationId)}/reports/`, signal)

export const createModeratorReport = (
  organizationId: number, body: { report_type: string; format: string; date_from?: string; date_to?: string },
) => apiFetch<ModeratorReport>(`${base(organizationId)}/reports/`, { method: 'POST', body })

export const downloadModeratorReport = (url: string) => apiFetchBlob(pathOf(url))

// ── Review detail: the photo's measurements ─────────────────────────────────

export interface ReviewImageInfo {
  id: number
  name: string
  width: number | null
  height: number | null
  file_size: number
  uploader: PersonRef
  face_count: number
  quality: { decision: string | null; overall_score: number | null; rejection_reasons: string[]; warnings: string[] }
  preview_url: string
}
