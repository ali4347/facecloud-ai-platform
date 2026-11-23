import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, ArrowLeft, Download, Eye, FileImage, HelpCircle, Loader2, Play, Upload, X,
} from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { uploadStatusBadge } from '../../components/ui/StatusBadge'
import { uploadMultiple, type ImageListItem, type UploadBatch } from '../../lib/api/images'
import { SubmitToSelect } from '../../components/features/SubmitToSelect'
import { PresetPicker } from '../../components/features/PresetPicker'
import { presetPair, type PresetKey } from '../../lib/enhancementPresets'
import { UPLOAD_LIMITS } from '../../components/features/uploadKinds'
import type { EnhancementLighting } from '../../lib/api/enhancements'
import { useSubmitTarget } from '../../lib/useSubmitTarget'
import { fetchBatchZip } from '../../lib/api/downloads'
import { formatBytes, statusLabel } from '../../lib/imageData'
import { saveBlob } from '../../lib/saveBlob'
import { tally, useFinishedBatch, useReasonBreakdown } from '../../lib/uploadBatch'
import { BatchStageList } from '../../components/features/BatchStageList'
import { BatchEnhancementPanel } from '../../components/features/BatchEnhancementPanel'
import { RejectionBreakdown } from '../../components/features/RejectionBreakdown'

/** How many photos one batch holds on this screen (the same figure the Upload Center card shows). */
const MAX_FILES = UPLOAD_LIMITS.photos

interface Picked { file: File; previewUrl: string }

/** A picture, or a file icon when the browser cannot draw the file (a text file, a PDF) so no broken-image icon shows. */
function Thumb({ src, alt, className, fill = false }: { src: string; alt: string; className: string; fill?: boolean }) {
  const [broken, setBroken] = useState(false)
  if (broken) {
    return <div className={fill ? 'w-full h-full flex items-center justify-center text-ink-mute' : 'p-2 rounded-xl bg-surface-mute border border-line text-ink-mute shrink-0'}><FileImage className={fill ? 'w-8 h-8' : 'w-4 h-4'} /></div>
  }
  return <img src={src} alt={alt} onError={() => setBroken(true)} className={className} />
}

