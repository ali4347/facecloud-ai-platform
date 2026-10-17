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

export function listActivity(page = 1, signal?: AbortSignal): Promise<ActivityPage> {
  return apiFetch<ActivityPage>(`/api/user/activity/?page=${page}`, { signal })
}
