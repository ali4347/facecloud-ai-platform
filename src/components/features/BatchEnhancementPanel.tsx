import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react'
import { enhanceAcceptedPhotos, listBatchPhotos } from '../../lib/batchEnhance'
import type { ImageListItem } from '../../lib/api/images'

const RUNNING = new Set(['pending', 'queued', 'processing'])

/** How many of a batch's accepted photos can be enhanced, and how many already are, read from the photos themselves. */
async function countBatch(batchId: number, signal?: AbortSignal) {
  const photos = await listBatchPhotos(batchId, signal)
  // Only accepted photos count: a rejected photo is never enhanced. A photo being enhanced right now still counts,
  // even though its status reads "processing" until the enhancement finishes.
  const beingEnhanced = (p: ImageListItem) => !!p.latest_enhancement && RUNNING.has(p.latest_enhancement.status)
  const eligible = photos.filter(p => p.display_status === 'accepted' || p.display_status === 'completed' || beingEnhanced(p))
  return {
    eligible: eligible.length,
    enhanced: eligible.filter(p => p.latest_enhancement?.status === 'completed').length,
    running: eligible.filter(p => p.latest_enhancement && RUNNING.has(p.latest_enhancement.status)).length,
    failed: eligible.filter(p => p.latest_enhancement?.status === 'failed').length,
  }
}

interface BatchEnhancementPanelProps {
  batchId: number
  /** Called when enhancement finished so a page can refresh whatever depends on it. */
  onChanged?: () => void
}

/**
 * Whether the accepted photos of an upload have been enhanced, and the way to do it.
 * Enhancement is a separate step from checking: it only happens when asked for, so this says plainly what has
 * and has not happened instead of leaving the person to wonder.
 */
export function BatchEnhancementPanel({ batchId, onChanged }: BatchEnhancementPanelProps) {
  const [counts, setCounts] = useState<Awaited<ReturnType<typeof countBatch>> | null>(null)
  const [run, setRun] = useState<{ done: number; total: number } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const alive = useRef(true)
  // Set on every mount: React's dev double-mount runs the cleanup once, which must not leave this false.
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])

  const refresh = useCallback(async () => {
    try { const next = await countBatch(batchId); if (alive.current) setCounts(next); return next }
    catch (caught) { if (alive.current) setError(caught instanceof Error ? caught.message : 'Could not read the photos.') }
    return null
  }, [batchId])

  useEffect(() => { void refresh() }, [refresh])

  // Something is already being enhanced (for instance started elsewhere): keep the numbers moving.
  const inFlight = busy || (counts?.running ?? 0) > 0
  useEffect(() => {
    if (!inFlight || busy) return
    const timer = setInterval(() => { void refresh().then(next => { if (next && next.running === 0) onChanged?.() }) }, 3000)
    return () => clearInterval(timer)
  }, [inFlight, busy, refresh, onChanged])

  const start = async () => {
    setBusy(true); setError('')
    try {
      const outcome = await enhanceAcceptedPhotos(batchId, (done, total) => {
        if (alive.current) setRun({ done, total })
        if (done > 0) void refresh()
      })
      await refresh()
      onChanged?.()
      if (outcome.failed > 0) {
        setError(`${outcome.failed} of ${outcome.total} could not be enhanced: ${outcome.firstError}`)
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not enhance the photos.')
    } finally {
      if (alive.current) { setBusy(false); setRun(null) }
    }
  }

  if (!counts) return error ? <p role="alert" className="text-xs text-red-500">{error}</p> : null
  if (counts.eligible === 0) return null

  const allDone = counts.enhanced === counts.eligible
  return (
    <div className="p-4 rounded-2xl bg-surface-mute border border-line space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">Enhancement</p>
      {allDone ? (
        <p className="text-xs text-emerald-400 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />All {counts.eligible} accepted photo{counts.eligible === 1 ? ' is' : 's are'} enhanced.</p>
      ) : (
        <>
          <p className="text-xs text-ink">
            {counts.enhanced} of {counts.eligible} accepted photo{counts.eligible === 1 ? '' : 's'} enhanced
            {counts.running > 0 ? `, ${counts.running} in progress` : ''}{counts.failed > 0 ? `, ${counts.failed} failed` : ''}.
          </p>
          {counts.enhanced === 0 && counts.running === 0 && !busy && (
            <p className="text-[11px] text-ink-mute">Checking a photo does not enhance it. Enhance the accepted photos to improve them.</p>
          )}
          {busy && run && run.total > 0 && (
            <div className="h-1.5 rounded-full overflow-hidden bg-surface">
              <div className="h-full bg-accent transition-all duration-500" style={{ width: `${Math.round((run.done / run.total) * 100)}%` }} />
            </div>
          )}
          {counts.running === 0 && (
            <button type="button" onClick={() => void start()} disabled={busy}
              className="fc-btn-primary !py-2 !px-4 text-xs font-bold inline-flex items-center gap-2 disabled:opacity-60 cursor-pointer">
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {busy ? 'Enhancing…' : counts.enhanced > 0 ? 'Enhance the rest' : 'Enhance accepted photos'}
            </button>
          )}
        </>
      )}
      {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
