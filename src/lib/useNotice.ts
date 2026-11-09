import { useEffect, useState } from 'react'

export interface Notice { kind: 'ok' | 'error'; text: string }

/** How long a success message stays before it goes by itself. A failure is not timed: it explains what went wrong. */
const NOTICE_MS = 3000

/** One message at the bottom of a screen: a success goes after 3 seconds, a failure stays until dismissed. */
export function useNotice() {
  const [notice, setNotice] = useState<Notice | null>(null)
  useEffect(() => {
    if (notice?.kind !== 'ok') return
    const timer = setTimeout(() => setNotice(null), NOTICE_MS)
    return () => clearTimeout(timer)
  }, [notice])
  return { notice, setNotice, ok: (text: string) => setNotice({ kind: 'ok', text }), fail: (text: string) => setNotice({ kind: 'error', text }) }
}
