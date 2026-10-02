import { useCallback, useEffect, useState } from 'react'

/**
 * Which notifications a person has already read.
 *
 * There is no backend, so read state lives in this browser against the account.
 * Only the ids are kept — the notifications themselves come from the mock feed.
 */
const CHANGE_EVENT = 'facecloud:notifications'
const keyFor = (email: string) => `facecloud_read_notifications:${email.toLowerCase()}`

function readIds(email: string): string[] {
  if (!email) return []
  try {
    const raw = localStorage.getItem(keyFor(email))
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter(id => typeof id === 'string') : []
  } catch {
    return []
  }
}

export function useReadNotifications(email: string, allIds: string[]) {
  const [read, setRead] = useState<string[]>(() => readIds(email))

  const refresh = useCallback(() => setRead(readIds(email)), [email])

  useEffect(() => {
    refresh()
    const onChange = (e: Event) => {
      if ((e as CustomEvent<string>).detail === email) refresh()
    }
    window.addEventListener(CHANGE_EVENT, onChange)
    return () => window.removeEventListener(CHANGE_EVENT, onChange)
  }, [email, refresh])

  const readSet = new Set(read)
  const unreadCount = allIds.filter(id => !readSet.has(id)).length

  const markAllRead = useCallback(() => {
    if (!email) return
    /* Store the union rather than replacing: ids already marked read stay read
       even if the feed no longer lists them. */
    const merged = Array.from(new Set([...readIds(email), ...allIds]))
    try {
      localStorage.setItem(keyFor(email), JSON.stringify(merged))
    } catch {
      return
    }
    setRead(merged)
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: email }))
  }, [email, allIds])

  return { isRead: (id: string) => readSet.has(id), unreadCount, markAllRead }
}
