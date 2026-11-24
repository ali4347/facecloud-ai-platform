import { apiFetch } from './client'

/** Everything a person filled in on the public contact form, as the administrators see it. */
export interface ContactMessageRow {
  id: number
  name: string
  email: string
  company: string
  reason: string
  message: string
  /** queued | sent | failed | skipped (skipped: no recipient e-mail is set, the message is only here). */
  delivery_status: string
  delivered_at: string | null
  failure_reason: string
  is_read: boolean
  read_at: string | null
  created_at: string
}

export interface EarlyAccessRow {
  id: number
  email: string
  source: string
  is_read: boolean
  read_at: string | null
  created_at: string
}

export interface InboxSummary {
  contact_unread: number
  contact_total: number
  early_access_unread: number
  early_access_total: number
}

interface Listed<T> { count: number; results: T[] }
export interface InboxQuery { unread?: boolean; q?: string }

const query = (params: InboxQuery) => {
  const out = new URLSearchParams()
  if (params.unread) out.set('unread', '1')
  if (params.q?.trim()) out.set('q', params.q.trim())
  const text = out.toString()
  return text ? `?${text}` : ''
}

export const getInboxSummary = (signal?: AbortSignal) => apiFetch<InboxSummary>('/api/contact/admin/summary/', { signal })
export const listContactMessages = (params: InboxQuery = {}, signal?: AbortSignal) =>
  apiFetch<Listed<ContactMessageRow>>(`/api/contact/admin/messages/${query(params)}`, { signal })
export const markContactMessageRead = (id: number, read: boolean) =>
  apiFetch<ContactMessageRow>(`/api/contact/admin/messages/${id}/`, { method: 'PATCH', body: { read } })
export const listEarlyAccess = (params: InboxQuery = {}, signal?: AbortSignal) =>
  apiFetch<Listed<EarlyAccessRow>>(`/api/contact/admin/early-access/${query(params)}`, { signal })
export const markEarlyAccessRead = (id: number, read: boolean) =>
  apiFetch<EarlyAccessRow>(`/api/contact/admin/early-access/${id}/`, { method: 'PATCH', body: { read } })
export const markInboxAllRead = (kind: 'contact' | 'early_access' | 'all') =>
  apiFetch<{ marked_read: Record<string, number> }>('/api/contact/admin/mark-all-read/', { method: 'POST', body: { kind } })

/** The landing page's "Enter your email for early access" box. Public: no sign-in. */
export const submitEarlyAccess = (email: string) =>
  apiFetch<{ status: 'registered' | 'already_registered'; detail: string }>('/api/contact/early-access/', { method: 'POST', body: { email }, anonymous: true })
