import { apiFetch, apiFetchBlob } from './client'

export type EnhancementLevel = 'auto' | 'low' | 'medium' | 'high'
export type EnhancementStyle = 'natural' | 'dynamic' | 'ai_max'
/** What to treat the photo as: `auto` lets the backend decide (and is never sent). */
export type EnhancementLighting = 'auto' | 'dark' | 'light'

/**
 * How an enhancement saw the lighting. The backend that exists today sends `detected` with what it measured (`exposure`, `scene_median`) and
 * whether a brightening step really changed the photo (`brightened`); it decides on its own. `used` and `forced` are for the day a person can
 * choose the method (the request's `lighting`): what was used, and whether it was forced.
 */
export interface LightingInfo {
  detected: 'dark' | 'light'
  /** The engine's own status: low_light, low_light_subject, dark_scene, backlit_subject, normal or overexposed. */
  exposure?: string
  /** Median grey level of the frame, 0 (black) to 255. */
  scene_median?: number | null
  /** A photo can be seen as dark and still not be brightened, when that was not safe to apply. */
  brightened?: boolean
  used?: 'dark' | 'light'
  forced?: boolean
}

export type EnhancementStatus =
  | 'pending' | 'queued' | 'processing' | 'completed' | 'partial' | 'failed' | 'cancelled'

export interface EnhancementResult {
  id: number
  image: number
  requested_level: EnhancementLevel
  /** May differ from what was asked for: the backend adapts to the photo. */
  applied_level: EnhancementLevel
  requested_style: EnhancementStyle
  /** What the person asked for (`auto` when they did not say). Absent on a backend that predates the lighting choice. */
  requested_lighting?: EnhancementLighting
  /** Newer backends only: older results have none. */
  lighting?: LightingInfo | null
  status: EnhancementStatus
  output_name: string
  output_format: string
  output_width: number | null
  output_height: number | null
  output_file_size: number
  processing_duration_ms: number
  failure_reason: string
  /** All protected endpoints — fetch with the bearer token, not as an <img src>. */
  download_url: string | null
  original_download_url: string | null
  standardized_download_url: string | null
  created_at: string
  finished_at: string | null
  /** One plain sentence on what happened, safe to show. Newer backends only. */
  enhancement_summary?: string | null
  enhancement_outcome?: 'enhanced' | 'partially_enhanced' | 'original_preserved' | 'failed' | null
  /** Set when the photo was faces-restored without a verified identity check. */
  identity_notice?: string
  /** What changed the pixels, in order. Empty when nothing did. Newer backends only. */
  applied_stages?: AppliedStage[]
  /** Restoration the photo called for that did not run, with the reason. */
  skipped_stages?: SkippedStage[]
  /** One sentence when restoration was needed and could not be done; null otherwise. */
  hd_unavailable_reason?: string | null
  /** Which engine produced each stage and whether a classical filter stood in for an AI model. `null` for a failed job; absent on older backends. */
  processing_summary?: ProcessingSummary | null
  /** What the analyzer measured, and the operations it chose with reasons. Shapes may grow; shown generically. */
  diagnosis?: unknown
  plan?: unknown
}

export interface AppliedStage {
  stage: string
  engine?: string | null
  variant?: string | null
  scale?: number | null
  input_size?: [number, number] | null
  output_size?: [number, number] | null
}

export interface SkippedStage {
  stage: string
  reason: string
}

/** One stage that changed the photograph: `kind` is what the engine is (a learned model, or OpenCV only), `fallback` that an engine ahead of it did not produce the result. */
export interface ProcessingStage {
  stage: string | null
  engine: string | null
  kind: 'ai' | 'classical' | 'unknown'
  fallback: boolean
  /** The engines that stood ahead of this one. Empty when `fallback` is false. */
  replaced?: string[]
}

export interface ProcessingSummary {
  /** A learned model produced at least one stage. */
  ai_applied: boolean
  /** A classical engine produced a stage because the AI model for it was unavailable or its result was refused. */
  classical_fallback: boolean
  /** In order; empty when the original was kept. */
  stages: ProcessingStage[]
}

const SETTLED = new Set<EnhancementStatus>(['completed', 'failed', 'cancelled', 'partial'])

