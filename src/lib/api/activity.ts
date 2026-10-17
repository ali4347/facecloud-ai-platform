import { apiFetch } from './client'

export type ActivityType =
  | 'upload' | 'enhance' | 'validate' | 'download' | 'live' | 'group' | 'reject' | 'login' | 'email'
export type ActivityStatus = 'success' | 'warning' | 'error' | 'info'

export interface ActivityEntry {
  id: string
  type: ActivityType
  message: string
  timestamp: string
  status: ActivityStatus
}

/** This endpoint pages with `has_next` rather than a total. */
export interface ActivityPage {
  page: number
  page_size: number
  has_next: boolean
  results: ActivityEntry[]
}

export function listActivity(page = 1, signal?: AbortSignal, pageSize?: number): Promise<ActivityPage> {
  const size = pageSize ? `&page_size=${pageSize}` : ''
  return apiFetch<ActivityPage>(`/api/user/activity/?page=${page}${size}`, { signal })
}

/** How far back the backend merges events (it stops at 500 combined events). */
export const ACTIVITY_WINDOW = 500

/**
 * The newest events in one list, up to the backend's window, for searching and filtering by type.
 * The backend filters by its own storage categories, which do not line up with the types shown on
 * screen, so the type filter is applied here over everything it will hand over.
 */
export async function listActivityWindow(signal?: AbortSignal): Promise<ActivityPage> {
  const perPage = 100
  const results: ActivityEntry[] = []
  let hasNext = false
  for (let page = 1; page <= ACTIVITY_WINDOW / perPage; page += 1) {
    const chunk = await listActivity(page, signal, perPage)
    results.push(...chunk.results)
    hasNext = chunk.has_next
    if (!chunk.has_next) break
  }
  return { page: 1, page_size: results.length, has_next: hasNext, results }
}
