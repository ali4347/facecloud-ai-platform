import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, ArrowLeft, CheckCircle, Download, FileArchive, HelpCircle, Loader2, Play, X,
} from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { uploadZip, type UploadBatch } from '../../lib/api/images'
import { SubmitToSelect } from '../../components/features/SubmitToSelect'
import { useSubmitTarget } from '../../lib/useSubmitTarget'
import { fetchBatchZip } from '../../lib/api/downloads'
import { formatBytes, statusLabel } from '../../lib/imageData'
import { saveBlob } from '../../lib/saveBlob'
import { tally, useFinishedBatch, useReasonBreakdown } from '../../lib/uploadBatch'
import { BatchStageList } from '../../components/features/BatchStageList'
import { BatchEnhancementPanel } from '../../components/features/BatchEnhancementPanel'
import { RejectionBreakdown } from '../../components/features/RejectionBreakdown'

/** What the backend takes: a ZIP up to 2 GB. */
const MAX_ZIP_BYTES = 2 * 1024 * 1024 * 1024

export default function UploadZipLive() {
  const target = useSubmitTarget()
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [made, setMade] = useState<UploadBatch | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [zipBusy, setZipBusy] = useState(false)

  const { progress, finished } = useFinishedBatch(made?.id ?? null)
  const results = tally(progress)
  const done = finished
  const breakdown = useReasonBreakdown(progress, finished)

  const stage: 'select' | 'preview' | 'uploading' | 'processing' | 'done' =
    made ? (done ? 'done' : 'processing') : uploading ? 'uploading' : zipFile ? 'preview' : 'select'

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    if (file.size > MAX_ZIP_BYTES) { setError('That archive is larger than 2 GB, the most one upload can hold.'); return }
    setZipFile(file)
    e.target.value = ''
  }

  const reset = () => { setZipFile(null); setMade(null); setError(null); setUploading(false) }

  const confirmAndUpload = async () => {
    if (!zipFile) return
    setUploading(true)
    setError(null)
    try {
      setMade(await uploadZip(zipFile, undefined, target.organizationId))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const downloadAccepted = async () => {
    if (!made) return
    setZipBusy(true)
    setError(null)
    try {
      const { blob, filename } = await fetchBatchZip(made.id, 'accepted_results')
      saveBlob(blob, filename)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not prepare the ZIP.')
    } finally {
      setZipBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/dashboard/upload" aria-label="Back to Upload Center" className="p-2 rounded-xl hover:bg-surface-mute border border-line text-ink-mute hover:text-ink">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader
          title="ZIP Archive Upload"
          subtitle="Upload a ZIP of portrait photos for automated batch processing and grouping."
        />
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-2xl text-xs flex items-start gap-2 bg-[#EF4444]/10 border border-[#EF4444]/25 text-[#F87171]">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 space-y-6">
          <ChartCard title="Select Archive" subtitle="ZIP file dropzone">
            <div className="space-y-6">
              {stage === 'select' && (
                <label className="upload-dropzone block cursor-pointer">
                  <input type="file" onChange={pick} className="hidden" accept=".zip,application/zip" />
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 rounded-full bg-accent/10 border border-accent/20 text-accent">
                      <FileArchive className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-ink">Click to browse or drop a ZIP file here</span>
                    <span className="text-[10px] text-ink-mute">ZIP archives up to 2 GB</span>
                  </div>
                </label>
              )}

              {(stage === 'preview' || stage === 'uploading') && zipFile && (
                <div className="space-y-5">
                  <div className="p-5 rounded-3xl bg-surface-mute border border-line flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-accent/10 border border-accent/20 text-accent shrink-0"><FileArchive className="w-6 h-6" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-ink truncate">{zipFile.name}</p>
                      <p className="text-[10px] text-ink-mute mt-0.5">{formatBytes(zipFile.size)}</p>
                    </div>
                    {stage === 'preview' && (
                      <button onClick={reset} aria-label="Remove the archive"
                        className="w-7 h-7 rounded-full bg-surface-mute border border-line flex items-center justify-center text-ink-mute hover:text-ink hover:bg-red-500/20 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="p-4 rounded-2xl bg-[#F97316]/[0.06] border border-[#F97316]/20 text-xs text-[#FB923C] font-medium space-y-1">
                    <p className="font-bold">What happens next?</p>
                    <ul className="space-y-0.5 text-[#FB923C]/70 list-disc list-inside">
                      <li>Photos are extracted from the ZIP</li>
                      <li>Each photo is checked: face, sharpness, light and size</li>
                      <li>Accepted photos are grouped by person, if face grouping is on</li>
                      <li>Then you can enhance the accepted photos and download them</li>
                    </ul>
                  </div>

                  {stage === 'uploading' ? (
                    <div className="flex items-center justify-center gap-2 py-3 text-xs font-semibold text-accent">
                      <Loader2 className="w-4 h-4 animate-spin" />Uploading the archive…
                    </div>
                  ) : (
                    <div className="space-y-3">
                    <SubmitToSelect teams={target.teams} value={target.organizationId} onChange={target.setOrganizationId} />
                    <div className="flex gap-3">
                      <button onClick={reset} className="fc-btn-secondary !py-2.5 !px-4 text-xs flex-1 justify-center">Cancel</button>
                      <button onClick={confirmAndUpload} className="fc-btn-primary !py-2.5 !px-4 text-xs flex-1 justify-center gap-2">
                        <Play className="w-3.5 h-3.5" />Confirm & Upload
                      </button>
                    </div>
                    </div>
                  )}
                </div>
              )}

              {stage === 'processing' && made && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-accent font-bold">Processing your archive…</span>
                    <span className="text-ink-mute">{progress ? `${progress.progress_percentage}%` : '—'}</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-mute rounded-full overflow-hidden">
                    <div className="h-full bg-accent transition-all duration-500 rounded-full" style={{ width: `${progress?.progress_percentage ?? 0}%` }} />
                  </div>
                  <div className="bg-surface-mute p-4 rounded-2xl border border-line space-y-3">
                    <p className="text-[10px] text-ink-mute">Found {made.total_files} photo{made.total_files === 1 ? '' : 's'} in the archive{progress ? ` · ${statusLabel(progress.status)}` : ''}</p>
                    <BatchStageList progress={progress} />
                  </div>
                </div>
              )}

              {stage === 'done' && (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <CheckCircle className="w-4 h-4" />Your archive has been processed.
                </div>
              )}
            </div>
          </ChartCard>
        </div>

        <div className="lg:col-span-6">
          {stage !== 'done' && (
            <ChartCard
              title={stage === 'processing' ? 'Processing…' : 'Results'}
              subtitle={stage === 'processing' ? 'Enhancing and validating photos' : 'Will appear here when processing finishes'}
            >
              <div className="h-64 flex flex-col items-center justify-center text-center text-ink-mute gap-2">
                {stage === 'processing' || stage === 'uploading' ? (
                  <Loader2 className="w-8 h-8 text-accent animate-spin" />
                ) : (
                  <HelpCircle className="w-8 h-8 text-ink-mute opacity-40" />
                )}
                <p className="text-xs font-semibold">
                  {stage === 'processing' ? 'Processing your archive, please wait…'
                    : stage === 'uploading' ? 'Uploading, please wait…' : 'Upload a ZIP to see results here.'}
                </p>
              </div>
            </ChartCard>
          )}

          {stage === 'done' && made && (
            <ChartCard title="Processing Complete" subtitle="Your archive has been processed">
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-surface-mute border border-line space-y-3 text-xs text-ink-mute">
                  <div className="flex justify-between items-center pb-2 border-b border-line">
                    <span className="font-bold text-[10px] uppercase tracking-wider">Results</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Done</span>
                  </div>
                  <div className="flex justify-between"><span>Photos found in ZIP:</span><span className="font-bold text-ink">{made.total_files}</span></div>
                  <div className="flex justify-between"><span>Photos accepted:</span><span className="font-bold text-emerald-400">{results.accepted}</span></div>
                  <div className="flex justify-between"><span>Sent to a moderator:</span><span className="font-bold text-[#FCD34D]">{results.inReview}</span></div>
                  <div className="flex justify-between"><span>Photos rejected:</span><span className="font-bold text-accent-soft">{results.rejected + results.failed}</span></div>
                </div>

                <RejectionBreakdown groups={breakdown.groups} loading={breakdown.loading} />
                {made && <BatchEnhancementPanel batchId={made.id} />}

                <div className="space-y-3">
                  {results.accepted > 0 && (
                    <button onClick={downloadAccepted} disabled={zipBusy} className="fc-btn-primary w-full justify-center text-xs py-3 gap-2 disabled:opacity-60">
                      {zipBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      {zipBusy ? 'Preparing ZIP…' : 'Download Accepted Photos (ZIP)'}
                    </button>
                  )}
                  <Link to="/dashboard/images" className="fc-btn-secondary w-full justify-center text-xs py-3">View in My Images</Link>
                  <Link to="/dashboard/groups" className="fc-btn-secondary w-full justify-center text-xs py-3">See Person Folders</Link>
                  <Link to={`/dashboard/processing/${made.id}`} className="fc-btn-secondary w-full justify-center text-xs py-2 opacity-80 hover:opacity-100">See the processing details</Link>
                  <button onClick={reset} className="fc-btn-secondary w-full justify-center text-xs py-2 opacity-60 hover:opacity-100">Upload Another Archive</button>
                </div>
              </div>
            </ChartCard>
          )}
        </div>
      </div>
    </div>
  )
}
