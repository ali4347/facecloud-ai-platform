import { API_URL } from './config'
import { ApiError, apiFetch, apiFetchBlob } from './client'
import type { ImageListItem, Page, PlaceBrief } from './images'

/** The address of a protected file as the API gives it (absolute), as the path the client wants. */
export function pathOf(url: string): string {
  try {
    const parsed = new URL(url, API_URL || undefined)
    return `${parsed.pathname}${parsed.search}`
  } catch {
    return url
  }
}

/** A list that may be paged (an envelope) or plain (an array): the same rows either way. */
export function rowsOf<T>(data: Page<T> | T[] | null | undefined): T[] {
  if (!data) return []
  return Array.isArray(data) ? data : data.results ?? []
}

function query(params: Record<string, string | number | boolean | undefined>): string {
  const q = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== '' && value !== false) q.set(key, String(value))
  const text = q.toString()
  return text ? `?${text}` : ''
}

/* ------------------------------------------------------------------ places */

export interface Place extends PlaceBrief {
  photo_count: number
  cover_thumbnail_url: string | null
  /** The place's own centre, not any photo's position. */
  latitude: number
  longitude: number
}
export const getPlace = (id: number, signal?: AbortSignal) => apiFetch<Place>(`/api/places/${id}/`, { signal })

/* ------------------------------------------------------------------ albums */

export interface Album {
  id: number
  title: string
  description: string
  photo_count: number
  cover_image: number | null
  cover_thumbnail_url: string | null
  created_at: string
  updated_at: string
}

export function listAlbums(params: { q?: string; image?: number; page?: number; pageSize?: number } = {}, signal?: AbortSignal): Promise<Page<Album>> {
  return apiFetch<Page<Album>>(`/api/albums/${query({ q: params.q, image: params.image, page: params.page, page_size: params.pageSize })}`, { signal })
}
export const getAlbum = (id: number, signal?: AbortSignal) => apiFetch<Album>(`/api/albums/${id}/`, { signal })
export const createAlbum = (input: { title: string; description?: string; imageIds?: number[] }) =>
  apiFetch<Album & { added_ids?: number[]; not_found_ids?: number[] }>('/api/albums/', {
    body: { title: input.title, description: input.description ?? '', ...(input.imageIds?.length ? { image_ids: input.imageIds } : {}) },
  })
export const updateAlbum = (id: number, input: { title?: string; description?: string }) => apiFetch<Album>(`/api/albums/${id}/`, { method: 'PATCH', body: input })
export const deleteAlbum = (id: number) => apiFetch<void>(`/api/albums/${id}/`, { method: 'DELETE' })
export const listAlbumImages = (id: number, page = 1, signal?: AbortSignal) =>
  apiFetch<Page<ImageListItem> | ImageListItem[]>(`/api/albums/${id}/images/${query({ page, page_size: 48 })}`, { signal })
export const addToAlbum = (id: number, imageIds: number[]) =>
  apiFetch<{ added_ids: number[]; already_in_album_ids: number[]; not_found_ids: number[]; photo_count: number }>(`/api/albums/${id}/images/`, { body: { image_ids: imageIds } })
export const removeFromAlbum = (id: number, imageIds: number[]) =>
  apiFetch<{ removed_ids: number[]; not_in_album_ids: number[]; photo_count: number }>(`/api/albums/${id}/images/remove/`, { body: { image_ids: imageIds } })
export const setAlbumCover = (id: number, imageId: number) => apiFetch<Album>(`/api/albums/${id}/cover/`, { method: 'PUT', body: { image_id: imageId } })
export const clearAlbumCover = (id: number) => apiFetch<Album>(`/api/albums/${id}/cover/`, { method: 'DELETE' })

/* -------------------------------------------------------------- favourites */

export interface FavoriteResult { id: number; is_favorite: boolean; favorited_at: string | null }
export const setFavorite = (id: number, on: boolean) => apiFetch<FavoriteResult>(`/api/images/${id}/favorite/`, { method: on ? 'PUT' : 'DELETE', ...(on ? { body: {} } : {}) })
export const setFavorites = (imageIds: number[], favorite: boolean) =>
  apiFetch<{ favorite: boolean; updated_ids: number[]; not_found_ids: number[] }>('/api/images/favorites/', { body: { image_ids: imageIds, favorite } })

/* ------------------------------------------------------------------- trash */

export interface TrashItem {
  id: number
  original_name: string
  file_extension: string
  mime_type: string
  file_size: number
  width: number | null
  height: number | null
  thumbnail_url: string | null
  is_favorite: boolean
  taken_at: string | null
  created_at: string
  trashed_at: string
  purge_at: string
  days_left: number
}

export interface TrashMoveResult {
  trashed_ids: number[]
  /** `still_processing`: try again in a moment. `in_review`: a moderator has not decided it yet. */
  skipped: { id: number; reason: string }[]
  not_found_ids: number[]
  retention_days: number
}

export const moveToTrash = (imageIds: number[]) => apiFetch<TrashMoveResult>('/api/images/trash/', { body: { image_ids: imageIds } })
export const listTrash = (params: { search?: string; page?: number } = {}, signal?: AbortSignal) =>
  apiFetch<Page<TrashItem>>(`/api/images/trash/${query({ search: params.search, page: params.page, page_size: 48 })}`, { signal })
export const restoreFromTrash = (imageIds: number[]) =>
  apiFetch<{ restored_ids: number[]; not_found_ids: number[]; folders_restored: number }>('/api/images/trash/restore/', { body: { image_ids: imageIds } })
export const deleteFromTrash = (id: number) => apiFetch<void>(`/api/images/trash/${id}/`, { method: 'DELETE' })
/** Empties the trash; the server takes 500 a call, so this asks again while some remain. Returns how many were deleted. */
export async function emptyTrash(): Promise<number> {
  let deleted = 0
  for (let round = 0; round < 40; round += 1) {
    const result = await apiFetch<{ deleted: number; remaining: number }>('/api/images/trash/empty/', { body: { confirm: true } })
    deleted += result.deleted
    if (result.remaining <= 0 || result.deleted === 0) break
  }
  return deleted
}
/** A trashed photo's thumbnail, the address its row carries (the ordinary one answers 404 while it is in the trash). */
export const trashThumbnail = (item: TrashItem, signal?: AbortSignal) => apiFetchBlob(pathOf(item.thumbnail_url ?? `/api/images/trash/${item.id}/thumbnail/`), { signal })
/** Permanent and immediate, for several photos at once (the trash's own "Delete forever" is one at a time). */
export const deleteForever = (imageIds: number[]) =>
  apiFetch<{ deleted_ids: number[]; not_found_ids: number[] }>('/api/images/bulk-delete/', { body: { image_ids: imageIds } })

/* ---------------------------------------------------------------- location */

export interface PhotoLocation { latitude: number; longitude: number; place: PlaceBrief | null }
/** Where a photo was taken; null when it has no location (the server answers 404). */
export async function getLocation(imageId: number, signal?: AbortSignal): Promise<PhotoLocation | null> {
  try {
    return await apiFetch<PhotoLocation>(`/api/images/${imageId}/location/`, { signal })
  } catch (caught) {
    if (caught instanceof ApiError && caught.status === 404) return null
    throw caught
  }
}
export const removeLocation = (imageId: number) => apiFetch<void>(`/api/images/${imageId}/location/`, { method: 'DELETE' })
export const removeLocations = (imageIds: number[]) =>
  apiFetch<{ removed_ids: number[]; without_location_ids: number[]; not_found_ids: number[] }>('/api/images/location/remove/', { body: { image_ids: imageIds } })
