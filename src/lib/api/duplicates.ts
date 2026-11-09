import { apiFetch, ApiError } from './client'
import type { Page } from './images'

/** One suspected pair of photos. `similarity_score` is already a percentage (an exact match is 100); do not multiply it. */
export interface DuplicateMatch {
  id: number
  analysis?: number
  source_image: number
  source_filename: string
  source_image_download_url?: string
  matched_image: number
  matched_filename: string
  matched_image_download_url?: string
  /** `exact` | `perceptual` | `face_region`. Kept open: a kind this app does not know is shown as the server wrote it. */
  match_type: string
  similarity_score: number | null
  hash_distance?: number | null
  face_similarity?: number | null
  evidence?: Record<string, unknown>
  /** `suspected` | `confirmed` | `not_duplicate`. An exact (checksum) match is created already confirmed. */
  review_status: string
  reviewed_at?: string | null
  created_at?: string
  updated_at?: string
}

/** The duplicate check for one photo. `decision` summarises its matches that were not dismissed: `duplicate` (one is confirmed), `needs_review` (one is still suspected) or `no_duplicate`; it is empty until the check has finished. */
export interface DuplicateAnalysis {
  id: number
  image: number
  status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled' | string
  decision: 'no_duplicate' | 'duplicate' | 'needs_review' | '' | string
  match_count: number
  failure_reason: string
  matches_url: string
  finished_at: string | null
}

interface MaybePaged<T> { results?: T[] }

/** Photos this one looks like, in either role of the pair, dismissed ones included. Empty when none were found or the check has not run for it. */
export async function listDuplicateMatches(imageId: number, signal?: AbortSignal): Promise<DuplicateMatch[]> {
  try {
    const data = await apiFetch<DuplicateMatch[] | MaybePaged<DuplicateMatch>>(`/api/duplicates/images/${imageId}/matches/`, { signal })
    return Array.isArray(data) ? data : data.results ?? []
  } catch (caught) {
    if (caught instanceof ApiError && caught.isNotFound) return []
    throw caught
  }
}

/** The duplicate checks of the signed-in person's own photos (photos in the trash are left out), newest change first. */
export function listDuplicateResults(
  params: { status?: string; decision?: string; page?: number; pageSize?: number } = {}, signal?: AbortSignal,
): Promise<Page<DuplicateAnalysis>> {
  const query = new URLSearchParams({ page: String(params.page ?? 1), page_size: String(params.pageSize ?? 20) })
  if (params.status) query.set('status', params.status)
  if (params.decision) query.set('decision', params.decision)
  return apiFetch<Page<DuplicateAnalysis>>(`/api/duplicates/results/?${query}`, { signal })
}

export const getDuplicateMatch = (id: number, signal?: AbortSignal) => apiFetch<DuplicateMatch>(`/api/duplicates/matches/${id}/`, { signal })

/**
 * Decide a match. Both answers can be changed later by deciding again. An exact (checksum) match cannot be dismissed: the
 * server answers 400 "An exact checksum match cannot be dismissed.", so offer only "Same photo" for those.
 */
export const reviewDuplicateMatch = (id: number, reviewStatus: 'confirmed' | 'not_duplicate') =>
  apiFetch<DuplicateMatch>(`/api/duplicates/matches/${id}/review/`, { method: 'PATCH', body: { review_status: reviewStatus } })

/* ------------------------------------------------------------------ the list of matches */

/**
 * One page of the person's matches, newest first (`GET /api/duplicates/matches/`): the pairs to decide on and the ones already decided, dismissed ones
 * included; a pair with a photo in the trash is left out. Filters: `review_status` (suspected | confirmed | not_duplicate), `match_type`
 * (exact | perceptual | face_region) and `image` (either side). A request with no page parameter is answered as a plain array, so a page size is always sent.
 */
export function listDuplicateMatchPage(
  params: { reviewStatus?: string; matchType?: string; image?: number; page?: number; pageSize?: number } = {}, signal?: AbortSignal,
): Promise<Page<DuplicateMatch>> {
  const query = new URLSearchParams({ page: String(params.page ?? 1), page_size: String(params.pageSize ?? 100) })
  if (params.reviewStatus) query.set('review_status', params.reviewStatus)
  if (params.matchType) query.set('match_type', params.matchType)
  if (params.image !== undefined) query.set('image', String(params.image))
  return apiFetch<Page<DuplicateMatch>>(`/api/duplicates/matches/?${query}`, { signal })
}

/** More pages than this would be 10,000 matches; stop rather than loop for ever on an answer that never ends. */
const MAX_PAGES = 100

/** Every match with one decision, newest first, read 100 at a time. */
export async function loadMatches(reviewStatus: string, signal?: AbortSignal): Promise<DuplicateMatch[]> {
  const matches: DuplicateMatch[] = []
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const data = await listDuplicateMatchPage({ reviewStatus, page, pageSize: 100 }, signal)
    matches.push(...data.results)
    if (!data.next) break
  }
  return matches
}

/** How many matches carry each decision (one small request each: only the count is read). */
export async function countMatchesByDecision(signal?: AbortSignal): Promise<Record<'suspected' | 'confirmed' | 'not_duplicate', number>> {
  const [suspected, confirmed, notDuplicate] = await Promise.all(
    ['suspected', 'confirmed', 'not_duplicate'].map(reviewStatus => listDuplicateMatchPage({ reviewStatus, pageSize: 1 }, signal)),
  )
  return { suspected: suspected.count, confirmed: confirmed.count, not_duplicate: notDuplicate.count }
}
