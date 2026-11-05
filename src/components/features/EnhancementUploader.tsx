import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from 'react'
import { AlertTriangle, CheckCircle2, Download, Loader2, UploadCloud, X } from 'lucide-react'
import {
  downloadEnhanced, enhanceImage, getEnhancementResult, isEnhancementSettled,
  type EnhancementLevel, type EnhancementResult, type EnhancementStyle, type ProcessingSummary,
} from '../../lib/api/enhancements'
import { getBatchProgress, isBatchFinished, passedChecks, uploadSingle, uploadZip, type BatchProgress, type ImageListItem } from '../../lib/api/images'
import { listBatchPhotos } from '../../lib/batchEnhance'
import { readZipContents } from '../../lib/zipContents'
import { engineName, stageName } from '../../lib/stageNames'
import { UPLOAD_LIMITS } from './uploadKinds'
import styles from './EnhancementUploader.module.css'

/**
 * The three presets. The backend resolves a preset to a level + style pair (`enhancement/serializers.py` PRESETS); the pair is sent
 * instead of the name so this works on a backend that predates presets too, and the result reports the pair that was used either way.
 */
const PRESETS: { key: 'auto' | 'standard' | 'pro'; label: string; hint: string; level: EnhancementLevel; style: EnhancementStyle }[] = [
  { key: 'auto', label: 'Auto', hint: 'Fast', level: 'auto', style: 'natural' },
  { key: 'standard', label: 'Standard', hint: 'Balanced', level: 'high', style: 'natural' },
  { key: 'pro', label: 'Pro', hint: 'AI Max', level: 'high', style: 'ai_max' },
]
type PresetKey = (typeof PRESETS)[number]['key']

const POLL_MS = 2000
/**
 * Once a worker has taken a photo it may take this long (Pro on a 1200 x 1600 photo took 2 to 2.5 minutes on a busy laptop). Before that it may wait this long for a free worker:
 * up to three photos are sent at once and a server may run one job at a time, so the clock for the work itself must not start when the photo is sent (three Pro photos in a ZIP
 * made the third one "take longer than expected" while the server was still working through the others, and it finished a few seconds later).
 * The checks on a whole upload may take CHECK_TIMEOUT_MS.
 */
const ENHANCE_TIMEOUT_MS = 240_000
const QUEUE_TIMEOUT_MS = 900_000
const CHECK_TIMEOUT_MS = 600_000
/** Photos enhanced at once; stays well under the per-account limit on jobs in progress. */
const WORKERS = 3
/** The bar: 0 to 45 for sending and checking the upload, 45 to 100 for the enhancement. */
const CHECK_SHARE = 45

type Phase = 'idle' | 'uploading' | 'checking' | 'enhancing' | 'done'

interface Finished {
  photo: ImageListItem
  result: EnhancementResult
}

const isAbort = (caught: unknown) => caught instanceof DOMException && caught.name === 'AbortError'
const messageOf = (caught: unknown, fallback: string) => (caught instanceof Error && caught.message ? caught.message : fallback)

/** Sleep that ends early (by rejecting) when the person cancels. */
const wait = (ms: number, signal: AbortSignal) => new Promise<void>((resolve, reject) => {
  if (signal.aborted) { reject(new DOMException('Cancelled', 'AbortError')); return }
  const onAbort = () => { clearTimeout(timer); reject(new DOMException('Cancelled', 'AbortError')) }
  const timer = setTimeout(() => { signal.removeEventListener('abort', onAbort); resolve() }, ms)
  signal.addEventListener('abort', onAbort, { once: true })
})

const kindOf = (file: File): 'image' | 'zip' | null => {
  if (/\.zip$/i.test(file.name) || /zip/i.test(file.type)) return 'zip'
  return /^image\/(jpeg|png|webp)$/i.test(file.type) ? 'image' : null
}

