import { apiFetch } from './client'

export type ShareState = 'active' | 'expired' | 'revoked' | string

/** A secure link the person made. The link itself is never available again, only its facts. */
export interface ShareLinkRecord {
  id: number
  label: string
  state: ShareState
  /** The enhanced photo it points to, or null. */
  result: number | null
  edit: number | null
  /** The Person Folder ZIP it points to, or null. */
  identity_export: number | null
  watermark: string
  expires_at: string | null
  revoked_at: string | null
  access_count: number
  last_accessed_at: string | null
  created_at: string
}

interface MaybePaged<T> { results?: T[] }

export async function listShareLinks(signal?: AbortSignal): Promise<ShareLinkRecord[]> {
  const data = await apiFetch<ShareLinkRecord[] | MaybePaged<ShareLinkRecord>>('/api/shares/', { signal })
  return Array.isArray(data) ? data : data.results ?? []
}

/** After this the link stops working for everyone who has it. */
export function revokeShareLink(id: number): Promise<unknown> {
  return apiFetch(`/api/shares/${id}/revoke/`, { method: 'POST', body: {} })
}

/** What a link points at, in words. */
export function shareTarget(link: ShareLinkRecord): string {
  if (link.identity_export !== null) return 'Person folder ZIP'
  if (link.edit !== null) return 'Edited photo'
  if (link.result !== null) return 'Enhanced photo'
  return 'File'
}
