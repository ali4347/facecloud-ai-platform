import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { USE_API } from '../../lib/api/config'
import {
  getBatchProgress,
  getImage,
  getImageThumbnail,
  isBatchFinished,
  uploadSingle,
  type BatchProgress,
  type ImageListItem,
} from '../../lib/api/images'
import {
  downloadEnhanced,
  enhanceImage,
  getEnhancementResult,
  isEnhancementSettled,
  levelLabel,
  type EnhancementResult,
} from '../../lib/api/enhancements'
import { BeforeAfterSlider } from '../../components/features/BeforeAfterSlider'
import { QualityScores } from '../../components/features/QualityScores'
import { demoImages, formatBytes, statusLabel } from '../../lib/imageData'
import {
  AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Info, Loader2,
  RefreshCw, ScanFace, Sparkles, Upload, Wand2, XCircle,
} from 'lucide-react'

/**
 * The stages the backend actually reports, with wording for the person
 * uploading. Which models do the work is not their concern, so the labels
 * describe what is happening rather than what it is running.
 */
const STAGES: { key: string; label: string; detail: string }[] = [
  { key: 'uploaded', label: 'Upload received', detail: 'Your photo reached FaceCloud safely' },
  { key: 'queued', label: 'Queued', detail: 'Waiting for a free processing slot' },
  { key: 'preprocessing', label: 'Preparing the photo', detail: 'Reading it and standardising the format' },
  { key: 'face_validation', label: 'Looking for faces', detail: 'Checking a face is present and clear enough' },
  { key: 'quality_analysis', label: 'Checking quality', detail: 'Sharpness, lighting and how large the face is' },
  { key: 'identity_grouping', label: 'Matching to person folders', detail: 'Grouping this face with the same person' },
  { key: 'enhancement', label: 'Enhancing', detail: 'Improving exposure and detail' },
  { key: 'finalizing', label: 'Finishing up', detail: 'Saving the result and your download' },
  { key: 'completed', label: 'Done', detail: 'Ready to view' },
]

const POLL_MS = 2500
/** The demo walks the same stages so the prototype still shows the flow. */
const DEMO_STEP_MS = 650

const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,image/bmp,image/tiff,image/gif'

type Phase = 'idle' | 'uploading' | 'processing' | 'done' | 'failed'

function stageIndex(stage: string): number {
  const found = STAGES.findIndex(entry => entry.key === stage)
  return found === -1 ? 0 : found
}

