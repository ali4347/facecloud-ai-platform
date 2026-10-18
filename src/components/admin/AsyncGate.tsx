import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'
import type { AsyncState } from '../../lib/useApiResource'

interface AsyncGateProps<T> {
  state: AsyncState<T>
  /** What is loading, for the message ("the analytics"). */
  what: string
  children: (data: T) => ReactNode
}

/** The one loading, error-with-retry and demo-notice wrapper every admin screen uses. */
export function AsyncGate<T>({ state, what, children }: AsyncGateProps<T>) {
  const { data, loading, error, isDemo, reload } = state
  return (
    <>
      {isDemo && (
        <div className="p-3 mb-5 rounded-2xl text-xs flex items-center gap-2 bg-surface-mute border border-line text-ink-soft">
          <AlertTriangle className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
          Showing demo data. Set <code className="fc-kbd">VITE_USE_API=true</code> to see the real system.
        </div>
      )}
      {loading && data === null && (
        <div className="text-center py-20 text-ink-faint">
          <Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin" />
          <p className="text-xs font-semibold">Loading {what}…</p>
        </div>
      )}
      {!loading && error && (
        <div className="text-center py-16">
          <AlertTriangle className="w-7 h-7 mx-auto mb-3 text-[#EF4444]" />
          <p className="text-xs font-semibold text-ink">{error}</p>
          <button type="button" onClick={reload}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#FB923C] hover:underline cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" />Try again
          </button>
        </div>
      )}
      {data !== null && !error && children(data)}
    </>
  )
}
