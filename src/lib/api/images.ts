import { apiFetch, apiFetchBlob } from './client'

/** DRF's paginated envelope. `/api/images/my/` uses it; batch lists do not. */
export interface Page<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type ImageStatus = 'uploaded' | 'rejected' | 'processing' | 'failed'

/**
 * What the pipeline concluded about a photo, which is not the same thing as
 * whether the upload worked. `status` says the file arrived; `display_status`
 * says whether it was accepted, rejected or sent to a moderator.
 */
export type DisplayStatus =
  | 'queued' | 'processing' | 'accepted' | 'rejected' | 'needs_review'
  | 'completed' | 'failed' | 'cancelled' | 'uploaded'

/**
 * What the quality checks measured. Every score is a percentage, 0 to 100 —
 * the acceptance threshold is 60. These are real measurements, so showing them
 * is worth more than an overall verdict alone: they say *why*.
 */
export interface QualityDecisionSummary {
  decision?: string
  overall_score?: number | null
  brightness_score?: number | null
  sharpness_score?: number | null
  contrast_score?: number | null
  noise_score?: number | null
  exposure_score?: number | null
  resolution_score?: number | null
  rejection_reasons?: string[] | null
  status?: string
}

export interface FaceBox {
  x: number
  y: number
  width: number
  height: number
  /** The face's share of the frame, 0 to 1. */
  area_ratio: number
  confidence: number
}

export interface FaceValidationSummary {
  decision?: string
  face_count?: number
  faces?: FaceBox[]
  rejection_reason?: string
  message?: string
}

/** A person folder this photo was filed under. */
export interface IdentityGroupRef {
  id: number
  display_name: string
}

export interface EnhancementSummary {
  id: number
  status: string
  applied_level?: string
  download_url?: string | null
}

export interface ImageListItem {
  id: number
  batch: number
  original_name: string
  file_extension: string
  mime_type: string
  file_size: number
  width: number | null
  height: number | null
  status: ImageStatus
  display_status: DisplayStatus
  rejection_reason: string
  /** Absolute URLs, but both are protected: fetch them with the bearer token. */
  download_url: string | null
  thumbnail_url: string | null
  batch_display_name: string
  upload_type: string
  quality_decision: QualityDecisionSummary | null
  face_validation: FaceValidationSummary | null
  latest_enhancement: EnhancementSummary | null
  identity_groups: IdentityGroupRef[] | null
  created_at: string
  updated_at: string
}

/** The sub-scores worth showing, in the order they read best. */
export const QUALITY_MEASURES = [
  { key: 'sharpness_score', label: 'Sharpness' },
  { key: 'brightness_score', label: 'Brightness' },
  { key: 'contrast_score', label: 'Contrast' },
  { key: 'exposure_score', label: 'Exposure' },
  { key: 'noise_score', label: 'Noise' },
  { key: 'resolution_score', label: 'Resolution' },
] as const

export interface UploadBatch {
  id: number
  upload_type: string
  /** Set for a ZIP upload; empty otherwise. */
  original_archive_name: string
  display_name: string
  status: string
  total_files: number
  accepted_files: number
  rejected_files: number
  total_size: number
  processing_status: string
  processed_files: number
  processing_failed_files: number
  processing_error: string
  processing_started_at: string | null
  processing_finished_at: string | null
  created_at: string
  updated_at: string
  images?: ImageListItem[]
}

export interface BatchImageProgress {
  image_id: number
  filename: string
  stage: string
  status: string
  progress_percentage: number
  failure_stage: string
  failure_reason: string
  retry_count: number
  updated_at: string
}

export interface BatchProgress {
  batch_id: number
  upload_type: string
  status: string
  stage: string
  progress_percentage: number
  cancellation_requested: boolean
  retry_count: number
  counts: Record<string, number>
  estimated_completion_at: string | null
  images: BatchImageProgress[]
  updated_at: string
}

/** A batch stops moving once it reaches one of these; stop polling then. */
const TERMINAL_STATUSES = new Set(['completed', 'partial', 'failed', 'cancelled'])

export function isBatchFinished(progress: BatchProgress | null): boolean {
  return progress !== null && TERMINAL_STATUSES.has(progress.status)
}

/**
 * The stages a batch moves through, in order, so a screen can show where it is
 * rather than only a percentage.
 */
export const PIPELINE_STAGES = [
  'uploaded', 'queued', 'preprocessing', 'face_validation', 'quality_analysis',
  'identity_grouping', 'enhancement', 'finalizing', 'completed',
] as const

export function uploadSingle(file: File, signal?: AbortSignal): Promise<UploadBatch> {
  const formData = new FormData()
  formData.append('file', file)
  return apiFetch<UploadBatch>('/api/images/upload/single/', { formData, signal })
}

/**
 * Several photos in one batch.
 *
 * Files that fail validation are rejected individually, so the batch can come
 * back with `rejected_files` above zero while still succeeding overall. Read
 * the per-image statuses rather than assuming everything went through.
 */
export function uploadMultiple(files: File[], signal?: AbortSignal): Promise<UploadBatch> {
  const formData = new FormData()
  for (const file of files) formData.append('files', file)
  return apiFetch<UploadBatch>('/api/images/upload/multiple/', { formData, signal })
}

export function uploadZip(file: File, signal?: AbortSignal): Promise<UploadBatch> {
  const formData = new FormData()
  formData.append('file', file)
  return apiFetch<UploadBatch>('/api/images/upload/zip/', { formData, signal })
}

export function listMyImages(
  params: { page?: number; status?: string } = {}, signal?: AbortSignal,
): Promise<Page<ImageListItem>> {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.status) query.set('status', params.status)
  const suffix = query.toString() ? `?${query}` : ''
  return apiFetch<Page<ImageListItem>>(`/api/images/my/${suffix}`, { signal })
}

export function getImage(imageId: number, signal?: AbortSignal): Promise<ImageListItem> {
  return apiFetch<ImageListItem>(`/api/images/${imageId}/`, { signal })
}

export function listBatches(signal?: AbortSignal): Promise<UploadBatch[]> {
  return apiFetch<UploadBatch[]>('/api/images/batches/', { signal })
}

export function getBatchProgress(batchId: number, signal?: AbortSignal): Promise<BatchProgress> {
  return apiFetch<BatchProgress>(`/api/images/batches/${batchId}/progress/`, { signal })
}

export function cancelBatch(batchId: number): Promise<unknown> {
  return apiFetch(`/api/images/batches/${batchId}/cancel/`, { method: 'POST' })
}

export function retryBatch(batchId: number): Promise<unknown> {
  return apiFetch(`/api/images/batches/${batchId}/retry/`, { method: 'POST' })
}

/**
 * A photo's thumbnail.
 *
 * Never draw a gallery from `download_url`: an original can be hundreds of
 * megabytes. 256 for tiles, 1024 for a lightbox. Both are protected endpoints,
 * so the bytes are fetched with the token and handed to the browser as an
 * object URL.
 */
export function getImageThumbnail(
  imageId: number, size = 256, signal?: AbortSignal,
): Promise<Blob> {
  return apiFetchBlob(`/api/images/${imageId}/thumbnail/?size=${size}`, { signal })
}

/** The real file. Only for an explicit download, never for display. */
export function downloadImage(imageId: number, signal?: AbortSignal): Promise<Blob> {
  return apiFetchBlob(`/api/images/${imageId}/download/`, { signal })
}
