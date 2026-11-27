import { apiFetch, apiFetchBlob, apiFetchFile, ApiError } from './client'
import { enhanceAcceptedPhotos } from '../batchEnhance'
import type { Page } from './images'

export type DownloadResourceType =
  | 'original_image' | 'standardized_image' | 'enhanced_image' | 'edited_image'
  | 'processing_report' | 'batch_package' | 'identity_group_package'

export type DownloadKind = 'single' | 'batch' | 'report'

/** One line of the person's download history. */
export interface DownloadItem {
  id: number
  resource_type: DownloadResourceType
  resource_id: number
  batch_id: number | null
  image_id: number | null
  filename: string
  file_size: number
  content_type: string
  downloaded_at: string
  kind: DownloadKind
  /** When the file or its link ends; null when it does not. */
  expires_at: string | null
  /** Photos inside a ZIP or batch report; null for a single photo. */
  image_count: number | null
  /** A live share link exists. The link itself is never listed. */
  has_active_link: boolean
}

export function listDownloads(page = 1, signal?: AbortSignal): Promise<Page<DownloadItem>> {
  return apiFetch<Page<DownloadItem>>(`/api/downloads/?page=${page}`, { signal })
}

export type PackageType = 'accepted_results' | 'complete_batch'
export type PackageStatus = 'queued' | 'generating' | 'ready' | 'failed' | 'expired'

export interface DownloadPackage {
  id: number
  batch: number
  package_type: PackageType
  status: PackageStatus
  display_name: string
  file_size: number
  failure_reason: string
  expires_at: string | null
  created_at: string
}

/** Ask for a ZIP of a batch. The same request again answers with the one already made. */
export async function createBatchPackage(batchId: number, packageType: PackageType): Promise<DownloadPackage> {
  const data = await apiFetch<{ created: boolean; package: DownloadPackage }>(
    `/api/downloads/batches/${batchId}/packages/`, { method: 'POST', body: { package_type: packageType } },
  )
  return data.package
}

export function getDownloadPackage(packageId: number, signal?: AbortSignal): Promise<DownloadPackage> {
  return apiFetch<DownloadPackage>(`/api/downloads/packages/${packageId}/`, { signal })
}

/** Make a failed or expired ZIP again. */
export async function regenerateDownloadPackage(packageId: number): Promise<DownloadPackage> {
  const data = await apiFetch<{ created: boolean; package: DownloadPackage }>(
    `/api/downloads/packages/${packageId}/regenerate/`, { method: 'POST' },
  )
  return data.package
}

