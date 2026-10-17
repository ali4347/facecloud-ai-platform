import { apiFetch } from './client'
import type { Page } from './images'

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error'

export interface UserNotification {
  id: number
  event_type: string
  severity: NotificationSeverity
  title: string
  message: string
  /** A page of this app to open for it, for example /dashboard/downloads. */
  action_path: string
  is_read: boolean
  created_at: string
}

export function listNotifications(page = 1, signal?: AbortSignal): Promise<Page<UserNotification>> {
  return apiFetch<Page<UserNotification>>(`/api/notifications/?page=${page}`, { signal })
}

export async function getUnreadCount(signal?: AbortSignal): Promise<number> {
  const data = await apiFetch<{ unread_count: number }>('/api/notifications/unread-count/', { signal })
  return data.unread_count
}

export function markNotificationRead(id: number): Promise<unknown> {
  return apiFetch(`/api/notifications/${id}/read/`, { method: 'POST' })
}

export function markAllNotificationsRead(): Promise<unknown> {
  return apiFetch('/api/notifications/mark-all-read/', { method: 'POST' })
}

export function deleteNotification(id: number): Promise<unknown> {
  return apiFetch(`/api/notifications/${id}/`, { method: 'DELETE' })
}

/** The per-event on/off switches on Settings → Notifications. */
export interface NotificationPreferences {
  photo_accepted: boolean
  photo_rejected: boolean
  batch_upload_finished: boolean
  person_group_created: boolean
  email_notifications: boolean
  live_session_alerts: boolean
}

export function getNotificationPreferences(signal?: AbortSignal): Promise<NotificationPreferences> {
  return apiFetch<NotificationPreferences>('/api/notifications/preferences/', { signal })
}

export function updateNotificationPreferences(patch: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
  return apiFetch<NotificationPreferences>('/api/notifications/preferences/', { method: 'PATCH', body: patch })
}

/** Pages the backend names that this app calls something else. Anything unknown gets no link rather than a dead one. */
const ROUTE_ALIASES: Record<string, string> = { '/dashboard/uploads': '/dashboard/jobs' }
const KNOWN_PREFIXES = [
  '/dashboard/images', '/dashboard/groups', '/dashboard/downloads', '/dashboard/jobs', '/dashboard/processing',
  '/dashboard/notifications', '/dashboard/activity', '/dashboard/settings', '/dashboard/upload',
]

export function resolveNotificationPath(path: string): string | null {
  if (!path) return null
  const aliased = ROUTE_ALIASES[path] ?? path
  return KNOWN_PREFIXES.some(prefix => aliased === prefix || aliased.startsWith(prefix + '/')) ? aliased : null
}

/** Tell the bell that something changed the unread count (the page and the bell are separate components). */
export const NOTIFICATIONS_CHANGED = 'fc:notifications'
export const announceNotificationsChanged = () => window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED))
