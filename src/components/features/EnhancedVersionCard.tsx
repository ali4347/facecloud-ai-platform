import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Loader2, Sliders, Sparkles } from 'lucide-react'
import { ChartCard } from '../ui/ChartCard'
import { BeforeAfterSlider } from './BeforeAfterSlider'
import { EnhancementReport } from './EnhancementReport'
import { ApiError } from '../../lib/api/client'
import { getImageThumbnail, type ImageListItem } from '../../lib/api/images'
import {
  changedNothing, downloadEnhanced, getEnhancementResult, isEnhancementSettled, levelLabel,
  type EnhancementLevel, type EnhancementResult, type EnhancementStyle,
} from '../../lib/api/enhancements'
import { downloadEdit, listEdits } from '../../lib/api/editor'
import { enhanceStoredPhoto } from '../../lib/liveSnapshot'
import { saveBlob } from '../../lib/saveBlob'

const STYLE_LABEL: Record<EnhancementStyle, string> = { natural: 'Natural', dynamic: 'Dynamic', ai_max: 'AI Enhance' }

interface EnhancedVersionCardProps {
  image: ImageListItem
  /** Called after something changed so the page can reload the photo. */
  onChanged: () => void
}

/**
 * What the photo looks like after enhancement, with the ways to change it:
 * enhance (or enhance again with another style and strength), edit with sliders,
 * and download. Everything shown comes from the backend; nothing here is simulated.
 */
