import { apiFetch } from './client'

export interface SearchImage { id: number; name: string; thumbnail_url: string | null; status: string; created_at: string }
export interface SearchGroup { id: number; display_name: string; member_count: number }
export interface SearchJob { id: number; display_name: string; status: string; total_files: number; created_at: string }

export interface SearchResults {
  query: string
  images: SearchImage[]
  groups: SearchGroup[]
  jobs: SearchJob[]
}

/** Only the caller's own photos, person folders and uploads. The backend wants at least two characters. */
export function searchEverything(query: string, limit = 5, signal?: AbortSignal): Promise<SearchResults> {
  return apiFetch<SearchResults>(`/api/search/?q=${encodeURIComponent(query)}&limit=${limit}`, { signal })
}

export const SEARCH_MIN_LENGTH = 2
