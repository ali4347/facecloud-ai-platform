import { ApiError, apiFetch, apiFetchBlob } from './client'
import type { Page } from './images'
import { pathOf } from './library'

/* ----------------------------------------------------- comparing the styles */

/** The ways a photo can be enhanced side by side: a plain OpenCV baseline, and the three styles. */
export type CompareProfile = 'opencv_baseline' | 'natural' | 'dynamic' | 'ai_max'

export interface ComparisonOutput {
  profile: string
  label: string
  description: string
  outcome: string
  preview_url: string | null
  algorithm: string
  overall_score: number | null
  faces_detected: number | null
  identity_status: string | null
  identity_notice: string
  warnings: unknown
  processing_duration_ms: number
  failure_reason: string
}

export interface ModelComparison {
  id: number
  image: number
  requested_level: string
  profiles: unknown
  status: string
  recommended_profile: string
  recommendation_reason: string
  total_duration_ms: number
  failure_reason: string
  created_at: string
  finished_at: string | null
  outputs: ComparisonOutput[]
  report_url: string | null
}

export const startComparison = (imageId: number, level: string, profiles: CompareProfile[]) =>
  apiFetch<ModelComparison>(`/api/enhancements/images/${imageId}/compare/`, { body: { level, profiles } })
export const getComparison = (id: number, signal?: AbortSignal) => apiFetch<ModelComparison>(`/api/enhancements/comparisons/${id}/`, { signal })
export const listComparisons = (page = 1, signal?: AbortSignal) => apiFetch<Page<ModelComparison>>(`/api/enhancements/comparisons/?page=${page}&page_size=20`, { signal })
export const deleteComparison = (id: number) => apiFetch<void>(`/api/enhancements/comparisons/${id}/`, { method: 'DELETE' })
export const comparisonReport = (id: number) => apiFetchBlob(`/api/enhancements/comparisons/${id}/report/`)
export const comparisonPreview = (output: ComparisonOutput, signal?: AbortSignal) => apiFetchBlob(pathOf(output.preview_url ?? ''), { signal })
export const isComparisonSettled = (comparison: ModelComparison) => ['completed', 'failed', 'cancelled'].includes(comparison.status)

/* ----------------------------------------------------- duplicates, re-checks */

/** Look for duplicates of a photo again (`force`: even when it was checked before). */
export const findDuplicates = (imageId: number, force = true) => apiFetch<unknown>(`/api/duplicates/images/${imageId}/`, { body: { force } })

/** Run the checks on a photo again, from the start. This is what a person asks for after, say, a model was fixed. */
export const rerunChecks = (imageId: number) => apiFetch<unknown>(`/api/images/${imageId}/preprocess/`, { body: { force: true } })

/* ------------------------------------------------ the optional AI advisor */

export type AdvisorIntent = 'auto' | 'preserve' | 'brighten'

export interface AdvisorConfiguration {
  available: boolean
  unavailable_reason: string | null
  provider: string
  model: string | null
  policy_version: string
  consent: { granted?: boolean; policy_version?: string | null; [key: string]: unknown }
  disclosure: { what_is_sent: string; what_is_not_sent: string[]; purpose: string; provider: string; retention: string; separate_from: string }
  intents: AdvisorIntent[]
  cost_note?: string
}

export interface AdvisorRecommendation {
  id: number
  enhancement_result: number
  intent: string
  status: string
  origin: string
  /** `apply`, `no_change` or `manual_review`. */
  action: string
  adjustments: Record<string, number> | null
  rationale: string
  caution_flags: string[] | null
  fallback_reason: string
  failure_reason: string
  usable: boolean
  unusable_reason: string
}

export const getAdvisorConfiguration = (signal?: AbortSignal) => apiFetch<AdvisorConfiguration>('/api/enhancements/advisor/configuration/', { signal })
export const setAdvisorConsent = (granted: boolean, policyVersion: string) => apiFetch<unknown>('/api/enhancements/advisor/consent/', { body: { granted, policy_version: policyVersion } })
export const askAdvisor = (resultId: number, intent: AdvisorIntent) => apiFetch<AdvisorRecommendation>(`/api/enhancements/results/${resultId}/advisor/`, { body: { intent } })
export const getRecommendation = (id: number, signal?: AbortSignal) => apiFetch<AdvisorRecommendation>(`/api/enhancements/advisor/recommendations/${id}/`, { signal })
export const cancelRecommendation = (id: number) => apiFetch<AdvisorRecommendation>(`/api/enhancements/advisor/recommendations/${id}/cancel/`, { body: {} })
/** Applying creates an ordinary edit version of the photo; the original is never overwritten. */
export const applyRecommendation = (id: number) => apiFetch<unknown>(`/api/enhancements/advisor/recommendations/${id}/apply/`, { body: {} })
export const isRecommendationDone = (r: AdvisorRecommendation) => ['completed', 'failed', 'cancelled', 'expired'].includes(r.status)

/** True for the server's "the advisor is not switched on" answer. */
export const isAdvisorUnavailable = (caught: unknown) => caught instanceof ApiError && caught.status === 503
