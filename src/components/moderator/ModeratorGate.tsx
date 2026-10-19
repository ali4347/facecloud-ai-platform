import { AlertTriangle, Loader2, Mail, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'
import type { AsyncState } from '../../lib/useApiResource'

interface ModeratorGateProps<T> {
  state: AsyncState<T>
  /** What is loading, for the message ("the batches"). */
  what: string
  children: (data: T) => ReactNode
}

/**
 * The loading, error-with-retry, demo-notice and "no organization" wrapper the moderator screens share.
 * A moderator resource that is skipped (the account belongs to no organization) ends with `data === null` and no error.
 */
export function ModeratorGate<T>({ state, what, children }: ModeratorGateProps<T>) {
  const { data, loading, error, isDemo, reload } = state
  return (
    <>
      {isDemo && (
        <div className="p-3 mb-5 rounded-2xl text-xs flex items-center gap-2 bg-surface-mute border border-line text-ink-soft">
          <AlertTriangle className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
          Showing demo data, and nothing changed here is saved. Set <code className="fc-kbd">VITE_USE_API=true</code> to see the real organization.
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
      {!loading && !error && data === null && (
        <div className="text-center py-16 text-ink-faint">
          <Mail className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-xs font-semibold">You are not part of an organization yet, so there is nothing to show here.</p>
        </div>
      )}
      {data !== null && !error && children(data)}
    </>
  )
}
