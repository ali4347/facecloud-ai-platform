import { apiFetch, apiFetchBlob } from './client'

/**
 * The profile as the backend stores it. The optional fields only exist on a
 * backend that has the profile-details feature; `hasProfileDetails` tells the
 * two apart so the page can fall back to keeping them on the device.
 */
export interface AccountProfile {
  full_name?: string
  email: string
  organization_name?: string
  job_title?: string
  phone?: string
  country?: string
  /** Authenticated path of the picture (changes when it is replaced), or null. */
  avatar_url?: string | null
}

export function hasProfileDetails(p: AccountProfile | null): boolean {
  return !!p && 'organization_name' in p
}

export function loadAccountProfile(signal?: AbortSignal): Promise<AccountProfile> {
  return apiFetch<AccountProfile>('/api/user/profile/', { signal })
}

export function saveAccountProfile(patch: Partial<Omit<AccountProfile, 'email' | 'avatar_url'>>): Promise<AccountProfile> {
  return apiFetch<AccountProfile>('/api/user/profile/', { method: 'PATCH', body: patch })
}

export function uploadAvatar(file: Blob): Promise<AccountProfile> {
  const form = new FormData()
  form.append('avatar', file, 'avatar.png')
  return apiFetch<AccountProfile>('/api/user/avatar/', { method: 'PUT', formData: form })
}

export function deleteAvatar(): Promise<void> {
  return apiFetch<void>('/api/user/avatar/', { method: 'DELETE' })
}

export function fetchAvatarBlob(): Promise<Blob> {
  return apiFetchBlob('/api/user/avatar/')
}

/** One signed-in device. */
export interface UserSession {
  id: string
  device: string
  ip_address: string | null
  created_at: string
  last_seen_at: string
  is_current: boolean
}

export function listSessions(signal?: AbortSignal): Promise<UserSession[]> {
  return apiFetch<UserSession[]>('/api/user/sessions/', { signal })
}

export function revokeSession(id: string): Promise<void> {
  return apiFetch<void>(`/api/user/sessions/${id}/revoke/`, { method: 'POST', body: {} })
}
