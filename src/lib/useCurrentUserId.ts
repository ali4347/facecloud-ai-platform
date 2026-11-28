import { useEffect, useState } from 'react'
import { USE_API } from './api/config'
import { getProfile } from './api/auth'
import { personCache } from './personCache'

const cache = personCache<number | null>()

/**
 * The signed-in person's own user id, from GET /api/user/profile/ (the backend's UserSerializer `id`), asked once per
 * signed-in person. Used to recognise one's own records (a moderator's own download request).
 * `settled` is false while the answer is on its way; `id` is null when the server did not say (or could not be asked):
 * the caller then cannot tell and lets the server decide.
 */
export function useCurrentUserId(enabled = true): { id: number | null; settled: boolean } {
  const known = cache.get()
  const [state, setState] = useState<{ id: number | null; settled: boolean }>(
    known !== undefined ? { id: known, settled: true } : { id: null, settled: !USE_API || !enabled },
  )
  useEffect(() => {
    if (!USE_API || !enabled || cache.get() !== undefined) return
    let active = true
    getProfile()
      .then(profile => {
        const raw = Number(profile.id)
        const value = profile.id !== undefined && Number.isInteger(raw) ? raw : null
        cache.set(value)
        if (active) setState({ id: value, settled: true })
      })
      // Not cached: the next page asks again. The server still refuses a self-decision (403 cannot_decide_own_request).
      .catch(() => { if (active) setState({ id: null, settled: true }) })
    return () => { active = false }
  }, [enabled])
  return state
}