const sizeLabel = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`)

/** Start the enhancement of one photo and poll it every 2 seconds until it stops moving. */
async function enhanceAndWait(photoId: number, preset: (typeof PRESETS)[number], signal: AbortSignal): Promise<EnhancementResult> {
  let result = await enhanceImage(photoId, { level: preset.level, style: preset.style })
  const queueDeadline = Date.now() + QUEUE_TIMEOUT_MS
  let workingSince = 0
  while (!isEnhancementSettled(result)) {
    // The work clock starts when a worker takes the photo, not when it was sent: until then the photo waits in the queue, which has its own limit (QUEUE_TIMEOUT_MS).
    if (result.status === 'processing' && workingSince === 0) workingSince = Date.now()
    const overdue = workingSince > 0 ? Date.now() - workingSince > ENHANCE_TIMEOUT_MS : Date.now() > queueDeadline
    if (overdue) throw new Error('This photo is taking longer than expected.')
    await wait(POLL_MS, signal)
    result = await getEnhancementResult(result.id, signal)
  }
  if (result.status === 'failed' || result.status === 'cancelled') throw new Error(result.failure_reason || 'The enhancement did not finish.')
  return result
}

/** Which engine did what, and whether an AI model or a plain filter did it. */
function SummaryBox({ summary }: { summary: ProcessingSummary | null | undefined }) {
  if (!summary) return null
  const { ai_applied: ai, classical_fallback: fallback, stages } = summary
  return (
    <section className={styles.summary} aria-label="Processing summary">
      <h4 className={styles.summaryTitle}>Processing summary</h4>
      <div className={styles.badges}>
        {ai && <span className={`${styles.badge} ${styles.good}`}><CheckCircle2 aria-hidden="true" /> AI enhancement applied</span>}
        {fallback && <span className={`${styles.badge} ${styles.warn}`}><AlertTriangle aria-hidden="true" /> Classical fallback used</span>}
        {!ai && !fallback && <span className={`${styles.badge} ${styles.neutral}`}>{stages.length > 0 ? 'Standard filters only' : 'Original kept'}</span>}
      </div>
      {fallback && <p className={styles.note}>For at least one step the AI model was not available, or its result was not accepted, so a standard filter did that step instead.</p>}
      {stages.length === 0
        ? <p className={styles.note}>No step changed this photo.</p>
        : (
          <ol className={styles.stages}>
            {stages.map((stage, index) => (
              <li key={`${stage.stage}-${index}`} className={styles.stage}>
                <span className={styles.stageName}>{stageName(stage.stage)}</span>
                <span className={styles.stageEngine}>
                  {engineName(stage.engine)}
                  {stage.fallback && <> · stood in for {stage.replaced?.length ? stage.replaced.map(engineName).join(', ') : 'an unavailable model'}</>}
                </span>
                <span className={`${styles.kind} ${stage.kind === 'ai' ? styles.kindAi : ''}`}>{stage.kind === 'ai' ? 'AI' : stage.kind === 'classical' ? 'Classical' : 'Unknown'}</span>
                {stage.fallback && <span className={`${styles.kind} ${styles.kindWarn}`}>Fallback</span>}
              </li>
            ))}
          </ol>
        )}
    </section>
  )
}

/** One enhanced photo: the picture, a download button and its processing summary. */
function ResultCard({ item }: { item: Finished }) {
  const { photo, result } = item
  const [url, setUrl] = useState('')
  const [problem, setProblem] = useState('')

  // The file is protected, so it is fetched with the bearer token and shown from memory.
  useEffect(() => {
    const controller = new AbortController()
    let objectUrl = ''
    downloadEnhanced(result.id, controller.signal)
      .then(blob => { objectUrl = URL.createObjectURL(blob); setUrl(objectUrl) })
      .catch(caught => { if (!isAbort(caught)) setProblem('The picture could not be loaded. Try again in a moment.') })
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [result.id])

  const save = () => {
    const link = document.createElement('a')
    link.href = url
    link.download = result.output_name || `enhanced-${photo.original_name}`
    link.click()
  }

  return (
    <article className={styles.card}>
      <div className={styles.preview}>
        {url
          ? <img className={styles.previewImage} src={url} alt={`Enhanced version of ${photo.original_name}`} />
          : problem
            ? <p className={styles.previewProblem}>{problem}</p>
            : <div className={styles.skeleton} role="status" aria-label="Loading the enhanced photo" />}
      </div>
      <div className={styles.cardBody}>
        <div>
          <h3 className={styles.cardTitle}>{photo.original_name}</h3>
          {result.output_width && result.output_height && <p className={styles.meta}>{result.output_width} × {result.output_height}px</p>}
        </div>
        {result.enhancement_summary && <p className={styles.sentence}>{result.enhancement_summary}</p>}
        {result.identity_notice && <p className={styles.notice}><AlertTriangle aria-hidden="true" /> {result.identity_notice}</p>}
        <SummaryBox summary={result.processing_summary} />
        <button type="button" className={styles.primary} onClick={save} disabled={!url}>
          <Download aria-hidden="true" /> Download
        </button>
      </div>
    </article>
  )
}

export default function EnhancementUploader() {
  const [preset, setPreset] = useState<PresetKey>('auto')
  const [file, setFile] = useState<File | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [percent, setPercent] = useState(0)
  const [label, setLabel] = useState('')
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')
  const [results, setResults] = useState<Finished[]>([])
  const [dragging, setDragging] = useState(false)
  const [enhancingSince, setEnhancingSince] = useState(0)
  const [now, setNow] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const runRef = useRef<AbortController | null>(null)
  const busy = phase !== 'idle' && phase !== 'done'

  useEffect(() => () => runRef.current?.abort(), [])

  // The bar moves only when a photo finishes and a Pro photo can take minutes, so the time spent is shown too.
  useEffect(() => {
    if (phase !== 'enhancing') return undefined
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [phase])
  const elapsed = phase === 'enhancing' && enhancingSince > 0 ? Math.max(0, Math.floor((now - enhancingSince) / 1000)) : 0

  const choose = (files: FileList | File[] | null) => {
    if (busy || !files || files.length === 0) return
    if (files.length > 1) { setError('Choose one photo or one ZIP at a time.'); return }
    const picked = files[0]
    if (!kindOf(picked)) { setError('Choose a JPG, PNG or WebP photo, or a ZIP of them.'); return }
    setError(''); setWarning(''); setResults([]); setPhase('idle'); setFile(picked)
  }

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    choose(event.target.files)
    event.target.value = ''
  }
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    choose(event.dataTransfer.files)
  }
  const onZoneKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); inputRef.current?.click() }
  }

  const clear = () => { setFile(null); setResults([]); setError(''); setWarning(''); setPhase('idle'); setPercent(0) }

  const cancel = () => {
    const sent = phase === 'enhancing'
    runRef.current?.abort()
    setPhase('idle'); setPercent(0); setLabel('')
    // Stopping ends the waiting here; the server has no way to withdraw a photo that was already sent (measured: it finished the job).
    if (sent) setWarning('Stopped. The photo is already in your library, and an enhancement that had started may still finish on the server.')
  }

  const start = async () => {
    if (!file || busy) return
    const kind = kindOf(file)
    const chosen = PRESETS.find(item => item.key === preset)
    if (!kind || !chosen) return
    const controller = new AbortController()
    runRef.current = controller
    const { signal } = controller
    setError(''); setWarning(''); setResults([]); setPercent(2); setPhase('uploading'); setLabel('Uploading…')

    try {
      if (kind === 'zip') {
        const inside = await readZipContents(file)
        if (!inside) throw new Error('Could not read that file as a ZIP archive. Check that it opens on your computer, then try again.')
        if (inside.photos === 0) throw new Error('That ZIP has no photos in it.')
        if (inside.photos === null || inside.photos > UPLOAD_LIMITS.zipPhotos) {
          throw new Error(`One ZIP takes up to ${UPLOAD_LIMITS.zipPhotos} photos, because enhancing photos is heavy for the GPU. Make a smaller ZIP and try again.`)
        }
      }

      // Not enhanced by the backend on arrival: the photos are enhanced below with the preset that was chosen.
      const batch = kind === 'zip' ? await uploadZip(file, signal, undefined, false) : await uploadSingle(file, signal, undefined, false)

      setPhase('checking'); setLabel('Checking the photo…')
      const checkStart = Date.now()
      let progress: BatchProgress = await getBatchProgress(batch.id, signal)
      while (!isBatchFinished(progress)) {
        if (Date.now() - checkStart > CHECK_TIMEOUT_MS) throw new Error('Checking is taking longer than expected. Try again in a moment.')
        setPercent(5 + (progress.progress_percentage / 100) * (CHECK_SHARE - 5))
        await wait(POLL_MS, signal)
        progress = await getBatchProgress(batch.id, signal)
      }
      if (progress.status === 'cancelled') throw new Error('This upload was cancelled.')

      const all = await listBatchPhotos(batch.id, signal)
      const accepted = all.filter(photo => passedChecks(photo.display_status))
      if (accepted.length === 0) {
        throw new Error(all.find(photo => photo.rejection_reason)?.rejection_reason || 'No photo passed the checks, so there is nothing to enhance.')
      }

      setEnhancingSince(Date.now()); setNow(Date.now()); setPhase('enhancing')
      let next = 0
      let finished = 0
      let failed = 0
      let firstError = ''
      const report = () => {
        setPercent(CHECK_SHARE + (finished / accepted.length) * (100 - CHECK_SHARE))
        setLabel(accepted.length === 1 ? 'Enhancing the photo…' : `Enhancing ${Math.min(finished + 1, accepted.length)} of ${accepted.length}…`)
      }
      report()

      const worker = async () => {
        while (next < accepted.length && !signal.aborted) {
          const photo = accepted[next]; next += 1
          try {
            const result = await enhanceAndWait(photo.id, chosen, signal)
            if (signal.aborted) return
            setResults(current => [...current, { photo, result }])
          } catch (caught) {
            if (isAbort(caught) || signal.aborted) return
            failed += 1
            if (!firstError) firstError = messageOf(caught, 'A photo could not be enhanced.')
          }
          finished += 1
          report()
        }
      }
      await Promise.all(Array.from({ length: Math.min(WORKERS, accepted.length) }, worker))
      if (signal.aborted) return

      if (failed === accepted.length) throw new Error(firstError || 'The enhancement did not finish.')
      const notes: string[] = []
      if (failed > 0) notes.push(`${failed} photo${failed === 1 ? '' : 's'} could not be enhanced: ${firstError}`)
      const turnedAway = all.length - accepted.length
      if (turnedAway > 0) notes.push(`${turnedAway} photo${turnedAway === 1 ? '' : 's'} did not pass the checks and ${turnedAway === 1 ? 'was' : 'were'} not enhanced.`)
      setWarning(notes.join(' '))
      setPercent(100); setLabel('Done'); setPhase('done')
    } catch (caught) {
      if (isAbort(caught) || signal.aborted) return
      setError(messageOf(caught, 'Something went wrong. Please try again.'))
      setPhase('idle'); setPercent(0); setLabel('')
    }
  }

  return (
    <section className={styles.root} aria-labelledby="enhancement-uploader-title">
      <header className={styles.header}>
        <h2 id="enhancement-uploader-title" className={styles.title}>Enhance your photo</h2>
        <p className={styles.subtitle}>Choose how strong the enhancement should be, then add a photo or a ZIP of up to {UPLOAD_LIMITS.zipPhotos} photos.</p>
      </header>

      <div className={styles.presets} role="radiogroup" aria-label="Enhancement preset">
        {PRESETS.map(item => (
          <button
            key={item.key}
            type="button"
            role="radio"
            aria-checked={preset === item.key}
            className={`${styles.preset} ${preset === item.key ? styles.presetActive : ''}`}
            onClick={() => setPreset(item.key)}
            disabled={busy}
          >
            <span className={styles.presetName}>{item.label}</span>
            <span className={styles.presetHint}>{item.hint}</span>
          </button>
        ))}
      </div>
      {preset === 'pro' && <p className={styles.note}>Pro uses the strongest models, so one photo can take a minute or two. A restored face is kept only if it still matches the person in your photo, and any step that fails a safety check is skipped.</p>}

      <div
        className={`${styles.zone} ${dragging ? styles.zoneActive : ''} ${busy ? styles.zoneDisabled : ''}`}
        role="button"
        tabIndex={busy ? -1 : 0}
        aria-disabled={busy}
        aria-label="Add a photo or a ZIP. Drop it here or press Enter to browse."
        onClick={() => { if (!busy) inputRef.current?.click() }}
        onKeyDown={onZoneKey}
        onDragOver={event => { event.preventDefault(); if (!busy) setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <UploadCloud className={styles.zoneIcon} aria-hidden="true" />
        <p className={styles.zoneTitle}>{dragging ? 'Drop it here' : 'Drag a photo or ZIP here, or browse'}</p>
        <p className={styles.zoneHint}>JPG, PNG or WebP, or a ZIP of them</p>
        <input ref={inputRef} className={styles.input} type="file" accept="image/jpeg,image/png,image/webp,.zip,application/zip" onChange={onPick} tabIndex={-1} />
      </div>

      {file && (
        <div className={styles.fileRow}>
          <div className={styles.fileInfo}>
            <p className={styles.fileName}>{file.name}</p>
            <p className={styles.meta}>{kindOf(file) === 'zip' ? 'ZIP' : 'Photo'} · {sizeLabel(file.size)}</p>
          </div>
          <div className={styles.actions}>
            {busy
              ? <button type="button" className={styles.ghost} onClick={cancel}><X aria-hidden="true" /> Cancel</button>
              : (
                <>
                  <button type="button" className={styles.ghost} onClick={clear}>Remove</button>
                  <button type="button" className={styles.primary} onClick={start}>{phase === 'done' ? 'Enhance again' : 'Enhance'}</button>
                </>
              )}
          </div>
        </div>
      )}

      {busy && (
        <div className={styles.progress} role="status" aria-live="polite">
          <div className={styles.progressTop}>
            <span className={styles.progressLabel}>
              <Loader2 className={styles.spin} aria-hidden="true" /> {label}
              {elapsed >= 5 && <span className={styles.meta} aria-hidden="true"> · {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</span>}
            </span>
            <span className={styles.meta}>{Math.round(percent)}%</span>
          </div>
          <div className={styles.track} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percent)} aria-label="Progress">
            <div className={styles.fill} style={{ width: `${percent}%` }} />
          </div>
        </div>
      )}

      {error && <div className={`${styles.alert} ${styles.alertError}`} role="alert"><AlertTriangle aria-hidden="true" /> {error}</div>}
      {warning && <div className={`${styles.alert} ${styles.alertWarn}`} role="status"><AlertTriangle aria-hidden="true" /> {warning}</div>}

      {results.length > 0 && (
        <div className={styles.results} aria-label="Results">
          {results.map(item => <ResultCard key={item.result.id} item={item} />)}
        </div>
      )}
    </section>
  )
}
