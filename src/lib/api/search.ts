import { apiFetch } from './client'
import type { Album, Place } from './library'

export interface SearchImage { id: number; name: string; thumbnail_url: string | null; status: string; created_at: string }
export interface SearchGroup { id: number; display_name: string; member_count: number }
export interface SearchJob { id: number; display_name: string; status: string; total_files: number; created_at: string }

/** A person folder as a chip: its name, how many photos, and a face to draw (`avatar_url` is protected: fetch it with the token). */
export interface PersonChip { id: number; display_name: string; is_named: boolean; photo_count: number; avatar_url: string | null }

export interface SearchResults {
  query: string
  images: SearchImage[]
  groups: SearchGroup[]
  jobs: SearchJob[]
  /** The kinds below come from newer backends. */
  people?: PersonChip[]
  albums?: Album[]
  places?: Place[]
}

/** Only the caller's own photos, person folders and uploads. The backend wants at least two characters. */
export function searchEverything(query: string, limit = 5, signal?: AbortSignal): Promise<SearchResults> {
  return apiFetch<SearchResults>(`/api/search/?q=${encodeURIComponent(query)}&limit=${limit}`, { signal })
}

export const SEARCH_MIN_LENGTH = 2
