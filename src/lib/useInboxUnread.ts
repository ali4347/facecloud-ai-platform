import { useEffect, useState } from 'react'
import { USE_API } from './api/config'
import { getInboxSummary } from './api/adminInbox'
import { NOTIFICATIONS_CHANGED } from './api/notifications'

/** Something on the inbox page changed what is unread (the sidebar badge is a separate component). */
export const INBOX_CHANGED = 'fc:inbox'

/** How many contact messages and early-access addresses an administrator has not opened yet; refreshed every minute, when the page changes it, and when a notification changes. 0 while it cannot be read. */
export function useInboxUnread(enabled: boolean): number {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!enabled || !USE_API) return
    let alive = true
    let controller: AbortController | null = null
    const load = () => {
      controller?.abort()
      controller = new AbortController()
      getInboxSummary(controller.signal)
        .then(summary => { if (alive) setCount(summary.contact_unread + summary.early_access_unread) })
        .catch(() => { /* a failed read keeps the last number */ })
    }
    load()
    const timer = window.setInterval(load, 60_000)
    window.addEventListener(INBOX_CHANGED, load)
    window.addEventListener(NOTIFICATIONS_CHANGED, load)
    return () => {
      alive = false
      controller?.abort()
      window.clearInterval(timer)
      window.removeEventListener(INBOX_CHANGED, load)
      window.removeEventListener(NOTIFICATIONS_CHANGED, load)
    }
  }, [enabled])
  return count
}
