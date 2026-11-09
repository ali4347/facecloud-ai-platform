import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, ChevronLeft, ChevronRight, Columns3, Download, Eye, Loader2, Play, Sparkles, Trash2 } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Modal } from '../../components/ui/Modal'
import { enhanceStoredPhoto } from '../../lib/liveSnapshot'
import type { EnhancementStyle } from '../../lib/api/enhancements'
import { AuthedImage } from '../../components/ui/AuthedImage'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { NeedsApi } from '../../components/ui/NeedsApi'
import { NoticeBar } from '../../components/ui/NoticeBar'
import { useApiResource } from '../../lib/useApiResource'
import { useNotice } from '../../lib/useNotice'
import { downloadImage, getImage, getImageThumbnail } from '../../lib/api/images'
import { comparisonPreview, comparisonReport, deleteComparison, getComparison, isComparisonSettled, listComparisons, startComparison, type CompareProfile, type ComparisonOutput, type ModelComparison } from '../../lib/api/tools'
import { saveBlob } from '../../lib/saveBlob'
import { formatDateTime } from '../../lib/utils'

const PROFILES: { value: CompareProfile; label: string; hint: string }[] = [
  { value: 'opencv_baseline', label: 'Plain filter', hint: 'A simple baseline to compare against' },
  { value: 'natural', label: 'Natural', hint: 'Keeps the photo as it is' },
  { value: 'dynamic', label: 'Dynamic', hint: 'More punch' },
  { value: 'ai_max', label: 'AI Enhance', hint: 'Strongest restoration' },
]
const LEVELS = [{ value: 'auto', label: 'Automatic' }, { value: 'low', label: 'Light' }, { value: 'medium', label: 'Moderate' }, { value: 'high', label: 'Strong' }]