export function isEnhancementSettled(result: EnhancementResult | null): boolean {
  return result !== null && SETTLED.has(result.status)
}

/**
 * Start enhancing one photo.
 *
 * Answers **429** when the account already has the most enhancement jobs it is
 * allowed to run at once; the message says what the limit is, and the right
 * response is to wait rather than retry immediately.
 */
export function enhanceImage(
  imageId: number,
  options: { level?: EnhancementLevel; style?: EnhancementStyle; lighting?: EnhancementLighting } = {},
): Promise<EnhancementResult> {
  return apiFetch<EnhancementResult>(`/api/enhancements/images/${imageId}/`, {
    body: {
      level: options.level ?? 'auto', style: options.style ?? 'natural',
      // Only a choice is sent: "auto" is the backend's default.
      ...(options.lighting && options.lighting !== 'auto' ? { lighting: options.lighting } : {}),
    },
  })
}

export function getEnhancementResult(
  resultId: number, signal?: AbortSignal,
): Promise<EnhancementResult> {
  return apiFetch<EnhancementResult>(`/api/enhancements/results/${resultId}/`, { signal })
}

/** The enhanced file itself. Full resolution, so only for a single view. */
export function downloadEnhanced(resultId: number, signal?: AbortSignal): Promise<Blob> {
  return apiFetchBlob(`/api/enhancements/results/${resultId}/download/`, { signal })
}

const LEVEL_LABELS: Record<EnhancementLevel, string> = {
  auto: 'Automatic',
  low: 'Light',
  medium: 'Moderate',
  high: 'Strong',
}

/**
 * How much correction was applied, in plain words.
 *
 * The backend decides the level from the photo, so this is worth showing: a
 * photo that needed almost nothing doing to it is a good photo, and saying
 * "Light" explains why the before and after look similar.
 */
export function levelLabel(level: EnhancementLevel): string {
  return LEVEL_LABELS[level] ?? level
}

/**
 * True when the backend says it ran no stage on the photo (it was already good, or the safety checks kept the original).
 * The "strength" it records is then only what was asked for, so a screen must not call it a "light correction".
 */
export function changedNothing(result: { applied_stages?: unknown[]; enhancement_outcome?: string | null } | null | undefined): boolean {
  if (!result) return false
  return result.enhancement_outcome === 'original_preserved' || (Array.isArray(result.applied_stages) && result.applied_stages.length === 0)
}


export type WatermarkMode = 'none' | 'small' | 'facecloud' | 'username' | 'custom'

export interface ShareLink {
  id: number
  state: string
  expires_at: string | null
  /** The raw token comes back **once**. Copy it immediately; it is never shown again. */
  token: string
  public_url: string
  info_url: string
}

/**
 * A public link to one enhanced photo.
 *
 * The token is returned exactly once and never again, so whatever asks for it
 * must hand it to the person there and then rather than storing it to show
 * later. Watermarked by default, because the point of the link is that anyone
 * holding it can open the image without signing in.
 */
export function createShareLink(
  resultId: number,
  options: { ttlHours?: number; watermark?: WatermarkMode } = {},
): Promise<ShareLink> {
  return apiFetch<ShareLink>('/api/shares/', {
    body: {
      result: resultId,
      ttl_hours: options.ttlHours ?? 24,
      watermark: options.watermark ?? 'facecloud',
    },
  })
}

/** A request to enhance every ready photo of a batch. */
export interface EnhancementBatchJob {
  id: number
  source_batch: number
  status: EnhancementStatus
  total_images: number
  successful_images: number
  failed_images: number
  failure_reason: string
}

/** Enhance the accepted photos of a batch (the level is chosen per photo, as for a single one). */
export function enhanceBatch(batchId: number): Promise<EnhancementBatchJob> {
  return apiFetch<EnhancementBatchJob>(`/api/enhancements/batches/${batchId}/`, { method: 'POST', body: {} })
}

export function getEnhancementBatchJob(jobId: number, signal?: AbortSignal): Promise<EnhancementBatchJob> {
  return apiFetch<EnhancementBatchJob>(`/api/enhancements/jobs/${jobId}/`, { signal })
}
