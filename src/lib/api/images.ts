import { apiFetch, apiFetchBlob } from './client'
import type { EnhancementLevel, EnhancementLighting, EnhancementStyle } from './enhancements'

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
  /** Newer backends only. */
  is_favorite?: boolean
  /** The capture time from the file's EXIF data; null when it has none. */
  taken_at?: string | null
  created_at: string
  updated_at: string
}

/**
 * The status to show for a photo. A stored quality decision of `rejected` (what an administrator's or a moderator's rejection writes) is shown as rejected.
 * The server's own Rejected filter lists such a photo, but while its setting QUALITY_CHECKS_REJECT is off (the usual) it does not count that decision when it
 * words `display_status` or filters Accepted: the photo is then worded from its enhancement ("Completed") and is listed under Accepted as well.
 * This follows the same stored decision the Rejected filter does, until the server words it too.
 */
export const photoStatus = (image: Pick<ImageListItem, 'display_status' | 'quality_decision'>): DisplayStatus =>
  image.quality_decision?.decision === 'rejected' ? 'rejected' : image.display_status

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
  /** What the server took from the upload's `level` / `style` / `lighting` for the batch's automatic enhancement; `{}` when nothing was sent. Absent on a backend that predates the fields. */
  auto_enhance_options?: { level?: EnhancementLevel; style?: EnhancementStyle; lighting?: EnhancementLighting }
}

