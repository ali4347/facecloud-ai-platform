import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AuthedImage } from '../ui/AuthedImage'
import { uploadStatusBadge } from '../ui/StatusBadge'
import { EnhancementReport } from './EnhancementReport'
import { messageFor, useApiResource } from '../../lib/useApiResource'
import { getImage, getImageThumbnail, passedChecks, photoStatus, type BatchImageProgress, type ImageListItem } from '../../lib/api/images'
import { changedNothing, downloadEnhanced, getEnhancementResult, isEnhancementSettled, type EnhancementResult } from '../../lib/api/enhancements'

/** The photo's latest enhancement, followed until it has settled: it can still be running when the batch is reported finished. */
function useEnhancement(resultId: number | null) {
  const [result, setResult] = useState<EnhancementResult | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    setResult(null); setError('')
    if (resultId === null) return
    const ctl = new AbortController()
    ;(async () => {
      try {
        let current = await getEnhancementResult(resultId, ctl.signal)
        setResult(current)
        while (!isEnhancementSettled(current)) {
          await new Promise(resolve => setTimeout(resolve, 2000))
          if (ctl.signal.aborted) return
          current = await getEnhancementResult(resultId, ctl.signal)
          setResult(current)
        }
      } catch (caught) {
        if (!ctl.signal.aborted) setError(messageFor(caught))
      }
    })()
    return () => ctl.abort()
  }, [resultId])
  return { result, error }
}

/** One photo of a finished upload: the picture, and what was done to it. `alone` is a batch of one photo, which opens on the enhanced picture. */
function PhotoResult({ row, alone }: { row: BatchImageProgress; alone: boolean }) {
  const photo = useApiResource<ImageListItem | null>(signal => getImage(row.image_id, signal), () => null, [row.image_id, row.status])
  const image = photo.data
  const { result, error } = useEnhancement(image?.latest_enhancement?.id ?? null)
  const [view, setView] = useState<'original' | 'enhanced'>(alone ? 'enhanced' : 'original')

  const card = 'p-4 rounded-2xl border border-line bg-surface-mute text-xs'
  if (!image) {
    return photo.loading
      ? <div className={`${card} flex items-center gap-2 text-ink-mute`}><Loader2 className="w-3.5 h-3.5 animate-spin" />Loading {row.filename}…</div>
      : <div className={`${card} text-[#F87171]`}>{row.filename}: {photo.error ?? 'this photo could not be loaded.'}</div>
  }

  const done = result?.status === 'completed'
  const unchanged = done && changedNothing(result)
  /* The server makes thumbnails at 256 or 1024 only. The enhanced file is full resolution, so a batch of many photos starts on the original and fetches the enhanced one only when asked. */
  const showEnhanced = view === 'enhanced' && done && !unchanged && result

  return (
    <div className={`${card} grid grid-cols-1 sm:grid-cols-[240px_minmax(0,1fr)] gap-4`}>
      <div className="space-y-2">
        <div className="aspect-[4/3] rounded-xl overflow-hidden bg-surface">
          {showEnhanced
            ? <AuthedImage load={signal => downloadEnhanced(result.id, signal)} cacheKey={`batch-enhanced-${result.id}`} alt={`${image.original_name}, enhanced`} className="w-full h-full !border-0" rounded="rounded-none" />
            : <AuthedImage load={image.thumbnail_url ? signal => getImageThumbnail(image.id, 1024, signal) : null} cacheKey={`batch-photo-${image.id}`} alt={image.original_name} className="w-full h-full !border-0" rounded="rounded-none" />}
        </div>
        {done && !unchanged && (
          <div role="group" aria-label="Which picture to show" className="flex gap-1.5">
            {(['original', 'enhanced'] as const).map(choice => (
              <button
                key={choice} type="button" aria-pressed={view === choice} onClick={() => setView(choice)}
                className={`px-3 py-1 rounded-full border text-[11px] font-semibold cursor-pointer ${view === choice ? 'border-accent text-accent bg-accent/10' : 'border-line text-ink-soft hover:text-ink'}`}
              >
                {choice === 'original' ? 'Original' : 'Enhanced'}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/dashboard/images/${image.id}`} className="text-sm font-bold text-ink hover:text-[#FB923C] truncate max-w-full">{image.original_name}</Link>
          {uploadStatusBadge(photoStatus(image))}
        </div>

        {result && (done || result.status === 'partial') && <EnhancementReport result={result} />}
        {unchanged && <p className="text-ink-mute">Nothing needed fixing, so the photo is shown as it was.</p>}
        {result && !isEnhancementSettled(result) && <p className="flex items-center gap-2 text-ink-mute"><Loader2 className="w-3.5 h-3.5 animate-spin" />Enhancing this photo…</p>}
        {result?.status === 'partial' && <p className="text-ink-mute">The enhancement finished only in part.</p>}
        {result?.status === 'failed' && <p role="alert" className="text-[#F87171]">{result.failure_reason || 'The enhancement did not finish.'}</p>}
        {result?.status === 'cancelled' && <p className="text-ink-mute">The enhancement was cancelled.</p>}
        {error && <p role="alert" className="text-[#F87171]">{error}</p>}
        {!image.latest_enhancement && (
          passedChecks(photoStatus(image))
            ? <p className="text-ink-mute">This photo has not been enhanced. Open it to enhance it.</p>
            : <p className="text-ink-mute">{image.rejection_reason || 'This photo did not pass the checks, so it was not enhanced.'}</p>
        )}

        <Link to={`/dashboard/images/${image.id}`} className="inline-block font-bold text-[#FB923C] hover:underline">Open the photo</Link>
      </div>
    </div>
  )
}

/** The finished upload's photos, each with its picture and its report. */
export function BatchPhotoResults({ rows }: { rows: BatchImageProgress[] }) {
  return (
    <div className="space-y-4">
      {rows.map(row => <PhotoResult key={row.image_id} row={row} alone={rows.length === 1} />)}
    </div>
  )
}