export default function UploadSingle() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [progress, setProgress] = useState<BatchProgress | null>(null)
  const [demoStage, setDemoStage] = useState(0)
  const [image, setImage] = useState<ImageListItem | null>(null)
  const [error, setError] = useState('')
  const [batchId, setBatchId] = useState<number | null>(null)
  const [enhancement, setEnhancement] = useState<EnhancementResult | null>(null)
  const [enhancing, setEnhancing] = useState(false)
  const [enhanceError, setEnhanceError] = useState('')
  // Both sides of the comparison, fetched with the token and handed to the
  // browser as object URLs. Revoked together when the screen resets.
  const [comparison, setComparison] = useState<{ before: string; after: string } | null>(null)

  // The preview is a local object URL; revoke it rather than leaking one per
  // file the person tries.
  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (pollRef.current) clearTimeout(pollRef.current) }, [])

  const chooseFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = event.target.files?.[0] ?? null
    setFile(chosen)
    setError('')
    setPhase('idle')
    setProgress(null)
    setImage(null)
    setBatchId(null)
  }

  const reset = () => {
    if (pollRef.current) clearTimeout(pollRef.current)
    if (comparison) {
      URL.revokeObjectURL(comparison.before)
      URL.revokeObjectURL(comparison.after)
    }
    setFile(null)
    setPreviewUrl('')
    setPhase('idle')
    setProgress(null)
    setDemoStage(0)
    setImage(null)
    setError('')
    setBatchId(null)
    setEnhancement(null)
    setEnhancing(false)
    setEnhanceError('')
    setComparison(null)
  }

  /**
   * Enhance the accepted photo, then load both sides of the comparison.
   *
   * Enhancing is a separate step from uploading on the backend, so it is
   * started here rather than assumed. A **429** means the account already has
   * as many enhancement jobs running as it is allowed; the message says so and
   * the right answer is to wait, not to retry.
   */
  const enhance = async (accepted: ImageListItem) => {
    setEnhancing(true)
    setEnhanceError('')
    try {
      let result = await enhanceImage(accepted.id)
      // The job can come back already finished, or still running.
      for (let attempt = 0; attempt < 20 && !isEnhancementSettled(result); attempt += 1) {
        await new Promise(resolve => setTimeout(resolve, 1500))
        result = await getEnhancementResult(result.id)
      }
      setEnhancement(result)
      if (result.status !== 'completed') {
        setEnhanceError(result.failure_reason || 'The enhancement did not finish.')
        return
      }
      const [before, after] = await Promise.all([
        getImageThumbnail(accepted.id, 1024),
        downloadEnhanced(result.id),
      ])
      setComparison({
        before: URL.createObjectURL(before),
        after: URL.createObjectURL(after),
      })
    } catch (caught) {
      setEnhanceError(caught instanceof Error ? caught.message : 'Could not enhance this photo.')
    } finally {
      setEnhancing(false)
    }
  }

  /** Walk the same stages on a timer when there is no server to talk to. */
  const runDemo = () => {
    setPhase('processing')
    let step = 0
    const advance = () => {
      step += 1
      setDemoStage(step)
      if (step < STAGES.length - 1) {
        pollRef.current = setTimeout(advance, DEMO_STEP_MS)
      } else {
        // Show a complete result rather than an empty card: the demo exists so
        // the screen can be seen working without a server behind it.
        const sample = demoImages().find(row => row.display_status === 'accepted')
        if (sample) {
          // Keep the demo's representative scores, but report the real file the
          // person actually picked rather than the sample's name and size.
          setImage({
            ...sample,
            original_name: file?.name ?? sample.original_name,
            file_size: file?.size ?? sample.file_size,
            width: null,
            height: null,
          })
        }
        setPhase('done')
      }
    }
    pollRef.current = setTimeout(advance, DEMO_STEP_MS)
  }

  /**
   * Follow the batch until it stops moving.
   *
   * A batch can finish as `partial` — some photos through, some not — so the
   * end of processing is not the same as success. The result card reads the
   * image's own verdict rather than assuming.
   */
  const follow = async (id: number) => {
    try {
      const next = await getBatchProgress(id)
      setProgress(next)
      if (!isBatchFinished(next)) {
        pollRef.current = setTimeout(() => follow(id), POLL_MS)
        return
      }
      const imageId = next.images[0]?.image_id
      let finished: ImageListItem | null = null
      if (imageId) {
        finished = await getImage(imageId)
        setImage(finished)
      }
      setPhase(next.status === 'failed' ? 'failed' : 'done')
      // Uploading and enhancing are separate steps on the backend. A photo that
      // was not accepted is not enhanced -- there is nothing to improve into.
      if (finished && finished.display_status === 'accepted') {
        enhance(finished)
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Lost contact while processing.')
      setPhase('failed')
    }
  }

  const start = async () => {
    if (!file) return
    setError('')

    if (!USE_API) {
      runDemo()
      return
    }

    setPhase('uploading')
    try {
      const batch = await uploadSingle(file)
      setBatchId(batch.id)
      // The file can be refused on arrival — wrong type, too large, a face the
      // validator will not accept — and that is a finished batch, not a failure
      // to upload. Following it reports whichever it was.
      setPhase('processing')
      follow(batch.id)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The upload did not go through.')
      setPhase('failed')
    }
  }

  const activeStage = USE_API ? stageIndex(progress?.stage ?? 'uploaded') : demoStage
  const percent = USE_API
    ? Math.round(progress?.progress_percentage ?? 0)
    : Math.round((demoStage / (STAGES.length - 1)) * 100)

  const verdict = image?.display_status ?? (phase === 'done' && !USE_API ? 'accepted' : null)
  const accepted = verdict === 'accepted'
  const rejected = verdict === 'rejected'

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard/upload"
          className="p-2 rounded-xl hover:bg-surface-mute border border-line text-ink-mute hover:text-ink"
          aria-label="Back to upload options"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader
          title="Upload a Photo"
          subtitle="Review your photo below, then confirm to start processing."
        />
      </div>

      {!USE_API && (
        <div className="p-3 rounded-2xl text-xs flex items-center gap-2 bg-surface-mute border border-line text-ink-soft">
          <AlertTriangle className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
          Demo mode — nothing is uploaded. Set <code className="fc-kbd">VITE_USE_API=true</code> to process real photos.
        </div>
      )}

      {error && (
        <div className="p-3 rounded-2xl text-xs bg-[#EF4444]/10 border border-[#EF4444]/25 text-[#F87171]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Once there is a result, the picker has done its job and the result
            takes the width instead of sitting beside an empty column. */}
        <div className={phase === 'done' ? 'hidden' : 'lg:col-span-6 space-y-6'}>
          <ChartCard title="Select a photo" subtitle="One photo at a time">
            <div className="space-y-6">
              {!file ? (
                <label className="upload-dropzone block cursor-pointer">
                  <input type="file" onChange={chooseFile} className="hidden" accept={ACCEPTED_TYPES} />
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 rounded-full bg-[#F97316]/10 border border-[#F97316]/25 text-[#F97316]">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-ink">Click to browse, or drop a file here</span>
                    <span className="text-[10px] text-ink-faint">
                      JPG, PNG, WebP, BMP, TIFF or a still GIF
                    </span>
                  </div>
                </label>
              ) : (
                <div className="relative rounded-3xl overflow-hidden border border-line bg-surface-mute flex items-center justify-center">
                  {/* Capped rather than a fixed aspect: a portrait photo in a
                      4:3 box is mostly empty box. */}
                  <img
                    src={previewUrl}
                    alt={file.name}
                    className="max-h-[420px] w-auto max-w-full object-contain"
                  />
                  {phase === 'idle' && (
                    <button
                      type="button"
                      onClick={reset}
                      className="absolute top-4 right-4 p-2.5 rounded-xl bg-black/60 border border-white/20 hover:bg-black/80 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Choose another
                    </button>
                  )}
                </div>
              )}

              {file && phase === 'idle' && (
                <>
                  <p className="text-[10px] text-ink-faint font-medium">
                    {file.name} · {formatBytes(file.size)} — FaceCloud will check the photo's quality,
                    find the face, enhance it and file it under the right person.
                  </p>
                  <button
                    type="button"
                    onClick={start}
                    className="fc-btn-primary w-full justify-center py-3 font-bold cursor-pointer flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" /> Confirm &amp; upload
                  </button>
                </>
              )}

              {(phase === 'uploading' || phase === 'processing') && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#FB923C] font-bold">
                      {phase === 'uploading' ? 'Uploading…' : 'Processing your photo…'}
                    </span>
                    <span className="text-ink-mute font-mono font-bold">{percent}%</span>
                  </div>
                  <div className="w-full h-1 bg-surface-mute rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#F97316] to-[#10B981] transition-all duration-500"
                      style={{ width: `${Math.max(percent, 4)}%` }}
                    />
                  </div>
                  <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                    {STAGES.map((stage, index) => (
                      <div
                        key={stage.key}
                        className="flex gap-3 items-start text-xs"
                        style={{ opacity: index > activeStage ? 0.35 : 1 }}
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0 text-[10px] font-bold ${
                          index < activeStage ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20'
                          : index === activeStage ? 'bg-[#F97316]/20 text-[#FB923C] border border-[#F97316]/30 animate-pulse'
                          : 'bg-surface-mute text-ink-faint border border-line'
                        }`}>
                          {index < activeStage ? '✓' : index + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-ink">{stage.label}</p>
                          <p className="text-[10px] text-ink-faint">{stage.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ChartCard>
        </div>

        <div className={phase === 'done' ? 'lg:col-span-12 space-y-6' : 'lg:col-span-6 space-y-6'}>
          <ChartCard title="Result" subtitle="What the pipeline concluded">
            {phase === 'idle' && (
              <div className="text-center py-16 text-ink-faint">
                <Info className="w-7 h-7 mx-auto mb-3 opacity-40" />
                <p className="text-xs font-semibold">Nothing to show yet.</p>
                <p className="text-[10px] mt-1">Pick a photo and confirm to begin.</p>
              </div>
            )}

            {(phase === 'uploading' || phase === 'processing') && (
              <div className="text-center py-16 text-ink-faint">
                <Loader2 className="w-7 h-7 mx-auto mb-3 animate-spin" />
                <p className="text-xs font-semibold">
                  {phase === 'uploading' ? 'Sending your photo…' : 'Working on it…'}
                </p>
                <p className="text-[10px] mt-1">This usually takes a few seconds.</p>
              </div>
            )}

            {phase === 'failed' && (
              <div className="text-center py-16">
                <XCircle className="w-8 h-8 mx-auto mb-3 text-[#EF4444]" />
                <p className="text-xs font-semibold text-ink">That did not go through.</p>
                <p className="text-[10px] text-ink-faint mt-1">{error || 'Please try again.'}</p>
                <button
                  type="button"
                  onClick={reset}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#FB923C] hover:underline cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />Start over
                </button>
              </div>
            )}

            {phase === 'done' && (
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  {accepted
                    ? <CheckCircle2 className="w-7 h-7 text-[#10B981] flex-shrink-0" />
                    : rejected
                      ? <XCircle className="w-7 h-7 text-[#EF4444] flex-shrink-0" />
                      : <AlertTriangle className="w-7 h-7 text-[#F59E0B] flex-shrink-0" />}
                  <div>
                    <p className="text-sm font-bold text-ink">
                      {accepted ? 'Your photo was accepted'
                        : rejected ? 'Your photo was not accepted'
                        : 'A moderator will take a look'}
                    </p>
                    <p className="text-[11px] text-ink-faint mt-0.5">
                      {accepted ? 'It passed every check and has been filed.'
                        : rejected ? 'The reason is below — a clearer photo usually fixes it.'
                        : 'The automatic checks were not confident enough to decide on their own.'}
                    </p>
                  </div>
                </div>

                {/* Before and after, once there is something to compare. */}
                {accepted && (
                  /* Capped and centred: full width leaves a portrait photo
                     stranded in empty space. */
                  <div className="space-y-2 max-w-3xl mx-auto w-full">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-mute flex items-center gap-1.5">
                        <Wand2 className="w-3.5 h-3.5" />Enhancement
                      </span>
                      {enhancement?.status === 'completed' && (
                        <span className="text-[10px] font-bold text-[#FB923C]">
                          {levelLabel(enhancement.applied_level)} correction
                        </span>
                      )}
                    </div>

                    {comparison ? (
                      <>
                        <div className="rounded-3xl overflow-hidden border border-line">
                          <BeforeAfterSlider
                            className="aspect-[4/3]"
                            beforeSrc={comparison.before}
                            afterSrc={comparison.after}
                          />
                        </div>
                        <p className="text-[10px] text-ink-faint">
                          Drag the handle to compare. The original is never overwritten.
                        </p>
                      </>
                    ) : enhancing ? (
                      <div className="rounded-3xl border border-line bg-surface-mute aspect-[4/3] flex flex-col items-center justify-center gap-2 text-ink-faint">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <p className="text-[11px] font-semibold">Enhancing your photo…</p>
                      </div>
                    ) : enhanceError ? (
                      <p className="text-[11px] text-[#F87171]">{enhanceError}</p>
                    ) : !USE_API && previewUrl ? (
                      <>
                        <div className="rounded-3xl overflow-hidden border border-line bg-surface-mute flex items-center justify-center">
                          <img
                            src={previewUrl}
                            alt={file?.name ?? 'Your photo'}
                            className="max-h-[360px] w-auto max-w-full object-contain"
                          />
                        </div>
                        <p className="text-[10px] text-ink-faint">
                          Enhancing runs on the server. Connect the API to see the before and after here.
                        </p>
                      </>
                    ) : (
                      <p className="text-[11px] text-ink-faint">Not enhanced yet.</p>
                    )}
                  </div>
                )}

                {/* The details read underneath the photo, side by side. */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                {/* What the checks measured, rather than a verdict alone. */}
                {image?.quality_decision && (
                  <div className="p-4 rounded-3xl bg-surface-mute border border-line">
                    <QualityScores quality={image.quality_decision} compact sample={!USE_API} />
                  </div>
                )}

                {image && (
                  <div className="p-4 rounded-3xl bg-surface-mute border border-line space-y-3 text-xs text-ink-mute">
                    <div className="flex justify-between gap-3">
                      <span>Photo:</span>
                      <span className="font-bold text-ink truncate">{image.original_name}</span>
                    </div>
                    {/* Also a measurement, so also absent without a server. */}
                    {USE_API && image.face_validation?.face_count != null && (
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1.5">
                          <ScanFace className="w-3.5 h-3.5" />Faces found:
                        </span>
                        <span className="font-bold text-ink">{image.face_validation.face_count}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span className="font-bold text-ink">
                        {image.width && image.height && `${image.width}×${image.height} · `}
                        {formatBytes(image.file_size)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Outcome:</span>
                      <span className="font-bold text-ink">{statusLabel(image.display_status)}</span>
                    </div>
                    {image.rejection_reason && (
                      <div className="pt-2 border-t border-line-soft">
                        <p className="text-[#F87171]">{image.rejection_reason}</p>
                      </div>
                    )}
                    {!image.rejection_reason
                      && image.quality_decision?.rejection_reasons
                      && image.quality_decision.rejection_reasons.length > 0 && (
                      <div className="pt-2 border-t border-line-soft">
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-1">What stood out</p>
                        <ul className="list-disc list-inside space-y-0.5">
                          {image.quality_decision.rejection_reasons.map(reason => (
                            <li key={reason}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {progress && progress.status === 'partial' && (
                  <p className="text-[11px] text-[#F59E0B]">
                    The batch finished partly — check My Images for the full picture.
                  </p>
                )}
                </div>

                <div className="flex flex-wrap gap-3">
                  {image && USE_API && (
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard/images/${image.id}`)}
                      className="fc-btn-primary !py-2 !px-4 text-xs font-bold cursor-pointer flex items-center gap-1.5"
                    >
                      View the photo <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {batchId && (
                    <Link
                      to={`/dashboard/processing/${batchId}`}
                      className="px-4 py-2 rounded-xl text-xs font-bold border border-line text-ink-soft hover:text-ink transition-colors"
                    >
                      Processing detail
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={reset}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-line text-ink-soft hover:text-ink transition-colors cursor-pointer"
                  >
                    Upload another
                  </button>
                </div>
              </div>
            )}
          </ChartCard>
        </div>
      </div>
    </div>
  )
}