export default function UploadMultipleLive({ embedded = false }: { embedded?: boolean }) {
  const target = useSubmitTarget()
  // Where this upload was sent: undefined is the person's own workspace, which has no moderator.
  const [sentTo, setSentTo] = useState<number | undefined>(undefined)
  // How the person wants these photos enhanced: a preset and a lighting, sent WITH the upload (the server's pipeline does the work). `sent` is what the
  // upload went with and what the server said it took (see BatchEnhancementPanel).
  const [preset, setPreset] = useState<PresetKey>('auto')
  const lighting: EnhancementLighting = 'auto'          // the lighting choice was removed from the screen: the engine decides
  const [sent, setSent] = useState<{ preset: PresetKey; lighting: EnhancementLighting; echoed: UploadBatch['auto_enhance_options'] } | null>(null)
  const [picked, setPicked] = useState<Picked[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState<ImageListItem[] | null>(null)
  const [batchId, setBatchId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [zipBusy, setZipBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const { progress, finished } = useFinishedBatch(batchId)
  const results = tally(progress)
  const breakdown = useReasonBreakdown(progress, finished)

  // Previews are object URLs: let go of them when the screen goes away.
  const pickedRef = useRef(picked)
  pickedRef.current = picked
  useEffect(() => () => pickedRef.current.forEach(item => URL.revokeObjectURL(item.previewUrl)), [])

  const stage: 'select' | 'preview' | 'uploading' | 'processing' | 'done' =
    batchId !== null ? (finished ? 'done' : 'processing')
    : uploading ? 'uploading'
    : picked.length > 0 ? 'preview' : 'select'

  const addFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(e.target.files ?? [])
    if (chosen.length === 0) return
    setError(null)
    const room = MAX_FILES - picked.length
    if (room <= 0) setError(`A batch holds up to ${MAX_FILES} photos and this one is full. Remove a photo to add another.`)
    else if (chosen.length > room) setError(`A batch holds up to ${MAX_FILES} photos, so only the first ${room} were added.`)
    setPicked(current => [
      ...current,
      ...chosen.slice(0, Math.max(room, 0)).map(file => ({ file, previewUrl: URL.createObjectURL(file) })),
    ])
    e.target.value = ''
  }

  const removeAt = (index: number) => setPicked(current => {
    URL.revokeObjectURL(current[index].previewUrl)
    return current.filter((_, i) => i !== index)
  })

  const reset = () => {
    picked.forEach(item => URL.revokeObjectURL(item.previewUrl))
    setPicked([]); setUploaded(null); setBatchId(null); setError(null); setUploading(false)
  }

  const confirmAndUpload = async () => {
    if (picked.length === 0) return
    setUploading(true)
    setError(null)
    try {
      setSentTo(target.organizationId)
      const made = await uploadMultiple(picked.map(item => item.file), { organizationId: target.organizationId, enhancement: { ...presetPair(preset), lighting } })
      setSent({ preset, lighting, echoed: made.auto_enhance_options })
      setUploaded(made.images ?? [])
      setBatchId(made.id)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const downloadAccepted = async () => {
    if (batchId === null) return
    setZipBusy(true)
    setError(null)
    try {
      const { blob, filename } = await fetchBatchZip(batchId, 'accepted_results')
      saveBlob(blob, filename)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not prepare the ZIP.')
    } finally {
      setZipBusy(false)
    }
  }

  const previewFor = (name: string) => picked.find(item => item.file.name === name)?.previewUrl
  const rows: ImageListItem[] = uploaded ?? []
  const progressFor = (imageId: number) => progress?.images.find(row => row.image_id === imageId)
  const rowHeading = stage === 'done' ? 'Upload complete' : 'Processing your photos…'

  return (
    <div className="space-y-6">
      {!embedded && (
        <div className="flex items-center gap-3">
          <Link to="/dashboard/upload" aria-label="Back to Upload Center" className="p-2 rounded-xl hover:bg-surface-mute border border-line text-ink-mute hover:text-ink">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <PageHeader
            title="Multiple Batch Upload"
            subtitle="Select your photos, review them, then confirm to start processing."
          />
        </div>
      )}

      {error && (
        <div role="alert" className="p-3 rounded-2xl text-xs flex items-start gap-2 bg-[#EF4444]/10 border border-[#EF4444]/25 text-[#F87171]">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">

          {stage === 'select' && (
            <ChartCard title="Select Photos" subtitle="Choose multiple image files to upload">
              <label className="upload-dropzone block cursor-pointer">
                <input ref={inputRef} type="file" multiple onChange={addFiles} className="hidden" accept="image/*" />
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 rounded-full bg-accent/10 border border-accent/20 text-accent">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-ink">Click to browse or drop files here</span>
                  <span className="text-[10px] text-ink-mute">JPG, PNG, WebP or HEIC · up to {MAX_FILES} photos per batch</span>
                </div>
              </label>
            </ChartCard>
          )}

          {(stage === 'preview' || stage === 'uploading') && (
            <ChartCard
              title={`${picked.length} photo${picked.length !== 1 ? 's' : ''} selected`}
              subtitle="Review your selection, then confirm to start uploading"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {picked.map((item, i) => (
                    <div key={`${item.file.name}-${i}`} className="relative group rounded-2xl overflow-hidden border border-line bg-surface-mute aspect-square">
                      <Thumb src={item.previewUrl} alt={item.file.name} fill className="w-full h-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
                        <p className="text-[9px] text-white/90 font-medium truncate">{item.file.name}</p>
                        <p className="text-[8px] text-white/60">{formatBytes(item.file.size)}</p>
                      </div>
                      {stage === 'preview' && (
                        <button
                          onClick={() => removeAt(i)} aria-label={`Remove ${item.file.name}`}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-white hover:bg-red-500/80"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {stage === 'uploading' ? (
                  <div className="flex items-center justify-center gap-2 py-3 text-xs font-semibold text-accent">
                    <Loader2 className="w-4 h-4 animate-spin" />Uploading {picked.length} photo{picked.length !== 1 ? 's' : ''}…
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                  <SubmitToSelect teams={target.teams} value={target.organizationId} onChange={target.setOrganizationId} />
                  <PresetPicker id="upload-preset" value={preset} onChange={setPreset} />
                  <div className="flex gap-3">
                    <button onClick={reset} className="fc-btn-secondary !py-2.5 !px-4 text-xs flex-1 justify-center">Cancel</button>
                    <label className="fc-btn-secondary !py-2.5 !px-4 text-xs flex-1 justify-center cursor-pointer">
                      Add more
                      <input type="file" multiple onChange={addFiles} className="hidden" accept="image/*" />
                    </label>
                    <button onClick={confirmAndUpload} className="fc-btn-primary !py-2.5 !px-4 text-xs flex-[2] justify-center gap-2">
                      <Play className="w-3.5 h-3.5" />
                      Confirm & Upload {picked.length} photo{picked.length !== 1 ? 's' : ''}
                    </button>
                  </div>
                  </div>
                )}
              </div>
            </ChartCard>
          )}

          {(stage === 'processing' || stage === 'done') && (
            <ChartCard
              title={rowHeading}
              subtitle={
                stage === 'done'
                  ? `${results.accepted} accepted · ${results.inReview} ${sentTo === undefined ? 'not sure about' : 'in review'} · ${results.rejected + results.failed} rejected or failed`
                  : `Checking each photo${progress ? ` · ${progress.progress_percentage}% done` : ''}`
              }
            >
              {stage === 'processing' && progress && (
                <div className="mb-4 w-full h-1.5 bg-surface-mute rounded-full overflow-hidden">
                  <div className="h-full bg-accent transition-all duration-500 rounded-full" style={{ width: `${progress.progress_percentage}%` }} />
                </div>
              )}

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {rows.map(image => {
                  const live = progressFor(image.id)
                  const preview = previewFor(image.original_name)
                  return (
                    <div key={image.id} className="p-4 rounded-2xl bg-surface-mute border border-line flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        {preview ? (
                          <Thumb src={preview} alt="" className="w-9 h-9 rounded-lg object-cover border border-line shrink-0" />
                        ) : (
                          <div className="p-2 rounded-xl bg-surface-mute border border-line text-ink-mute shrink-0"><FileImage className="w-4 h-4" /></div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-ink truncate max-w-[220px]" title={image.original_name}>{image.original_name}</p>
                          <p className="text-[10px] text-ink-mute mt-0.5">{formatBytes(image.file_size)}</p>
                          {stage === 'done' && image.rejection_reason && (
                            <p className="text-[10px] text-[#F87171] mt-0.5">{image.rejection_reason}</p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {stage === 'done' ? (
                          <div className="flex items-center gap-2">
                            {uploadStatusBadge(live?.status ?? (image.status === 'rejected' ? 'rejected' : image.display_status))}
                            {image.thumbnail_url && (
                              <Link to={`/dashboard/images/${image.id}`} aria-label={`Details for ${image.original_name}`} className="text-ink-mute hover:text-ink"><Eye className="w-3.5 h-3.5" /></Link>
                            )}
                          </div>
                        ) : live ? (
                          <div className="flex items-center gap-3">
                            <span className="text-accent font-bold text-[10px]">{statusLabel(live.status)} · {live.progress_percentage}%</span>
                            <div className="w-16 h-1 bg-surface-mute rounded-full overflow-hidden">
                              <div className="h-full bg-accent transition-all" style={{ width: `${live.progress_percentage}%` }} />
                            </div>
                          </div>
                        ) : (
                          <span className="text-ink-mute font-semibold text-[10px] tracking-wider uppercase">{image.status === 'rejected' ? 'Rejected' : 'Queued'}</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {stage === 'done' && (
                <div className="flex flex-wrap gap-3 pt-4">
                  <button onClick={reset} className="fc-btn-secondary !py-2.5 !px-4 text-xs flex-1 justify-center">Upload More</button>
                  <Link to="/dashboard/images" className="fc-btn-secondary !py-2.5 !px-4 text-xs flex-1 justify-center">View in My Images</Link>
                  {results.accepted > 0 && (
                    <button onClick={downloadAccepted} disabled={zipBusy} className="fc-btn-primary !py-2.5 !px-4 text-xs flex-1 justify-center gap-2 disabled:opacity-60">
                      {zipBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      {zipBusy ? 'Preparing ZIP…' : `Download Accepted (${results.accepted})`}
                    </button>
                  )}
                </div>
              )}
              {stage === 'done' && results.accepted > 0 && (
                <p className="text-[11px] text-ink-mute pt-3">The ZIP holds the enhanced version of each accepted photo and a report. The first time, enhancing them takes a few seconds.</p>
              )}
              {batchId !== null && (
                <p className="text-[11px] text-ink-mute pt-3">
                  <Link to={`/dashboard/processing/${batchId}`} className="font-semibold text-[#FB923C] hover:underline">See the processing details</Link>
                </p>
              )}
            </ChartCard>
          )}
        </div>

        <div className="lg:col-span-4">
          <ChartCard title="Summary" subtitle="Upload results">
            {stage === 'select' ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-ink-mute gap-2">
                <HelpCircle className="w-8 h-8 text-ink-mute opacity-40" />
                <p className="text-xs font-semibold">Select photos to see a summary here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-4 rounded-2xl bg-surface-mute border border-line">
                    <span className="block text-[8px] text-ink-mute font-bold uppercase tracking-wider">{stage === 'preview' || stage === 'uploading' ? 'Selected' : 'Uploaded'}</span>
                    <span className="block text-xl font-bold text-ink mt-1">{stage === 'preview' || stage === 'uploading' ? picked.length : rows.length}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface-mute border border-line">
                    <span className="block text-[8px] text-ink-mute font-bold uppercase tracking-wider">Accepted</span>
                    <span className="block text-xl font-bold text-emerald-400 mt-1">{stage === 'done' ? results.accepted : '—'}</span>
                  </div>
                </div>

                {stage === 'processing' && <div className="p-4 rounded-2xl bg-surface-mute border border-line"><BatchStageList progress={progress} /></div>}

                {stage === 'done' && (
                  <div className="space-y-2.5 p-4 rounded-2xl bg-surface-mute border border-line text-xs text-ink-mute">
                    <div className="flex justify-between"><span>Photos accepted:</span><span className="font-bold text-emerald-400">{results.accepted}</span></div>
                    <div className="flex justify-between"><span>{sentTo === undefined ? 'Not sure about (kept, no moderator in your workspace):' : 'Sent to a moderator:'}</span><span className="font-bold text-[#FCD34D]">{results.inReview}</span></div>
                    <div className="flex justify-between"><span>Photos rejected:</span><span className="font-bold text-accent-soft">{results.rejected + results.failed}</span></div>
                  </div>
                )}

                {stage === 'done' && <RejectionBreakdown groups={breakdown.groups} loading={breakdown.loading} />}
                {stage === 'done' && batchId !== null && <BatchEnhancementPanel batchId={batchId} choice={sent ? { preset: sent.preset, lighting: sent.lighting } : undefined} echoed={sent?.echoed} />}

                {(stage === 'preview') && (
                  <div className="p-4 rounded-2xl bg-[#F97316]/[0.06] border border-[#F97316]/20 text-xs text-[#FB923C] font-medium">
                    <Eye className="w-4 h-4 mb-2 text-[#FB923C]" />
                    Review your photos on the left. You can remove any before uploading.
                  </div>
                )}
              </div>
            )}
          </ChartCard>
        </div>
      </div>
    </div>
  )
}
