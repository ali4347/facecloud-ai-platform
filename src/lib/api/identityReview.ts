import { apiFetch } from './client'

/** One photo the grouping was not sure about: the folder it suggests, and how close the match was. */
export interface ReviewItem {
  id: number
  /** The photo this face is in. */
  image: number
  face_index: number
  /** The folder the grouping suggests, if any. */
  identity_group: number | null
  /** 0 to 1; null when there is none. */
  similarity_score: number | null
  state: string
  created_at: string
}

interface MaybePaged<T> { results?: T[] }

/** The review list is a plain array unless it is paged; accept both. */
export async function listReviewItems(signal?: AbortSignal): Promise<ReviewItem[]> {
  const data = await apiFetch<ReviewItem[] | MaybePaged<ReviewItem>>('/api/identities/review/', { signal })
  return Array.isArray(data) ? data : data.results ?? []
}

export type ReviewDecision =
  | { action: 'confirm' }
  | { action: 'select_group'; group_id: number }
  | { action: 'new_group' }
  | { action: 'reject' }

/** Settle one uncertain assignment. `confirm` accepts the suggestion, `reject` says it is not a match. */
export function reviewAssignment(id: number, decision: ReviewDecision): Promise<unknown> {
  return apiFetch(`/api/identities/assignments/${id}/review/`, { method: 'PATCH', body: decision })
}

/** Delete a folder that has no photos left. The backend refuses a folder that still has any. */
export function deleteEmptyFolder(groupId: number): Promise<void> {
  return apiFetch<void>(`/api/identities/groups/${groupId}/delete/`, { method: 'DELETE' })
}