export function downloadPackageFile(packageId: number): Promise<Blob> {
  return apiFetchBlob(`/api/downloads/packages/${packageId}/download/`)
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/** Wait for a ZIP the server is building in the background; stops with a plain message if it takes too long or fails. */
export async function waitForPackage(start: DownloadPackage): Promise<DownloadPackage> {
  let current = start
  const deadline = Date.now() + 180_000
  while (current.status === 'queued' || current.status === 'generating') {
    if (Date.now() > deadline) throw new Error('The ZIP is taking longer than expected. Please try again in a minute.')
    await sleep(1500)
    current = await getDownloadPackage(current.id)
  }
  if (current.status === 'failed') throw new Error(current.failure_reason || 'The ZIP could not be prepared.')
  if (current.status === 'expired') throw new Error('The ZIP expired before it could be used. Please try again.')
  return current
}

/** Enhance the batch's accepted photos (not the rejected ones) before packaging them. */
async function waitForEnhancement(batchId: number): Promise<void> {
  const outcome = await enhanceAcceptedPhotos(batchId)
  if (outcome.total > 0 && outcome.failed === outcome.total) {
    throw new Error(outcome.firstError || 'The photos could not be enhanced.')
  }
}

/**
 * Build a batch ZIP and fetch it: the whole "Download accepted photos" action.
 *
 * "Accepted results" are the *enhanced* copies of the accepted photos, and a batch upload does not
 * enhance anything by itself. So when the server says there are none yet, the batch is enhanced
 * first and the ZIP asked for again. Asking only after a refusal avoids enhancing a batch twice.
 */
export async function fetchBatchZip(batchId: number, packageType: PackageType): Promise<{ blob: Blob; filename: string }> {
  let start: DownloadPackage
  try {
    start = await createBatchPackage(batchId, packageType)
  } catch (caught) {
    /* Newer backends say so with a stable code; older ones only in the sentence. */
    const code = caught instanceof ApiError && caught.body && typeof caught.body === 'object'
      ? (caught.body as { code?: unknown }).code : undefined
    const noEnhancedYet = packageType === 'accepted_results' && caught instanceof ApiError
      && caught.status === 409 && (code === 'enhancement_required' || /enhanced images/i.test(caught.message))
    if (!noEnhancedYet) throw caught
    await waitForEnhancement(batchId)
    start = await createBatchPackage(batchId, packageType)
  }
  const ready = await waitForPackage(start)
  return { blob: await downloadPackageFile(ready.id), filename: ready.display_name || `facecloud-batch-${batchId}.zip` }
}

/** The bytes behind a history row, whichever kind of file it is. */
export function downloadHistoryFile(item: DownloadItem): Promise<Blob> {
  const imageId = item.image_id ?? item.resource_id
  switch (item.resource_type) {
    case 'original_image':          return apiFetchBlob(`/api/images/${imageId}/download/`)
    case 'standardized_image':      return apiFetchBlob(`/api/images/${imageId}/preprocessing/download/`)
    case 'enhanced_image':          return apiFetchBlob(`/api/enhancements/results/${item.resource_id}/download/`)
    case 'edited_image':            return apiFetchBlob(`/api/enhancements/edits/${item.resource_id}/download/`)
    case 'processing_report':       return apiFetchBlob(`/api/reports/${item.resource_id}/download/`)
    case 'batch_package':           return apiFetchBlob(`/api/downloads/packages/${item.resource_id}/download/`)
    case 'identity_group_package':  return apiFetchBlob(`/api/identities/exports/${item.resource_id}/download/`)
  }
}

/** Which history rows can be given a public link. Others have none by design. */
export function canMakeLink(item: DownloadItem): boolean {
  return item.resource_type === 'enhanced_image' || item.resource_type === 'identity_group_package'
}

export interface PublicLink { id: number; public_url: string; expires_at: string }

/** A fresh time-limited public link for a row. Its token comes back only now. */
export function makeLinkFor(item: DownloadItem): Promise<PublicLink> {
  if (item.resource_type === 'identity_group_package') {
    return apiFetch<PublicLink>(`/api/identities/exports/${item.resource_id}/share/`, { method: 'POST', body: {} })
  }
  return apiFetch<PublicLink>('/api/shares/', { method: 'POST', body: { result: item.resource_id } })
}

// ── Download approval (organizations that require a moderator's approval) ────
// docs/features/download-approval.md in the backend. Nothing here builds an image URL: previews come from the
// existing thumbnail and moderator preview routes, and files only from the authenticated routes below.

export type ArtifactType = 'enhanced' | 'original' | 'edited'
export type AccessState = 'not_requested' | 'pending' | 'granted' | 'denied' | 'expired' | 'revoked'
export type DownloadRequestStatus = 'pending' | 'in_review' | 'approved' | 'partially_approved' | 'denied' | 'cancelled'
export type RequestItemStatus = 'pending' | 'approved' | 'denied'
export type DenialReasonCode =
  | 'privacy_or_consent' | 'client_restriction' | 'distribution_rights' | 'incorrect_selection' | 'policy_restriction' | 'other'
  /** Set by the server, never chosen: the image stopped being eligible before it was approved. */
  | 'no_longer_eligible'

export interface RequestedItem { image_id: number; artifact_type?: ArtifactType; artifact_id?: number }

export interface EligibilityItem {
  image_id: number
  artifact_type: ArtifactType
  eligible: boolean
  /** not_found, not_in_organization, not_yours, not_available, not_approved, not_processed, artifact_unavailable, already_requested, already_granted; '' when eligible. */
  reason: string
  detail: string
  access_state: AccessState
}

export interface EligibilityCheck {
  approval_required: boolean
  /** False when nobody in the organization could decide a request (no moderator who may see this member). */
  reviewer_available: boolean
  items: EligibilityItem[]
}

export interface DownloadGrant {
  id: number
  artifact_type?: ArtifactType
  artifact_id?: number | null
  expires_at: string
  revoked_at: string | null
  revoke_reason: string
  max_uses: number
  use_count: number
  active: boolean
  expired: boolean
  created_at?: string
}

export interface DownloadRequestItem {
  id: number
  image_id: number
  image_name: string
  artifact_type: ArtifactType
  artifact_id: number | null
  status: RequestItemStatus
  denial_reason_code: DenialReasonCode | ''
  denial_reason_text: string
  reviewed_at: string | null
  grant: DownloadGrant | null
  /** Set only for the requester, and only for an approved item. Fetch with the token (downloadRequestItemFile); never link it. */
  file_url: string | null
}

export interface DownloadRequestSummary {
  id: number
  organization: number
  organization_name: string
  requester: { id: number; username: string; email: string }
  status: DownloadRequestStatus
  requester_message: string
  /** Sent back as expected_version with a decision, so a decision on a stale copy is refused (409 request_changed). */
  version: number
  counts: { total: number; pending: number; approved: number; denied: number }
  created_at: string
  updated_at: string
  decided_at: string | null
}

export interface DownloadRequest extends DownloadRequestSummary { items: DownloadRequestItem[] }

/** The machine-readable part of an API error: `code`, and `items` for 400 items_not_eligible. */
export function errorCodeOf(error: unknown): string | null {
  if (!(error instanceof ApiError) || !error.body || typeof error.body !== 'object') return null
  const code = (error.body as { code?: unknown }).code
  return typeof code === 'string' ? code : null
}

export function ineligibleItemsOf(error: unknown): EligibilityItem[] {
  if (!(error instanceof ApiError) || !error.body || typeof error.body !== 'object') return []
  const items = (error.body as { items?: unknown }).items
  return Array.isArray(items) ? (items as EligibilityItem[]) : []
}

/** Which of these images can be requested, and the access each one already has. */
export function checkDownloadEligibility(organizationId: number, items: RequestedItem[], signal?: AbortSignal): Promise<EligibilityCheck> {
  return apiFetch<EligibilityCheck>('/api/downloads/requests/check/', { method: 'POST', body: { organization_id: organizationId, items }, signal })
}

/**
 * Submit one request for several images. `clientToken` makes a retry safe: the same token answers with the request
 * already made (200, created false) instead of a second one. Generate it once per dialog and reuse it on retry.
 */
export function createDownloadRequest(
  organizationId: number, items: RequestedItem[], clientToken: string, message = '',
): Promise<{ created: boolean; request: DownloadRequest }> {
  const body: Record<string, unknown> = { organization_id: organizationId, items, client_token: clientToken }
  if (message.trim()) body.message = message.trim()
  return apiFetch('/api/downloads/requests/', { method: 'POST', body })
}

export function listMyDownloadRequests(filters: { status?: string; organization?: number } = {}, signal?: AbortSignal): Promise<DownloadRequestSummary[]> {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.organization) params.set('organization', String(filters.organization))
  const query = params.toString()
  return apiFetch<DownloadRequestSummary[] | { results: DownloadRequestSummary[] }>(`/api/downloads/requests/${query ? `?${query}` : ''}`, { signal })
    .then(data => (Array.isArray(data) ? data : data.results ?? []))
}

export function getMyDownloadRequest(requestId: number, signal?: AbortSignal): Promise<DownloadRequest> {
  return apiFetch<DownloadRequest>(`/api/downloads/requests/${requestId}/`, { signal })
}

/** Withdraw a request nobody has started to decide. */
export function cancelDownloadRequest(requestId: number): Promise<DownloadRequest> {
  return apiFetch<DownloadRequest>(`/api/downloads/requests/${requestId}/cancel/`, { method: 'POST' })
}

/** One approved image, with the token. The request page shows a refusal itself (expired, revoked, used up), so the app-wide dialog stays closed. */
export function downloadRequestItemFile(requestId: number, itemId: number) {
  return apiFetchFile(`/api/downloads/requests/${requestId}/items/${itemId}/file/`, { handlesApprovalRefusal: true })
}

/** A ZIP of the approved images that are still authorized now (denied, expired and revoked ones are left out by the server). */
export function downloadRequestZip(requestId: number) {
  return apiFetchFile(`/api/downloads/requests/${requestId}/zip/`, { handlesApprovalRefusal: true })
}
