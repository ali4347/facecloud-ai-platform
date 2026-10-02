import { useCallback, useEffect, useRef, useState } from 'react'
import { USE_API } from './api/config'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
  /** True when this screen is showing demo data rather than the live API. */
  isDemo: boolean
  reload: () => void
}

export function messageFor(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong loading this screen.'
}

/**
 * One screen's data, from the API or from the built-in demo data.
 *
 * Every migrated screen needs the same four things — fetch on mount, cancel if
 * the screen goes away before the answer does, a way to ask again after an
 * action, and a demo fallback while `VITE_USE_API` is off — so they live here
 * once instead of in each screen.
 *
 * `ready` is for resources that cannot be fetched until something else has
 * resolved (the moderator screens need an organization id first). While it is
 * false nothing is requested and `loading` stays true.
 */
export function useApiResource<T>(
  load: (signal: AbortSignal) => Promise<T>,
  demo: () => T,
  dependencies: unknown[],
  options: { ready?: boolean; skip?: boolean } = {},
): AsyncState<T> {
  const { ready = true, skip = false } = options
  const [data, setData] = useState<T | null>(USE_API ? null : demo)
  const [loading, setLoading] = useState(USE_API)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  /* The loader closes over the screen's own filters, so it is a new function on
     every render; keeping it in a ref means that alone does not refire the
     request. The dependency array says when the request genuinely changed. */
  const loadRef = useRef(load)
  loadRef.current = load
  const demoRef = useRef(demo)
  demoRef.current = demo

  const reload = useCallback(() => setReloadToken(token => token + 1), [])

  useEffect(() => {
    if (!USE_API) {
      setData(demoRef.current())
      setLoading(false)
      return
    }
    if (!ready) return
    if (skip) {
      // Nothing to fetch, and that is a legitimate empty screen rather than a
      // failure — the moderator screens use this when there is no organization.
      setData(null)
      setLoading(false)
      return
    }
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    loadRef.current(controller.signal)
      .then(result => {
        if (!controller.signal.aborted) setData(result)
      })
      .catch(caught => {
        if (!controller.signal.aborted) setError(messageFor(caught))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, skip, reloadToken, ...dependencies])

  return { data, loading, error, isDemo: !USE_API, reload }
}
