import { apiFetch, apiFetchBlob } from './client'
import type { Page } from './images'

/**
 * Ask the backend to look at one photo's faces and file it under a Person Folder.
 *
 * The work is queued (the answer is 202 and carries no result); the folders change
 * when it finishes. It refuses with a plain 400 when the person has not agreed to
 * face grouping, and answers 404 for a photo that is not theirs or was rejected.
 */
export function requestIdentityAnalysis(imageId: number, force = false): Promise<unknown> {
  return apiFetch(`/api/identities/images/${imageId}/`, { method: 'POST', body: { force } })
}

/* ── Person Folders ─────────────────────────────────────────────────────── */

export interface CoverImage {
  id: number
  /** Protected: fetch the bytes with `getImageThumbnail(id)`, not as an <img src>. */
  thumbnail_url: string
}

export interface IdentityGroup {
  id: number
  display_name: string
  state: 'active' | 'merged' | 'archived'
  member_count: number
  /** Faces waiting for a decision: listed with the folder's photos, not counted in member_count. Missing on an older backend. */
  suggested_count?: number
  preview_image: number | null
  /** Up to four distinct photos of the folder. */
  cover_images: CoverImage[]
  /** Average match confidence as a percentage (0-100); null when none is recorded. */
  matching_confidence: number | null
  created_at: string
  updated_at: string
}

export interface IdentityGroupImage {
  id: number
  original_name: string
  thumbnail_url: string | null
  file_size: number
  width: number | null
  height: number | null
  display_status: string
  matching_confidence: number | null
  /** 'needs_review' while the match is only a suggestion; such a photo is shown in the folder but not counted in it. */
  membership_state?: string | null
  /** The face that puts this photo in this folder: what moving it, taking it out and making it the cover act on. */
  membership_id?: number | null
}

export type ExportStatus = 'queued' | 'generating' | 'ready' | 'failed' | 'expired'

export interface IdentityGroupExport {
  id: number
  group: number
  status: ExportStatus
  progress_percentage: number
  display_name: string
  file_size: number
  failure_reason: string
  expires_at: string | null
  created_at: string
}

/** A folder ZIP's public link. The token inside `public_url` is returned only once, here. */
export interface FolderShareLink {
  id: number
  public_url: string
  expires_at: string
}

export function listIdentityGroups(signal?: AbortSignal): Promise<IdentityGroup[]> {
  return apiFetch<IdentityGroup[]>('/api/identities/groups/', { signal })
}

export function getIdentityGroup(groupId: number, signal?: AbortSignal): Promise<IdentityGroup> {
  return apiFetch<IdentityGroup>(`/api/identities/groups/${groupId}/`, { signal })
}

export function listGroupImages(
  groupId: number, page = 1, signal?: AbortSignal,
): Promise<Page<IdentityGroupImage>> {
  return apiFetch<Page<IdentityGroupImage>>(`/api/identities/groups/${groupId}/images/?page=${page}`, { signal })
}

/** Move every photo of `sourceId` into `targetId`; the source folder is retired. Cannot be undone from the app. */
export function mergeIdentityGroups(targetId: number, sourceId: number): Promise<unknown> {
  return apiFetch(`/api/identities/groups/${targetId}/merge/`, { method: 'POST', body: { source_group_id: sourceId } })
}

export function renameIdentityGroup(groupId: number, displayName: string): Promise<IdentityGroup> {
  return apiFetch<IdentityGroup>(`/api/identities/groups/${groupId}/rename/`, {
    method: 'PATCH', body: { display_name: displayName },
  })
}

/**
 * Ask for a ZIP of the folder: all of it, or only `imageIds` (a subset of its members).
 * The same request again answers with the ZIP already made, so this is safe to repeat.
 */
export async function createGroupExport(groupId: number, imageIds?: number[]): Promise<IdentityGroupExport> {
  const body = imageIds && imageIds.length > 0 ? { image_ids: imageIds } : {}
  const data = await apiFetch<{ created: boolean; export: IdentityGroupExport }>(
    `/api/identities/groups/${groupId}/exports/`, { method: 'POST', body },
  )
  return data.export
}

export function getIdentityExport(exportId: number, signal?: AbortSignal): Promise<IdentityGroupExport> {
  return apiFetch<IdentityGroupExport>(`/api/identities/exports/${exportId}/`, { signal })
}

/** The finished ZIP. Answers 409 while it is still being made and 410 once it has expired. */
export function downloadIdentityExport(exportId: number): Promise<Blob> {
  return apiFetchBlob(`/api/identities/exports/${exportId}/download/`)
}

/** A time-limited public link to a finished ZIP. Only a finished, unexpired ZIP can be shared. */
export function shareIdentityExport(exportId: number, ttlHours?: number): Promise<FolderShareLink> {
  return apiFetch<FolderShareLink>(`/api/identities/exports/${exportId}/share/`, {
    method: 'POST', body: ttlHours ? { ttl_hours: ttlHours } : {},
  })
}

/* ── Moving faces, covers, suggestions and history ─────────────────────── */

/** Move one face to another folder. Moving a folder's last photo deletes that folder. */
export function moveMembership(membershipId: number, targetGroupId: number, reason = ''): Promise<unknown> {
  return apiFetch(`/api/identities/memberships/${membershipId}/move/`, { method: 'PATCH', body: { target_group_id: targetGroupId, ...(reason ? { reason } : {}) } })
}

/** Take one face out of its folder (the photo stays in the library). Taking out a folder's last photo deletes the folder. */
export function removeMembership(membershipId: number, reason = ''): Promise<unknown> {
  return apiFetch(`/api/identities/memberships/${membershipId}/remove/`, { method: 'PATCH', body: reason ? { reason } : {} })
}

/** Make this face the folder's cover. */
export function setFolderCover(groupId: number, membershipId: number): Promise<unknown> {
  return apiFetch(`/api/identities/groups/${groupId}/profile/`, { method: 'PATCH', body: { membership_id: membershipId } })
}

/** Delete a folder that still has photos: they stay in the library, in no folder. */
export function dissolveFolder(groupId: number, reason = ''): Promise<void> {
  return apiFetch<void>(`/api/identities/groups/${groupId}/delete/`, { method: 'DELETE', body: { dissolve: true, ...(reason ? { reason } : {}) } })
}

export interface FolderRef { id: number; display_name: string; member_count: number }

/** Two folders that may be the same person. Nothing is merged for the person: they choose. `source` is the one that would go away. */
export interface SuggestedMerge {
  source_group: number
  target_group: number
  /** 0 to 1. */
  similarity: number
  source: FolderRef
  target: FolderRef
}
export function listSuggestedMerges(signal?: AbortSignal): Promise<SuggestedMerge[]> {
  return apiFetch<SuggestedMerge[]>('/api/identities/groups/suggested-merges/', { signal })
}

export type IdentityChangeAction = 'renamed' | 'merged' | 'moved' | 'removed' | 'profile_set' | 'deleted' | 'reviewed' | 'archived'
export interface IdentityChange {
  id: number
  action: IdentityChangeAction
  group: number | null
  membership: number | null
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  reason: string
  created_at: string
}
export function listIdentityHistory(page = 1, signal?: AbortSignal): Promise<Page<IdentityChange>> {
  return apiFetch<Page<IdentityChange>>(`/api/identities/history/?page=${page}&page_size=30`, { signal })
}