export function EnhancedVersionCard({ image, onChanged }: EnhancedVersionCardProps) {
  const [result, setResult] = useState<EnhancementResult | null>(null)
  const [before, setBefore] = useState<string | null>(null)
  const [after, setAfter] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)   // true while a current edit is what "after" shows
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [style, setStyle] = useState<EnhancementStyle>('natural')
  const [level, setLevel] = useState<EnhancementLevel>('auto')
  const urls = useRef<string[]>([])

  const track = (blob: Blob) => { const url = URL.createObjectURL(blob); urls.current.push(url); return url }
  useEffect(() => () => { urls.current.forEach(URL.revokeObjectURL) }, [])

  /* Load the "after" picture: the current edit if there is one, otherwise the enhanced photo. */
  const showResult = useCallback(async (next: EnhancementResult, signal?: AbortSignal) => {
    setResult(next)
    if (next.status !== 'completed') return
    const [thumb, edits] = await Promise.all([
      getImageThumbnail(image.id, 1024, signal),
      listEdits(next.id, signal).catch(() => []),
    ])
    const current = edits.find(edit => edit.is_current && edit.status === 'completed')
    const blob = current ? await downloadEdit(current.id, signal) : await downloadEnhanced(next.id, signal)
    if (signal?.aborted) return
    setBefore(track(thumb))
    setAfter(track(blob))
    setEditing(Boolean(current))
  }, [image.id])

  /* Start from whatever the photo already has; keep following it while it is still being made. */
  const latestId = image.latest_enhancement?.id ?? null
  useEffect(() => {
    if (latestId === null) { setResult(null); setBefore(null); setAfter(null); return }
    const ctl = new AbortController()
    ;(async () => {
      try {
        let current = await getEnhancementResult(latestId, ctl.signal)
        while (!isEnhancementSettled(current)) {
          setResult(current)
          await new Promise(resolve => setTimeout(resolve, 2000))
          if (ctl.signal.aborted) return
          current = await getEnhancementResult(latestId, ctl.signal)
        }
        await showResult(current, ctl.signal)
      } catch (caught) {
        if (!ctl.signal.aborted) setError(caught instanceof Error ? caught.message : 'Could not load the enhanced photo.')
      }
    })()
    return () => ctl.abort()
  }, [latestId, showResult])

  const enhance = async () => {
    setBusy(true); setError('')
    try {
      const { result: made, blob } = await enhanceStoredPhoto(image.id, style, level)
      setResult(made)
      setBefore(await getImageThumbnail(image.id, 1024).then(track))
      setAfter(track(blob))
      setEditing(false)
      onChanged()
    } catch (caught) {
      setError(caught instanceof ApiError || caught instanceof Error ? caught.message : 'Could not enhance this photo.')
    } finally {
      setBusy(false)
    }
  }

  const download = async () => {
    if (!result) return
    setBusy(true); setError('')
    try {
      const edits = await listEdits(result.id).catch(() => [])
      const current = edits.find(edit => edit.is_current && edit.status === 'completed')
      const blob = current ? await downloadEdit(current.id) : await downloadEnhanced(result.id)
      saveBlob(blob, `facecloud-${image.original_name.replace(/\.[^.]+$/, '')}.${result.output_format === 'png' ? 'png' : 'jpg'}`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Download failed.')
    } finally {
      setBusy(false)
    }
  }

  const running = result !== null && !isEnhancementSettled(result)
  const done = result?.status === 'completed'

  return (
    <ChartCard title="Enhanced version" subtitle={done ? 'Drag the handle to compare' : 'Make the photo better'}>
      <div className="space-y-4">
        {done && before && after && (
          <BeforeAfterSlider beforeSrc={before} afterSrc={after} beforeLabel="Original" afterLabel={editing ? 'Edited' : 'Enhanced'} className="h-72 sm:h-96" />
        )}

        {running && (
          <p className="text-xs text-ink-mute flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Enhancing this photo…</p>
        )}

        {result?.status === 'failed' && (
          <p role="alert" className="text-xs text-red-500">{result.failure_reason || 'The last enhancement did not finish.'}</p>
        )}

        {done && result && (
          <div className="text-xs text-ink-mute space-y-3">
            <EnhancementReport result={result} />
            <p>
              Style {STYLE_LABEL[result.requested_style] ?? result.requested_style}{changedNothing(result) ? ' · nothing needed fixing' : ` · strength applied ${levelLabel(result.applied_level)}`}
              {result.output_width && result.output_height ? ` · ${result.output_width} × ${result.output_height}` : ''}
            </p>
            {result.identity_notice && <p>{result.identity_notice}</p>}
          </div>
        )}

        {!running && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="enh-style" className="text-[11px] font-semibold text-ink block mb-1.5">Style</label>
              <select id="enh-style" className="fc-input" value={style} onChange={e => setStyle(e.target.value as EnhancementStyle)} disabled={busy}>
                <option value="natural">Natural, keeps the photo as it is</option>
                <option value="dynamic">Dynamic, more punch</option>
                <option value="ai_max">AI Enhance, strongest restoration</option>
              </select>
            </div>
            <div>
              <label htmlFor="enh-level" className="text-[11px] font-semibold text-ink block mb-1.5">Strength</label>
              <select id="enh-level" className="fc-input" value={level} onChange={e => setLevel(e.target.value as EnhancementLevel)} disabled={busy}>
                <option value="auto">Automatic</option>
                <option value="low">Light</option>
                <option value="medium">Moderate</option>
                <option value="high">Strong</option>
              </select>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {!running && (
            <button type="button" onClick={() => void enhance()} disabled={busy}
              className="fc-btn-primary !py-2 !px-4 text-xs font-bold flex items-center gap-2 disabled:opacity-60 cursor-pointer">
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {busy ? 'Enhancing…' : done ? 'Enhance again' : 'Enhance this photo'}
            </button>
          )}
          {done && result && (
            <>
              <Link to={`/dashboard/images/${image.id}/edit`} className="fc-btn-secondary !py-2 !px-4 text-xs font-bold flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5" />Edit photo
              </Link>
              <button type="button" onClick={() => void download()} disabled={busy}
                className="fc-btn-secondary !py-2 !px-4 text-xs font-bold flex items-center gap-2 disabled:opacity-60 cursor-pointer">
                <Download className="w-3.5 h-3.5" />Download {editing ? 'edited' : 'enhanced'}
              </button>
            </>
          )}
        </div>

        {done && <p className="text-[11px] text-ink-faint">Enhancing again makes a new version; your original is never changed.</p>}
        {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
      </div>
    </ChartCard>
  )
}
