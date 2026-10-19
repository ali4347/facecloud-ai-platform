import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle, ArrowLeft, Check, Download, Eye, Loader2, RotateCcw, Save, Sparkles, Trash2, Wand2,
} from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { ApiError } from '../../lib/api/client'
import { USE_API } from '../../lib/api/config'
import { getImage, getImageThumbnail, type ImageListItem } from '../../lib/api/images'
import { getEnhancementResult, type EnhancementResult } from '../../lib/api/enhancements'
import {
  activateEdit, createPreview, deleteEdit, downloadEdit, fetchPreviewImage, getEditorConfiguration, getEdit,
  listEdits, savePreview,
  type EditIntent, type EditPreview, type EditVersion, type EditorConfiguration, type EditorSettings,
} from '../../lib/api/editor'
import { saveBlob } from '../../lib/saveBlob'
import { formatDateTime } from '../../lib/utils'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/** The sliders, in the groups a photo editor shows them in. */
const GROUPS: { title: string; hint?: string; names: string[] }[] = [
  { title: 'Light', names: ['brightness', 'contrast', 'shadows', 'highlights'] },
  { title: 'Colour', names: ['saturation', 'warmth'] },
  { title: 'Detail', names: ['sharpness'] },
  { title: 'AI tools', hint: 'These use models on the server and take a little longer.', names: ['lowlight', 'denoise', 'deblur', 'face_restore'] },
  { title: 'Blend', names: ['intensity'] },
]

const INTENTS: { value: EditIntent; label: string; hint: string }[] = [
  { value: 'auto', label: 'Auto', hint: 'Fixes clear technical faults only' },
  { value: 'brighten', label: 'Auto + brighten', hint: 'Also lifts a dark photo' },
  { value: 'preserve', label: 'Auto, keep tones', hint: 'Leaves brightness and contrast alone' },
]

function summarise(settings: EditorSettings, neutral: EditorSettings, labels: Record<string, string>): string {
  const changed = Object.keys(settings).filter(name => settings[name] !== neutral[name] && name in labels)
  return changed.length === 0 ? 'No changes' : changed.map(name => `${labels[name]} ${settings[name] > 0 && name !== 'intensity' ? '+' : ''}${Math.round(settings[name])}`).join(' · ')
}

