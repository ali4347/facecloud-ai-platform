import { useCallback, useEffect, useState } from 'react'
import { getHealth, listAlerts } from './api/adminSystem'
import type { BellItem } from './useLiveBell'

const POLL_MS = 120_000
const PANEL_ITEMS = 8

/**
 * What needs an administrator's attention, for the bell: security alerts still open, and services that are not
 * operational. Nothing here is "read" by looking at it (an alert stays until someone acknowledges it on the Security
 * screen), so the count is simply how many such things exist right now. Does nothing unless `enabled`.
 */
export function useAdminBell(enabled: boolean) {
  const [unread, setUnread] = useState(0)
  const [items, setItems] = useState<BellItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (): Promise<BellItem[]> => {
    const [alerts, health] = await Promise.all([listAlerts(), getHealth()])
    const fromAlerts: BellItem[] = alerts.filter(a => a.status === 'open').map(a => ({
      id: `alert-${a.id}`, text: a.message, time: a.last_seen_at, read: false,
      tone: a.risk === 'high' ? 'error' : 'warning', to: '/admin/security',
    }))
    const fromServices: BellItem[] = health.services.filter(s => s.status !== 'operational').map(s => ({
      id: `service-${s.key}`, text: `${s.name} is ${s.status === 'down' ? 'down' : 'degraded'}`, time: s.checked_at, read: false,
      tone: s.status === 'down' ? 'error' : 'warning', to: '/admin/system',
    }))
    return [...fromAlerts, ...fromServices]
  }, [])

  const refreshCount = useCallback(async () => {
    if (!enabled) return
    try { setUnread((await load()).length) } catch { /* a missed refresh is harmless; the next one fixes it */ }
  }, [enabled, load])

  useEffect(() => {
    if (!enabled) return
    void refreshCount()
    const timer = setInterval(() => void refreshCount(), POLL_MS)
    return () => clearInterval(timer)
  }, [enabled, refreshCount])

  const loadItems = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    setError(null)
    try {
      const all = await load()
      setItems(all.slice(0, PANEL_ITEMS))
      setUnread(all.length)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load what needs attention.')
    } finally {
      setLoading(false)
    }
  }, [enabled, load])

  // Nothing to mark: the Security screen is where an alert is dealt with.
  const markRead = useCallback(async () => {}, [])
  const markAllRead = useCallback(async () => {}, [])

  return { unread, items, loading, error, loadItems, markRead, markAllRead }
}