/** One photo run through several enhancement styles side by side, with a score and the time each took. */
export default function ComparePage() {
  const { id } = useParams()
  const imageId = id && /^\d+$/.test(id) ? Number(id) : null
  const [level, setLevel] = useState('auto')
  const [chosen, setChosen] = useState<Set<CompareProfile>>(new Set(['natural', 'dynamic', 'ai_max']))
  const [current, setCurrent] = useState<ModelComparison | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const { notice, setNotice, ok, fail } = useNotice()
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])

  const photo = useApiResource(signal => (imageId === null ? Promise.reject(new Error('That photo does not exist.')) : getImage(imageId, signal)), () => null, [imageId])
  const earlier = useApiResource(signal => listComparisons(1, signal), () => null, [])
  const previous = (earlier.data?.results ?? []).filter(item => item.image === imageId && item.id !== current?.id)

  const toggle = (profile: CompareProfile) => setChosen(now => { const next = new Set(now); if (next.has(profile)) next.delete(profile); else next.add(profile); return next })

  /** Poll one comparison until it ends; the screen shows whatever it has meanwhile. */
  const follow = useCallback(async (first: ModelComparison) => {
    let now = first
    setCurrent(now)
    for (let i = 0; i < 240 && !isComparisonSettled(now) && alive.current; i += 1) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      if (!alive.current) return
      now = await getComparison(now.id)
      setCurrent(now)
    }
    return now
  }, [])

  const run = async () => {
    if (imageId === null || chosen.size === 0) return
    setBusy(true); setNotice(null); setCurrent(null)
    try {
      const made = await startComparison(imageId, level, [...chosen])
      const done = await follow(made)
      if (done?.status === 'failed') fail(done.failure_reason || 'The comparison did not finish.')
      earlier.reload()
    } catch (caught) { fail(caught instanceof Error ? caught.message : 'Could not start the comparison.') } finally { if (alive.current) setBusy(false) }
  }
  const open = async (item: ModelComparison) => { setBusy(true); try { await follow(await getComparison(item.id)) } catch (caught) { fail(caught instanceof Error ? caught.message : 'Could not open it.') } finally { setBusy(false) } }
  const downloadReport = async () => {
    if (!current) return
    try { saveBlob(await comparisonReport(current.id), `facecloud-comparison-${current.id}.csv`) } catch (caught) { fail(caught instanceof Error ? caught.message : 'Could not download the report.') }
  }
  const remove = async () => {
    if (!current) return
    setBusy(true)
    try { await deleteComparison(current.id); setCurrent(null); setConfirmingDelete(false); ok('Comparison deleted.'); earlier.reload() } catch (caught) { fail(caught instanceof Error ? caught.message : 'Could not delete it.'); setConfirmingDelete(false) } finally { setBusy(false) }
  }

  const running = current !== null && !isComparisonSettled(current)

  /* Everything that can be looked at larger: the original, then each style. `load` fetches the picture with the sign-in token. */
  const stem = (photo.data?.original_name ?? 'photo').replace(/\.[^.]+$/, '')
  const viewable: Viewable[] = current ? [
    ...(!current.outputs.some(output => output.profile === 'original') && imageId !== null
      ? [{ key: 'original', label: 'Original', note: 'As you uploaded it', load: (signal?: AbortSignal) => getImageThumbnail(imageId, 1024, signal), download: () => downloadImage(imageId), filename: photo.data?.original_name ?? `${stem}.jpg` } as Viewable]
      : []),
    ...current.outputs.filter(output => output.preview_url).map(output => ({
      key: output.profile, label: output.label, note: output.description, load: (signal?: AbortSignal) => comparisonPreview(output, signal), download: () => comparisonPreview(output), filename: `facecloud-${stem}-${output.profile}.jpg`,
    }) as Viewable),
  ] : []
  const [viewing, setViewing] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [fullSize, setFullSize] = useState<{ profile: string; state: 'working' | 'done' | 'error'; message?: string } | null>(null)
  const viewIndex = viewable.findIndex(item => item.key === viewing)

  const save = async (item: Viewable) => {
    setSaving(item.key)
    try { saveBlob(await item.download(), item.filename) } catch (caught) { fail(caught instanceof Error ? caught.message : 'Could not download it.') } finally { setSaving(null) }
  }
  /** The comparison shows reduced previews; this makes the chosen style for real, at the photo's own size. */
  const applyStyle = async (profile: string) => {
    if (imageId === null || !(profile === 'natural' || profile === 'dynamic' || profile === 'ai_max')) return
    setFullSize({ profile, state: 'working' })
    try { await enhanceStoredPhoto(imageId, profile as EnhancementStyle, level as 'auto' | 'low' | 'medium' | 'high'); setFullSize({ profile, state: 'done' }) }
    catch (caught) { setFullSize({ profile, state: 'error', message: caught instanceof Error ? caught.message : 'Could not enhance the photo.' }) }
  }

  return (
    <NeedsApi title="Compare styles" icon={Columns3}>
      <div className="page-enter">
        <Link to={`/dashboard/images/${imageId ?? ''}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-mute hover:text-ink mb-3"><ArrowLeft className="w-3.5 h-3.5" />Back to the photo</Link>
        <PageHeader title="Compare styles" subtitle={photo.data ? photo.data.original_name : 'Run one photo through several styles, side by side'} />

        <div className="fc-card p-5 space-y-4 mb-6">
          <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-end">
            <fieldset><legend className="text-[11px] font-semibold text-ink mb-2">Styles to compare</legend>
              <div className="flex flex-wrap gap-2">
                {PROFILES.map(profile => (
                  <label key={profile.value} title={profile.hint} className={`px-3.5 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${chosen.has(profile.value) ? 'bg-accent/15 text-accent border-accent/30' : 'text-ink-mute border-line bg-surface-mute'}`}>
                    <input type="checkbox" className="sr-only" checked={chosen.has(profile.value)} onChange={() => toggle(profile.value)} />{profile.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="text-[11px] font-semibold text-ink">Strength
              <select value={level} onChange={event => setLevel(event.target.value)} className="fc-input mt-1.5">{LEVELS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => void run()} disabled={busy || chosen.size === 0 || imageId === null} className="fc-btn-primary !py-2 !px-5 text-xs font-bold inline-flex items-center gap-2 disabled:opacity-60 cursor-pointer">{busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}{busy ? 'Comparing…' : 'Compare'}</button>
            <p className="text-[11px] text-ink-faint">Every style is made from the same photo, so a heavy one can take a while. Your original is never changed.</p>
          </div>
        </div>

        {running && <p className="text-xs text-ink-mute flex items-center gap-2 mb-4"><Loader2 className="w-4 h-4 animate-spin" />Working on it… the styles that are ready appear below.</p>}
        {current && (
          <>
            {current.recommended_profile && <p className="text-xs text-ink-mute mb-4"><strong className="text-ink">Recommended: {current.outputs.find(o => o.profile === current.recommended_profile)?.label ?? current.recommended_profile}.</strong> {current.recommendation_reason}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {photo.data && imageId !== null && !current.outputs.some(output => output.profile === 'original') && (
                <div className="fc-card overflow-hidden">
                  <button type="button" onClick={() => setViewing('original')} aria-label="Look at the original larger" className="block w-full aspect-[4/3] bg-surface-mute cursor-zoom-in"><AuthedImage load={signal => getImageThumbnail(imageId, 1024, signal)} cacheKey={`compare-orig-${imageId}`} alt="Original" className="w-full h-full !border-0 !object-contain" rounded="rounded-none" /></button>
                  <div className="p-3 space-y-2">
                    <div><p className="text-sm font-semibold text-ink">Original</p><p className="text-[11px] text-ink-faint">As you uploaded it</p></div>
                    <CardActions onPreview={() => setViewing('original')} onSave={() => void save(viewable[0])} saving={saving === 'original'} />
                  </div>
                </div>
              )}
              {current.outputs.map(output => {
                const item = viewable.find(entry => entry.key === output.profile)
                const style = output.profile === 'natural' || output.profile === 'dynamic' || output.profile === 'ai_max'
                return (
                  <OutputCard key={output.profile} output={output} comparisonId={current.id} recommended={output.profile === current.recommended_profile} onPreview={item ? () => setViewing(output.profile) : undefined}>
                    {item && <CardActions onPreview={() => setViewing(output.profile)} onSave={() => void save(item)} saving={saving === output.profile} />}
                    {style && output.preview_url && isComparisonSettled(current) && (
                      <div>
                        <button type="button" onClick={() => void applyStyle(output.profile)} disabled={fullSize?.state === 'working'} className="text-[11px] font-bold text-accent hover:underline inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60">{fullSize?.profile === output.profile && fullSize.state === 'working' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}Use this style at full size</button>
                        {fullSize?.profile === output.profile && fullSize.state === 'done' && <p className="text-[11px] text-emerald-400 mt-1">Done. <Link to={`/dashboard/images/${imageId}`} className="underline font-semibold">Open the photo</Link> to see and download it.</p>}
                        {fullSize?.profile === output.profile && fullSize.state === 'error' && <p role="alert" className="text-[11px] text-red-500 mt-1">{fullSize.message}</p>}
                      </div>
                    )}
                  </OutputCard>
                )
              })}
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-5">
              {isComparisonSettled(current) && <button type="button" onClick={() => void downloadReport()} className="fc-btn-secondary !py-2 !px-4 text-xs font-bold inline-flex items-center gap-2 cursor-pointer"><Download className="w-3.5 h-3.5" />Download the report (CSV)</button>}
              <button type="button" onClick={() => setConfirmingDelete(true)} disabled={running} className="text-xs font-bold text-error hover:underline inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"><Trash2 className="w-3.5 h-3.5" />Delete this comparison</button>
              {current.total_duration_ms > 0 && <span className="text-[11px] text-ink-faint ml-auto">{(current.total_duration_ms / 1000).toFixed(1)} s in all</span>}
            </div>
          </>
        )}
        {previous.length > 0 && (
          <section className="mt-8"><h2 className="text-[11px] font-bold uppercase tracking-wider text-ink-faint mb-2">Earlier comparisons of this photo</h2>
            <ul className="space-y-1.5">{previous.map(item => <li key={item.id}><button type="button" onClick={() => void open(item)} disabled={busy} className="text-xs font-semibold text-accent hover:underline cursor-pointer">{formatDateTime(item.created_at)} · {item.outputs?.length ?? 0} styles</button></li>)}</ul>
          </section>
        )}
        {photo.error && <p role="alert" className="text-xs text-red-500 flex items-center gap-2 mt-4"><AlertTriangle className="w-4 h-4" />{photo.error}</p>}
        {notice && <div className="sticky bottom-24 z-30 mt-6"><NoticeBar notice={notice} onDismiss={() => setNotice(null)} /></div>}
        {viewIndex >= 0 && <CompareViewer items={viewable} index={viewIndex} onIndex={index => setViewing(viewable[index].key)} onClose={() => setViewing(null)} onSave={item => void save(item)} saving={saving} />}
        {confirmingDelete && <ConfirmDialog title="Delete this comparison?" confirmLabel="Delete" busyLabel="Deleting…" danger busy={busy} onConfirm={() => void remove()} onCancel={() => setConfirmingDelete(false)}><p>The comparison and its previews are deleted. Your photo is not touched.</p></ConfirmDialog>}
      </div>
    </NeedsApi>
  )
}

function OutputCard({ output, comparisonId, recommended, onPreview, children }: { output: ComparisonOutput; comparisonId: number; recommended: boolean; onPreview?: () => void; children?: React.ReactNode }) {
  const warnings = Array.isArray(output.warnings) ? (output.warnings as unknown[]).filter(item => typeof item === 'string') as string[] : []
  return (
    <div className={`fc-card overflow-hidden ${recommended ? 'ring-2 ring-accent' : ''}`}>
      <div className="aspect-[4/3] bg-surface-mute flex items-center justify-center text-ink-faint">
        {output.preview_url
          ? <button type="button" onClick={onPreview} aria-label={`Look at ${output.label} larger`} className="block w-full h-full cursor-zoom-in"><AuthedImage load={signal => comparisonPreview(output, signal)} cacheKey={`compare-${comparisonId}-${output.profile}`} alt={output.label} className="w-full h-full !border-0 !object-contain" rounded="rounded-none" /></button>
          : output.failure_reason ? <p className="text-xs px-4 text-center text-red-400">{output.failure_reason}</p> : <Loader2 className="w-5 h-5 animate-spin" />}
      </div>
      <div className="p-3 space-y-1">
        <div className="flex items-center gap-2"><p className="text-sm font-semibold text-ink">{output.label}</p>{recommended && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30">Recommended</span>}</div>
        <p className="text-[11px] text-ink-faint">{output.description}</p>
        <p className="text-[11px] text-ink-mute">{output.overall_score !== null ? `Score ${Math.round(output.overall_score)} · ` : ''}{(output.processing_duration_ms / 1000).toFixed(1)} s · {output.outcome.replace(/_/g, ' ')}</p>
        {output.identity_notice && <p className="text-[11px] text-[#F59E0B]">{output.identity_notice}</p>}
        {warnings.map(warning => <p key={warning} className="text-[11px] text-ink-faint">{warning}</p>)}
        {children && <div className="pt-1.5 space-y-2">{children}</div>}
      </div>
    </div>
  )
}

/** One thing the comparison can show larger and save: the original, or one style. */
interface Viewable { key: string; label: string; note: string; load: (signal?: AbortSignal) => Promise<Blob>; download: () => Promise<Blob>; filename: string }

function CardActions({ onPreview, onSave, saving }: { onPreview: () => void; onSave: () => void; saving: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={onPreview} className="fc-btn-secondary !py-1.5 !px-3 text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer"><Eye className="w-3 h-3" />Preview</button>
      <button type="button" onClick={onSave} disabled={saving} className="fc-btn-secondary !py-1.5 !px-3 text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60">{saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}Download</button>
    </div>
  )
}

/** A style (or the original) at a large size, with the arrow keys and buttons to step through the others, and a way to save it. */
function CompareViewer({ items, index, onIndex, onClose, onSave, saving }: { items: Viewable[]; index: number; onIndex: (index: number) => void; onClose: () => void; onSave: (item: Viewable) => void; saving: string | null }) {
  const item = items[index]
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); onIndex((index - 1 + items.length) % items.length) }
      else if (event.key === 'ArrowRight') { event.preventDefault(); onIndex((index + 1) % items.length) }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [index, items.length, onIndex])
  return (
    <Modal
      title={item.label}
      onClose={onClose}
      huge
      footer={<>
        <span className="mr-auto self-center text-xs">{index + 1} of {items.length}{item.note ? ` · ${item.note}` : ''}</span>
        <button type="button" onClick={() => onIndex((index - 1 + items.length) % items.length)} disabled={items.length < 2} aria-label="Previous" className="fc-btn-secondary !py-2 !px-3 text-xs cursor-pointer disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
        <button type="button" onClick={() => onIndex((index + 1) % items.length)} disabled={items.length < 2} aria-label="Next" className="fc-btn-secondary !py-2 !px-3 text-xs cursor-pointer disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
        <button type="button" onClick={() => onSave(item)} disabled={saving === item.key} className="fc-btn-primary !py-2 !px-4 text-xs font-bold inline-flex items-center gap-2 disabled:opacity-60 cursor-pointer">{saving === item.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}Download</button>
      </>}
    >
      <div className="h-[min(70dvh,52rem)] rounded-2xl bg-surface-mute overflow-hidden">
        <AuthedImage key={item.key} load={signal => item.load(signal)} cacheKey={`viewer-${item.key}`} alt={item.label} className="w-full h-full !border-0 !object-contain" rounded="rounded-none" />
      </div>
    </Modal>
  )
}