export default function PhotoEditor() {
  const { id } = useParams<{ id: string }>()
  const imageId = id && /^\d+$/.test(id) ? Number(id) : null

  const [image, setImage] = useState<ImageListItem | null>(null)
  const [result, setResult] = useState<EnhancementResult | null>(null)
  const [config, setConfig] = useState<EditorConfiguration | null>(null)
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(true)

  const [settings, setSettings] = useState<EditorSettings>({})
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [baseUrl, setBaseUrl] = useState<string | null>(null)
  /* The photo as it was uploaded: what "Hold to compare" shows against the edit. */
  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  const [rendering, setRendering] = useState(false)
  const [previewError, setPreviewError] = useState('')
  const [showBefore, setShowBefore] = useState(false)

  const [saving, setSaving] = useState(false)
  const [savedNote, setSavedNote] = useState('')
  const [saveError, setSaveError] = useState('')
  const [versions, setVersions] = useState<EditVersion[]>([])
  const [toDelete, setToDelete] = useState<EditVersion | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const revision = useRef(0)
  const latest = useRef<EditPreview | null>(null)
  const sourceVersion = useRef('')
  const urls = useRef<string[]>([])
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pending = useRef<{ mode: 'manual' | 'auto'; intent?: EditIntent; adjustments?: EditorSettings } | null>(null)

  const neutral = config?.neutral_settings ?? {}
  const labels = useMemo(
    () => Object.fromEntries(Object.entries(config?.controls ?? {}).map(([name, control]) => [name, control.label])),
    [config],
  )

  const track = (blob: Blob) => { const url = URL.createObjectURL(blob); urls.current.push(url); return url }
  useEffect(() => () => {
    urls.current.forEach(URL.revokeObjectURL)
    if (timer.current) clearTimeout(timer.current)
  }, [])

  /* ── Load the photo, its enhanced result and the slider contract ── */
  useEffect(() => {
    if (!USE_API || imageId === null) { setLoading(false); return }
    const ctl = new AbortController()
    ;(async () => {
      try {
        const photo = await getImage(imageId, ctl.signal)
        setImage(photo)
        getImageThumbnail(photo.id, 1024, ctl.signal)
          .then(blob => { if (!ctl.signal.aborted) setOriginalUrl(track(blob)) })
          .catch(() => { /* the compare button falls back to the enhanced photo */ })
        const resultId = photo.latest_enhancement?.id
        if (!resultId) return
        const [enhanced, cfg] = await Promise.all([
          getEnhancementResult(resultId, ctl.signal),
          getEditorConfiguration(ctl.signal),
        ])
        setResult(enhanced)
        setConfig(cfg)
        setSettings({ ...cfg.neutral_settings })
        if (enhanced.status === 'completed') setVersions(await listEdits(enhanced.id, ctl.signal))
      } catch (caught) {
        if (!ctl.signal.aborted) setLoadError(caught instanceof Error ? caught.message : 'Could not open the editor.')
      } finally {
        if (!ctl.signal.aborted) setLoading(false)
      }
    })()
    return () => ctl.abort()
  }, [imageId])

  /* ── Previews: one at a time, newest wins ── */
  const render = useCallback(async (request: { mode: 'manual' | 'auto'; intent?: EditIntent; adjustments?: EditorSettings }, isBase = false) => {
    if (!result) return
    revision.current += 1
    const mine = revision.current
    setRendering(true); setPreviewError('')
    try {
      const preview = await createPreview(result.id, {
        revision: mine, mode: request.mode, adjustments: request.adjustments, intent: request.intent,
        source_version: sourceVersion.current || undefined,
      })
      sourceVersion.current = preview.source_version
      const blob = await fetchPreviewImage(preview.id)
      if (mine !== revision.current) return           // a newer request has been made meanwhile
      latest.current = preview
      const url = track(blob)
      setPreviewUrl(url)
      if (isBase) setBaseUrl(url)
      if (request.mode === 'auto' && preview.applied_adjustments) {
        setSettings(current => ({ ...current, ...pickKnown(preview.applied_adjustments, config) }))
      }
    } catch (caught) {
      if (mine !== revision.current) return
      setPreviewError(caught instanceof ApiError
        ? (caught.isThrottled ? 'Too many previews in a short time. Wait a moment and try again.' : caught.message)
        : 'Could not render the preview.')
    } finally {
      if (mine === revision.current) setRendering(false)
    }
  }, [result, config])

  // The first preview is the untouched enhanced photo; it is also what "hold to see before" shows.
  useEffect(() => {
    if (result?.status === 'completed' && config && !baseUrl && revision.current === 0) {
      void render({ mode: 'manual', adjustments: { ...config.neutral_settings } }, true)
    }
  }, [result, config, baseUrl, render])

  const schedule = (request: { mode: 'manual'; adjustments: EditorSettings }) => {
    pending.current = request
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => { const next = pending.current; pending.current = null; if (next) void render(next) }, 600)
  }

  const change = (name: string, value: number) => {
    const next = { ...settings, [name]: value }
    setSettings(next)
    setSavedNote('')
    schedule({ mode: 'manual', adjustments: next })
  }

  const reset = () => {
    if (!config) return
    const next = { ...config.neutral_settings }
    setSettings(next); setSavedNote('')
    if (timer.current) clearTimeout(timer.current)
    pending.current = null
    void render({ mode: 'manual', adjustments: next })
  }

  const runAuto = (intent: EditIntent) => {
    if (timer.current) clearTimeout(timer.current)
    pending.current = null
    setSavedNote('')
    void render({ mode: 'auto', intent })
  }

  /* ── Save as a new version, at full resolution ── */
  const save = async () => {
    if (!result) return
    setSaving(true); setSaveError(''); setSavedNote('')
    try {
      // Make sure the preview on screen is for exactly these settings.
      if (pending.current) {
        if (timer.current) clearTimeout(timer.current)
        const next = pending.current; pending.current = null
        await render(next)
      }
      const preview = latest.current
      if (!preview) throw new Error('There is no preview to save yet.')
      let edit = await savePreview(preview.id)
      const deadline = Date.now() + 180_000
      while (edit.status === 'queued' || edit.status === 'processing' || edit.status === 'pending') {
        if (Date.now() > deadline) throw new Error('Saving is taking longer than expected. It will appear in your versions when done.')
        await sleep(1500)
        edit = await getEdit(edit.id)
      }
      if (edit.status !== 'completed') throw new Error(edit.failure_reason || 'The edit could not be saved.')
      setVersions(await listEdits(result.id))
      setSavedNote('Saved as a new version. Your original and the enhanced photo are unchanged; this version is now the one shown and downloaded for this photo.')
    } catch (caught) {
      setSaveError(caught instanceof ApiError || caught instanceof Error ? caught.message : 'Could not save the edit.')
    } finally {
      setSaving(false)
    }
  }

  const switchToVersion = async (edit: EditVersion) => {
    try { await activateEdit(edit.id); setVersions(await listEdits(edit.enhancement_result)) }
    catch (caught) { setSaveError(caught instanceof Error ? caught.message : 'Could not switch version.') }
  }

  const downloadVersion = async (edit: EditVersion) => {
    try { saveBlob(await downloadEdit(edit.id), `facecloud-edit-${edit.id}.jpg`) }
    catch (caught) { setSaveError(caught instanceof Error ? caught.message : 'Download failed.') }
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true); setDeleteError('')
    try {
      await deleteEdit(toDelete.id)
      setVersions(await listEdits(toDelete.enhancement_result))
      setToDelete(null)
    } catch (caught) {
      setDeleteError(caught instanceof Error ? caught.message : 'Could not delete this version.')
    } finally {
      setDeleting(false)
    }
  }

  const changedNow = config ? summarise(settings, neutral, labels) : ''

  /* ── Screens ── */
  const back = (
    <div className="flex items-center gap-3">
      <Link to={imageId ? `/dashboard/images/${imageId}` : '/dashboard/images'} aria-label="Back to the photo"
        className="p-2 rounded-xl hover:bg-surface-mute border border-line text-ink-mute hover:text-ink">
        <ArrowLeft className="w-4 h-4" />
      </Link>
      <PageHeader title="Edit photo" subtitle={image ? image.original_name : 'Adjust light, colour and detail'} />
    </div>
  )

  if (!USE_API) {
    return (
      <div className="space-y-6 page-enter">
        {back}
        <div className="fc-card p-8 text-center text-xs text-ink-mute">The photo editor needs the live backend. It is not part of the demo build.</div>
      </div>
    )
  }
  if (loading) {
    return <div className="space-y-6 page-enter">{back}<div className="fc-card p-12 text-center text-ink-faint"><Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin" /><p className="text-xs font-semibold">Opening the editor…</p></div></div>
  }
  if (loadError || !image) {
    return <div className="space-y-6 page-enter">{back}<div className="fc-card p-10 text-center"><AlertTriangle className="w-6 h-6 mx-auto mb-3 text-[#EF4444]" /><p className="text-xs font-semibold text-ink">{loadError || 'This photo could not be found.'}</p></div></div>
  }
  if (!result || result.status !== 'completed') {
    return (
      <div className="space-y-6 page-enter">
        {back}
        <div className="fc-card p-8 text-center space-y-3">
          <Sparkles className="w-6 h-6 mx-auto text-accent" />
          <p className="text-sm font-semibold text-ink">This photo has no finished enhancement to edit yet.</p>
          <p className="text-xs text-ink-mute">The editor works on the enhanced version. Enhance the photo first, then come back.</p>
          <Link to={`/dashboard/images/${image.id}`} className="fc-btn-primary inline-flex !py-2 !px-4 text-xs font-bold">Go to the photo</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 page-enter">
      {back}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Picture ── */}
        <div className="lg:col-span-7 space-y-4">
          <ChartCard title="Preview" subtitle={showBefore ? 'Showing your original photo' : changedNow}>
            <div className="relative rounded-3xl overflow-hidden border border-line bg-surface-mute min-h-[320px] flex items-center justify-center">
              {(showBefore ? (originalUrl ?? baseUrl) : previewUrl) ? (
                <img src={(showBefore ? (originalUrl ?? baseUrl) : previewUrl) as string} alt={showBefore ? 'Your original photo' : 'Preview of your edit'} className="w-full max-h-[70vh] object-contain" />
              ) : (
                <Loader2 className="w-6 h-6 animate-spin text-ink-faint" />
              )}
              {showBefore && (
                <span className="absolute top-3 left-3 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-black/70 text-white">Original</span>
              )}
              {rendering && !showBefore && (
                <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-black/70 text-white">
                  <Loader2 className="w-3 h-3 animate-spin" />Updating
                </span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button type="button"
                onPointerDown={() => setShowBefore(true)} onPointerUp={() => setShowBefore(false)} onPointerLeave={() => setShowBefore(false)} onPointerCancel={() => setShowBefore(false)}
                onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setShowBefore(true) } }}
                onKeyUp={e => { if (e.key === ' ' || e.key === 'Enter') setShowBefore(false) }}
                onBlur={() => setShowBefore(false)}
                className="fc-btn-secondary !py-2 !px-3 text-xs font-bold flex items-center gap-2 select-none cursor-pointer">
                <Eye className="w-3.5 h-3.5" />Hold to see the original
              </button>
              <span className="text-[11px] text-ink-faint">Previews are rendered on the server at a reduced size. Saving makes a full-size version.</span>
            </div>
            {previewError && <p role="alert" className="mt-2 text-xs text-red-500">{previewError}</p>}
          </ChartCard>

          <ChartCard title="Versions" subtitle="Each save is a new version; the enhanced photo and your original are never changed">
            <p className="text-xs text-ink-mute mb-3">
              {versions.some(edit => edit.is_current && edit.status === 'completed')
                ? 'This photo currently shows and downloads your edit marked "Current". Choose "Use this" on another version to switch.'
                : 'This photo currently shows and downloads the enhanced photo. No saved edit is in use.'}
            </p>
            {versions.length === 0 ? (
              <p className="text-xs text-ink-mute">No saved edits yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {versions.map(edit => (
                  <li key={edit.id} className="py-3 flex items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink flex items-center gap-2">
                        {formatDateTime(edit.created_at)}
                        {edit.is_current && <span className="text-[10px] font-semibold text-emerald-500">Current</span>}
                        {edit.status !== 'completed' && <span className="text-[10px] font-semibold text-ink-faint">{edit.status}</span>}
                      </p>
                      <p className="text-xs text-ink-mute truncate">
                        {edit.mode === 'auto' ? 'Auto edit' : summarise(edit.requested_adjustments, neutral, labels)}
                        {edit.output_width && edit.output_height ? ` · ${edit.output_width} × ${edit.output_height}` : ''}
                      </p>
                    </div>
                    {edit.status === 'completed' && (
                      <div className="flex items-center gap-3 text-xs font-semibold">
                        {!edit.is_current && <button type="button" onClick={() => void switchToVersion(edit)} className="text-accent hover:underline cursor-pointer">Use this</button>}
                        <button type="button" onClick={() => void downloadVersion(edit)} className="text-ink-mute hover:text-ink inline-flex items-center gap-1 cursor-pointer"><Download className="w-3.5 h-3.5" />Download</button>
                        <button type="button" onClick={() => { setDeleteError(''); setToDelete(edit) }} aria-label="Delete this version" className="text-error hover:underline inline-flex items-center gap-1 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </ChartCard>
        </div>

        {/* ── Controls ── */}
        <div className="lg:col-span-5 space-y-4">
          <div className="fc-card p-5 space-y-4">
            <div>
              <p className="text-sm font-semibold text-ink flex items-center gap-2"><Wand2 className="w-4 h-4 text-accent" />Quick fix</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {INTENTS.map(intent => (
                  <button key={intent.value} type="button" title={intent.hint} onClick={() => runAuto(intent.value)} disabled={rendering}
                    className="fc-btn-secondary !py-1.5 !px-3 text-xs font-bold disabled:opacity-60 cursor-pointer">{intent.label}</button>
                ))}
                <button type="button" onClick={reset} disabled={rendering}
                  className="text-xs font-semibold text-ink-mute hover:text-ink inline-flex items-center gap-1.5 px-2 cursor-pointer disabled:opacity-60">
                  <RotateCcw className="w-3.5 h-3.5" />Reset
                </button>
              </div>
            </div>

            {GROUPS.map(group => {
              const controls = group.names.filter(name => config?.controls[name])
              if (controls.length === 0) return null
              return (
                <div key={group.title} className="space-y-3 border-t border-line pt-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">{group.title}</p>
                    {group.hint && <p className="text-[11px] text-ink-faint mt-0.5">{group.hint}</p>}
                  </div>
                  {controls.map(name => {
                    const control = config!.controls[name]
                    const value = settings[name] ?? control.neutral
                    const unavailable = control.model_backed && !control.available
                    return (
                      <div key={name} title={control.description} className={unavailable ? 'opacity-50' : ''}>
                        <div className="flex items-center justify-between">
                          <label htmlFor={`ctl-${name}`} className="text-xs font-semibold text-ink">{control.label}</label>
                          <span className="text-xs font-mono text-ink-mute tabular-nums">{Math.round(value)}</span>
                        </div>
                        <input id={`ctl-${name}`} type="range" className="w-full accent-orange-500"
                          min={control.minimum} max={control.maximum} step={control.step} value={value}
                          disabled={unavailable}
                          onChange={e => change(name, Number(e.target.value))}
                          onDoubleClick={() => change(name, control.neutral)} />
                        {unavailable && <p className="text-[10px] text-ink-faint">Not available on this server yet.</p>}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>

          <div className="fc-card p-5 space-y-3">
            <button type="button" onClick={() => void save()} disabled={saving || rendering}
              className="fc-btn-primary w-full justify-center !py-2.5 text-sm font-bold flex items-center gap-2 disabled:opacity-60 cursor-pointer">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving full-size version…' : 'Save as new version'}
            </button>
            {savedNote && (
              <div role="status" className="text-xs text-emerald-500 space-y-1.5">
                <p className="flex items-start gap-1.5"><Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />{savedNote}</p>
                <Link to={image ? `/dashboard/images/${image.id}` : '/dashboard/images'} className="font-semibold text-accent hover:underline ml-5 inline-block">View the photo</Link>
              </div>
            )}
            {saveError && <p role="alert" className="text-xs text-red-500">{saveError}</p>}
            <p className="text-[11px] text-ink-faint">Double-click a slider to put it back to zero.</p>
          </div>
        </div>
      </div>

      {toDelete && (
        <ConfirmDialog title="Delete this version?" confirmLabel="Delete version" busyLabel="Deleting…" danger busy={deleting} error={deleteError}
          onConfirm={() => void confirmDelete()} onCancel={() => setToDelete(null)}>
          <p>This edit is removed. The enhanced photo and your original stay as they are. If it is the current version, the photo falls back to your newest remaining edit, or to the enhanced photo when there is none.</p>
        </ConfirmDialog>
      )}
    </div>
  )
}

/** Only the sliders the editor knows, so an unexpected key from the server cannot appear as a stray value. */
function pickKnown(applied: EditorSettings, config: EditorConfiguration | null): EditorSettings {
  if (!config) return {}
  const out: EditorSettings = {}
  for (const name of Object.keys(config.controls)) if (typeof applied[name] === 'number') out[name] = applied[name]
  return out
}
