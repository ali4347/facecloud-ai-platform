import { apiFetch, apiFetchBlob } from './client'

export type EnhancementLevel = 'auto' | 'low' | 'medium' | 'high'
export type EnhancementStyle = 'natural' | 'dynamic' | 'ai_max'

export type EnhancementStatus =
  | 'pending' | 'queued' | 'processing' | 'completed' | 'partial' | 'failed' | 'cancelled'

export interface EnhancementResult {
  id: number
  image: number
  requested_level: EnhancementLevel
  /** May differ from what was asked for: the backend adapts to the photo. */
  applied_level: EnhancementLevel
  requested_style: EnhancementStyle
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
  options: { level?: EnhancementLevel; style?: EnhancementStyle } = {},
): Promise<EnhancementResult> {
  return apiFetch<EnhancementResult>(`/api/enhancements/images/${imageId}/`, {
    body: { level: options.level ?? 'auto', style: options.style ?? 'natural' },
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
