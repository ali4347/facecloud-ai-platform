import { ApiError, apiFetch } from './client'
import type { ImageListItem, Page } from './images'

function query(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== '') q.set(key, String(value))
  const text = q.toString()
  return text ? `?${text}` : ''
}

/* ------------------------------------------------------------------ events */

export interface PhotoEvent {
  id: number
  start: string
  end: string
  photo_count: number
  cover_image_id: number
  cover_download_url: string
  cover_thumbnail_url: string
}
export interface EventPhoto {
  id: number
  original_name: string
  width: number | null
  height: number | null
  created_at: string
  download_url: string
  thumbnail_url: string
}
/** `gapHours` is how long a silence starts a new event; send the same value on every call, because event ids depend on it. */
export const listEvents = (gapHours?: number, signal?: AbortSignal) => apiFetch<PhotoEvent[] | Page<PhotoEvent>>(`/api/events/${query({ gap_hours: gapHours })}`, { signal })
export const getEvent = (id: number, gapHours?: number, signal?: AbortSignal) => apiFetch<PhotoEvent>(`/api/events/${id}/${query({ gap_hours: gapHours })}`, { signal })
export const listEventPhotos = (id: number, page: number, gapHours?: number, signal?: AbortSignal) =>
  apiFetch<Page<EventPhoto>>(`/api/events/${id}/photos/${query({ gap_hours: gapHours, page, page_size: 48 })}`, { signal })

/* ---------------------------------------------------------------- memories */

export interface MemoryCard {
  id: string
  /** `on_this_day`, `event` or `person`. */
  kind: string
  title: string
  subtitle: string
  start: string | null
  end: string | null
  photo_count: number
  cover_thumbnail_url: string | null
  preview_thumbnail_urls: string[]
  /** What to ask the photo list for to see every photo of the moment: `taken_from` / `taken_to` dates, or `person`. */
  filter: Record<string, string | number | number[]>
}
export interface Memory extends MemoryCard { images: ImageListItem[] }
export const listMemories = (limit = 12, signal?: AbortSignal) => apiFetch<MemoryCard[]>(`/api/memories/${query({ limit })}`, { signal })
export const getMemory = (id: string, signal?: AbortSignal) => apiFetch<Memory>(`/api/memories/${encodeURIComponent(id)}/`, { signal })

/** The address of the photo list for a memory's `filter`, so "see all of them" opens My Images already narrowed. */
export function photosLinkFor(filter: MemoryCard['filter']): string {
  const q = new URLSearchParams()
  for (const [key, value] of Object.entries(filter ?? {})) {
    if (key === 'taken_from' || key === 'taken_to') q.set(key, String(value))
    else if (key === 'person') for (const id of Array.isArray(value) ? value : [value]) q.append('person', String(id))
  }
  const text = q.toString()
  return `/dashboard/images${text ? `?${text}` : ''}`
}

/* ------------------------------------------------------------------ search */

export interface SemanticSearchResponse {
  /** False when the server has the feature off: show nothing for it. */
  enabled: boolean
  query: string
  results: { score: number; photo: ImageListItem }[]
}
/** "Photos that look like this" (English words only). `unavailable` is the server saying the feature is on but cannot run right now. */
export async function semanticSearch(text: string, limit = 24, signal?: AbortSignal): Promise<SemanticSearchResponse & { unavailable?: boolean }> {
  try {
    return await apiFetch<SemanticSearchResponse>(`/api/search/photos/${query({ q: text, limit })}`, { signal })
  } catch (caught) {
    if (caught instanceof ApiError && caught.status === 503) return { enabled: true, query: text, results: [], unavailable: true }
    throw caught
  }
}

export interface FaceMatch {
  group_id: number
  display_name: string
  /** 0 to 1. */
  similarity: number
  photo_count: number
  photos: { id: number; original_name: string; thumbnail_url: string | null; download_url: string | null }[]
}
export interface FaceSearchResult {
  /** False: no face was found in the photo that was sent. True with no matches: a face, but nobody in the library looks like it. */
  faces_detected: boolean
  matches: FaceMatch[]
}
/** The photo sent here (and its face) is never stored. It needs the person's face-processing consent. */
export function faceSearch(file: File, signal?: AbortSignal): Promise<FaceSearchResult> {
  const formData = new FormData()
  formData.append('query_image', file)
  return apiFetch<FaceSearchResult>('/api/identities/search/', { formData, signal })
}
/** True when the server refused because the person has not agreed to face processing yet. */
export function isConsentRequired(caught: unknown): boolean {
  return caught instanceof ApiError && Boolean(caught.body) && typeof caught.body === 'object' && (caught.body as { code?: string }).code === 'consent_required'
}