export interface BatchImageProgress {
  image_id: number
  filename: string
  /** The photograph's file is kept, so it can be looked at (newer backends only; a photograph refused at upload never had one stored). */
  has_preview?: boolean
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
  /** The stages in the order this server runs them. Newer backends send it, so a change of order there needs no change here; see `stageOrder`. */
  stage_order?: string[]
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

/**
 * The order to show the stages in: the server's own when it sends one (and it names every stage this app knows), otherwise the order above.
 * Keeping the order on the server means moving a stage (say, enhancing before grouping by person) is one change there.
 */
export function stageOrder(progress?: { stage_order?: string[] } | null): readonly string[] {
  const sent = progress?.stage_order
  const complete = Array.isArray(sent) && sent.length === PIPELINE_STAGES.length && PIPELINE_STAGES.every(stage => sent.includes(stage))
  return complete ? sent : PIPELINE_STAGES
}

/**
 * Once a photo has passed the checks and been handed to enhancement, the backend reports the enhancement's own status as the photo's
 * `display_status` instead of `accepted`. Any of these means the photo was accepted, never that it waits for a moderator.
 */
export const ENHANCEMENT_STATUSES: readonly string[] = ['pending', 'queued', 'processing', 'completed', 'partial', 'failed']

/** A photo that passed the checks: `accepted`, or already carrying an enhancement status. */
export const passedChecks = (status: string | null | undefined): boolean => status === 'accepted' || ENHANCEMENT_STATUSES.includes(status ?? '')

/** How the person wants the automatic enhancement of an upload done: the (level, style) pair of the preset they picked, and the lighting. */
export interface UploadEnhancement { level?: EnhancementLevel; style?: EnhancementStyle; lighting?: EnhancementLighting }

export interface UploadOptions {
  signal?: AbortSignal
  /** Submits the photos to a team the person belongs to instead of their own workspace. */
  organizationId?: number
  /** `false` keeps the backend from enhancing the photos itself (it does by default). The upload screens no longer use it: the pipeline does the enhancement. */
  autoEnhance?: boolean
  /** Drives the batch's automatic enhancement (and only while `autoEnhance` is not false). The server answers 400 for a value it does not allow and makes no batch. */
  enhancement?: UploadEnhancement
}

/**
 * The optional fields every upload takes. A field is sent only when it says something: `level` "auto", `style` "natural" and `lighting` "auto" are
 * the server's own defaults and are left out, as is `auto_enhance` unless it is false. A person who changed nothing sends nothing extra.
 */
function appendOptions(formData: FormData, options: UploadOptions) {
  if (options.organizationId !== undefined) formData.append('organization_id', String(options.organizationId))
  if (options.autoEnhance === false) formData.append('auto_enhance', 'false')
  const { level, style, lighting } = options.enhancement ?? {}
  if (level && level !== 'auto') formData.append('level', level)
  if (style && style !== 'natural') formData.append('style', style)
  if (lighting && lighting !== 'auto') formData.append('lighting', lighting)
}

export function uploadSingle(file: File, options: UploadOptions = {}): Promise<UploadBatch> {
  const formData = new FormData()
  formData.append('file', file)
  appendOptions(formData, options)
  return apiFetch<UploadBatch>('/api/images/upload/single/', { formData, signal: options.signal })
}

/**
 * Several photos in one batch.
 *
 * Files that fail validation are rejected individually, so the batch can come
 * back with `rejected_files` above zero while still succeeding overall. Read
 * the per-image statuses rather than assuming everything went through.
 */
export function uploadMultiple(files: File[], options: UploadOptions = {}): Promise<UploadBatch> {
  const formData = new FormData()
  for (const file of files) formData.append('files', file)
  appendOptions(formData, options)
  return apiFetch<UploadBatch>('/api/images/upload/multiple/', { formData, signal: options.signal })
}

export function uploadZip(file: File, options: UploadOptions = {}): Promise<UploadBatch> {
  const formData = new FormData()
  formData.append('file', file)
  appendOptions(formData, options)
  return apiFetch<UploadBatch>('/api/images/upload/zip/', { formData, signal: options.signal })
}

/** What the photo list can be narrowed to, beside its status: one set of keys shared by the page's address and the API call. */
export interface PhotoFilter {
  favorite?: boolean
  album?: number
  /** Several ids: photos that contain all of those people. */
  person?: number[]
  /** YYYY-MM-DD, inclusive, on the capture date (the upload date when the file has none). */
  takenFrom?: string
  takenTo?: string
}

export function listMyImages(
  params: { page?: number; status?: string; batch?: number; pageSize?: number } & PhotoFilter = {}, signal?: AbortSignal,
): Promise<Page<ImageListItem>> {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.status) query.set('status', params.status)
  if (params.batch) query.set('batch', String(params.batch))
  if (params.pageSize) query.set('page_size', String(params.pageSize))
  if (params.favorite) query.set('favorite', 'true')
  if (params.album) query.set('album', String(params.album))
  for (const person of params.person ?? []) query.append('person', String(person))
  if (params.takenFrom) query.set('taken_from', params.takenFrom)
  if (params.takenTo) query.set('taken_to', params.takenTo)
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

/** Give an upload a name of the person's own. */
export function renameBatch(batchId: number, displayName: string): Promise<UploadBatch> {
  return apiFetch<UploadBatch>(`/api/images/batches/${batchId}/`, { method: 'PATCH', body: { display_name: displayName } })
}

/** Delete an upload AND every photo in it, for good (like deleting each photo from My Images, not the trash). */
export function deleteBatch(batchId: number): Promise<void> {
  return apiFetch<void>(`/api/images/batches/${batchId}/`, { method: 'DELETE' })
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
  imageId: number, size = 256, signal?: AbortSignal, version: 'original' | 'enhanced' = 'original',
): Promise<Blob> {
  return apiFetchBlob(`/api/images/${imageId}/thumbnail/?size=${size}${version === 'enhanced' ? '&version=enhanced' : ''}`, { signal })
}

/** What a photo list shows for a photo: its latest enhanced picture, the original when there is none. The before/after slider asks for the original on purpose (getImageThumbnail's default). */
export function getPhotoPicture(imageId: number, size = 256, signal?: AbortSignal): Promise<Blob> {
  return getImageThumbnail(imageId, size, signal, 'enhanced')
}

/** Delete one photo and its enhanced copies. This cannot be undone. */
export function deleteImage(imageId: number): Promise<void> {
  return apiFetch<void>(`/api/images/${imageId}/`, { method: 'DELETE' })
}

/** The real file. Only for an explicit download, never for display. */
export function downloadImage(imageId: number, signal?: AbortSignal): Promise<Blob> {
  return apiFetchBlob(`/api/images/${imageId}/download/`, { signal })
}
