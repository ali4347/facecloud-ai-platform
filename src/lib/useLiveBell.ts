import { useCallback, useEffect, useState } from 'react'
import {
  NOTIFICATIONS_CHANGED, announceNotificationsChanged, getUnreadCount, listNotifications, markAllNotificationsRead,
  markNotificationRead, resolveNotificationPath, type NotificationSeverity,
} from './api/notifications'

/** One line in the bell's panel, whichever source it came from. */
export interface BellItem {
  id: string
  text: string
  time: string
  tone: NotificationSeverity
  read: boolean
  /** Where it leads, or null when it leads nowhere. */
  to: string | null
}

const POLL_MS = 60_000
const PANEL_ITEMS = 6

/**
 * The signed-in person's real notifications for the bell: the unread count kept fresh in the background,
 * the latest few read when the panel is opened. Does nothing at all unless `enabled`.
 */
export function useLiveBell(enabled: boolean) {
  const [unread, setUnread] = useState(0)
  const [items, setItems] = useState<BellItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshCount = useCallback(async () => {
    if (!enabled) return
    try { setUnread(await getUnreadCount()) } catch { /* a missed refresh is harmless; the next one fixes it */ }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    void refreshCount()
    const timer = setInterval(() => void refreshCount(), POLL_MS)
    window.addEventListener(NOTIFICATIONS_CHANGED, refreshCount)
    return () => { clearInterval(timer); window.removeEventListener(NOTIFICATIONS_CHANGED, refreshCount) }
  }, [enabled, refreshCount])

  const loadItems = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    setError(null)
    try {
      const page = await listNotifications(1)
      setItems(page.results.slice(0, PANEL_ITEMS).map(item => ({
        id: String(item.id), text: item.title + (item.message ? ` — ${item.message}` : ''), time: item.created_at,
        tone: item.severity, read: item.is_read, to: resolveNotificationPath(item.action_path),
      })))
      await refreshCount()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load notifications.')
    } finally {
      setLoading(false)
    }
  }, [enabled, refreshCount])

  const markRead = useCallback(async (id: string) => {
    try { await markNotificationRead(Number(id)) } catch { /* following the link still works */ }
    setItems(current => current.map(item => (item.id === id ? { ...item, read: true } : item)))
    announceNotificationsChanged()
  }, [])

  const markAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead()
      setItems(current => current.map(item => ({ ...item, read: true })))
      setUnread(0)
      announceNotificationsChanged()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not mark them as read.')
    }
  }, [])

  return { unread, items, loading, error, loadItems, markRead, markAllRead }
}
