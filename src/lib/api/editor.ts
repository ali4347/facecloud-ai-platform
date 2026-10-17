import { apiFetch, apiFetchBlob } from './client'
import type { EnhancementStatus } from './enhancements'

/** One slider as the backend describes it. */
export interface EditorControl {
  label: string
  minimum: number
  maximum: number
  step: number
  neutral: number
  recommended_minimum: number
  recommended_maximum: number
  description: string
  /** A model-backed slider (low light, noise, deblur, face restoration). */
  model_backed: boolean
  /** False when the model it needs is not installed, so it would do nothing. */
  available: boolean
}

export interface EditorConfiguration {
  controls: Record<string, EditorControl>
  neutral_settings: Record<string, number>
  intents: string[]
  preview: { default_edge: number; max_edge: number }
}

export type EditorSettings = Record<string, number>
export type EditIntent = 'auto' | 'brighten' | 'preserve'

export function getEditorConfiguration(signal?: AbortSignal): Promise<EditorConfiguration> {
  return apiFetch<EditorConfiguration>('/api/enhancements/editor/configuration/', { signal })
}

export interface EditPreview {
  id: number
  revision: number
  source_version: string
  mode: 'auto' | 'manual'
  requested_adjustments: EditorSettings
  /** What was really applied; for Auto this is what to put the sliders on. */
  applied_adjustments: EditorSettings
  image_url: string
  width: number
  height: number
  is_latest: boolean
  latest_revision: number
}

/**
 * Render a bounded preview of an edit. `revision` must increase with every request:
 * an answer to an older one never replaces a newer preview.
 */
export function createPreview(
  resultId: number,
  body: { revision: number; mode: 'auto' | 'manual'; adjustments?: EditorSettings; intent?: EditIntent; source_version?: string },
  signal?: AbortSignal,
): Promise<EditPreview> {
  return apiFetch<EditPreview>(`/api/enhancements/results/${resultId}/previews/`, { body, signal })
}

/** A preview's own picture, behind the token. */
export function fetchPreviewImage(previewId: number, signal?: AbortSignal): Promise<Blob> {
  return apiFetchBlob(`/api/enhancements/previews/${previewId}/image/`, { signal })
}

export interface EditVersion {
  id: number
  enhancement_result: number
  mode: 'auto' | 'manual'
  requested_adjustments: EditorSettings
  applied_adjustments: EditorSettings
  status: EnhancementStatus
  output_width: number | null
  output_height: number | null
  failure_reason: string
  is_current: boolean
  download_url: string | null
  created_at: string
}

/** Save a preview at full resolution as a new version. The enhanced photo itself is never changed. */
export function savePreview(previewId: number): Promise<EditVersion> {
  return apiFetch<EditVersion>(`/api/enhancements/previews/${previewId}/save/`, { method: 'POST', body: {} })
}

export function getEdit(editId: number, signal?: AbortSignal): Promise<EditVersion> {
  return apiFetch<EditVersion>(`/api/enhancements/edits/${editId}/`, { signal })
}

export function listEdits(resultId: number, signal?: AbortSignal): Promise<EditVersion[]> {
  return apiFetch<EditVersion[]>(`/api/enhancements/results/${resultId}/edits/`, { signal })
}

export function activateEdit(editId: number): Promise<EditVersion> {
  return apiFetch<EditVersion>(`/api/enhancements/edits/${editId}/activate/`, { method: 'POST', body: {} })
}

export function deleteEdit(editId: number): Promise<void> {
  return apiFetch<void>(`/api/enhancements/edits/${editId}/`, { method: 'DELETE' })
}

export function downloadEdit(editId: number, signal?: AbortSignal): Promise<Blob> {
  return apiFetchBlob(`/api/enhancements/edits/${editId}/download/`, { signal })
}
