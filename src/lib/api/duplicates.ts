import { apiFetch, ApiError } from './client'

export interface DuplicateMatch {
  id: number
  matched_image: number
  matched_filename: string
  match_type: string
  similarity_score: number | null
  review_status: string
}

interface MaybePaged<T> { results?: T[] }

/** Photos this one looks like. Empty when none were found or the check has not run for it. */
export async function listDuplicateMatches(imageId: number, signal?: AbortSignal): Promise<DuplicateMatch[]> {
  try {
    const data = await apiFetch<DuplicateMatch[] | MaybePaged<DuplicateMatch>>(`/api/duplicates/images/${imageId}/matches/`, { signal })
    return Array.isArray(data) ? data : data.results ?? []
  } catch (caught) {
    if (caught instanceof ApiError && caught.isNotFound) return []
    throw caught
  }
}
