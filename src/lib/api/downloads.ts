import { apiFetch, apiFetchBlob, ApiError } from './client'
import { enhanceBatch, getEnhancementBatchJob } from './enhancements'
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

/** Wait for a batch's enhancement job to settle (it runs in the background on a real server). */
async function waitForEnhancement(batchId: number): Promise<void> {
  let job = await enhanceBatch(batchId)
  const deadline = Date.now() + 180_000
  while (job.status === 'pending' || job.status === 'queued' || job.status === 'processing') {
    if (Date.now() > deadline) throw new Error('Enhancing the photos is taking longer than expected. Please try again in a minute.')
    await sleep(1500)
    job = await getEnhancementBatchJob(job.id)
  }
  if (job.status === 'failed') throw new Error(job.failure_reason || 'The photos could not be enhanced.')
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
