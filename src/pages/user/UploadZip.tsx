import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { ArrowLeft, FileArchive, CheckCircle, Download, Link2, HelpCircle, Play, X } from 'lucide-react'

type Stage = 'select' | 'preview' | 'processing' | 'done'

export default function UploadZip() {
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [stage, setStage] = useState<Stage>('select')
  const [progress, setProgress] = useState(0)

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setZipFile(e.target.files[0])
      setStage('preview')
      setProgress(0)
    }
  }

  const confirmAndProcess = async () => {
    if (!zipFile) return
    setStage('processing')
    for (let p = 0; p <= 100; p += 20) {
      setProgress(p)
      await new Promise(r => setTimeout(r, 400))
    }
    setStage('done')
  }

  const reset = () => {
    setZipFile(null)
    setStage('select')
    setProgress(0)
  }

  const fileSizeMB = zipFile ? (zipFile.size / (1024 * 1024)).toFixed(2) : '0'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/dashboard/upload" className="p-2 rounded-xl hover:bg-white/5 border border-white/10 text-muted hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader
          title="ZIP Archive Upload"
          subtitle="Upload a ZIP of portrait photos for automated batch processing and grouping."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Control Card */}
        <div className="lg:col-span-6 space-y-6">
          <ChartCard title="Select Archive" subtitle="ZIP file dropzone">
            <div className="space-y-6">

              {/* ── SELECT ── */}
              {stage === 'select' && (
                <label className="upload-dropzone block cursor-pointer">
                  <input type="file" onChange={handleZipChange} className="hidden" accept=".zip" />
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 rounded-full bg-primary/10 border border-primary/20 text-primary">
                      <FileArchive className="w-6 h-6 animate-pulse" />
                    </div>
                    <span className="text-xs font-bold text-dark">Click to browse or drop ZIP file here</span>
                    <span className="text-[10px] text-muted">Supports ZIP folders up to 200 MB</span>
                  </div>
                </label>
              )}

              {/* ── PREVIEW ── */}
              {stage === 'preview' && zipFile && (
                <div className="space-y-5">
                  {/* File card */}
                  <div className="p-5 rounded-3xl bg-white/5 border border-white/10 flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary shrink-0">
                      <FileArchive className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-dark truncate">{zipFile.name}</p>
                      <p className="text-[10px] text-muted mt-0.5">{fileSizeMB} MB</p>
                    </div>
                    <button
                      onClick={reset}
                      className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-muted hover:text-white hover:bg-red-500/20 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Info note */}
                  <div className="p-4 rounded-2xl bg-[#F97316]/[0.06] border border-[#F97316]/20 text-xs text-[#FB923C] font-medium space-y-1">
                    <p className="font-bold">What happens next?</p>
                    <ul className="space-y-0.5 text-[#FB923C]/70 list-disc list-inside">
                      <li>Photos are extracted from the ZIP</li>
                      <li>Each photo is enhanced and validated</li>
                      <li>Accepted photos are grouped by person</li>
                      <li>You can download results when done</li>
                    </ul>
                  </div>

                  {/* Confirm / Cancel */}
                  <div className="flex gap-3">
                    <button onClick={reset} className="fc-btn-secondary !py-2.5 !px-4 text-xs flex-1 justify-center">
                      Cancel
                    </button>
                    <button onClick={confirmAndProcess} className="fc-btn-primary !py-2.5 !px-4 text-xs flex-1 justify-center gap-2">
                      <Play className="w-3.5 h-3.5" />
                      Confirm & Extract
                    </button>
                  </div>
                </div>
              )}

              {/* ── PROCESSING ── */}
              {stage === 'processing' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-primary font-bold animate-pulse">Processing your archive…</span>
                    <span className="text-muted">{progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="text-[10px] text-muted space-y-1 bg-black/15 p-3 rounded-2xl border border-white/5">
                    <div>Unpacking archive…</div>
                    {progress >= 40 && <div className="text-primary">Found 14 image files</div>}
                    {progress >= 80 && <div className="text-mint">Enhancement and quality checks running…</div>}
                  </div>
                </div>
              )}

            </div>
          </ChartCard>
        </div>

        {/* Right Output Card */}
        <div className="lg:col-span-6">
          {(stage === 'select' || stage === 'preview' || stage === 'processing') && (
            <ChartCard
              title={stage === 'processing' ? 'Processing…' : 'Results'}
              subtitle={stage === 'processing' ? 'Enhancing and validating photos' : 'Will appear here when processing finishes'}
            >
              <div className="h-64 flex flex-col items-center justify-center text-center text-muted gap-2">
                {stage === 'processing' ? (
                  <FileArchive className="w-8 h-8 text-primary animate-spin" />
                ) : (
                  <HelpCircle className="w-8 h-8 text-muted opacity-40" />
                )}
                <p className="text-xs font-semibold">
                  {stage === 'processing' ? 'Processing your archive, please wait…' : 'Upload a ZIP to see results here.'}
                </p>
              </div>
            </ChartCard>
          )}

          {stage === 'done' && (
            <ChartCard title="Processing Complete" subtitle="Your archive has been processed">
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 text-xs text-muted">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="font-bold text-[10px] uppercase tracking-wider">Results</span>
                    <span className="text-mint font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Done
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Photos found in ZIP:</span>
                    <span className="font-bold text-dark">14 files</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Photos accepted:</span>
                    <span className="font-bold text-mint">12 photos</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Photos rejected:</span>
                    <span className="font-bold text-pink">2 photos</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Person groups created:</span>
                    <span className="font-bold text-dark">3 groups</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => alert('Downloading enhanced ZIP…')}
                    className="fc-btn-primary w-full justify-center text-xs py-3 gap-2"
                  >
                    <Download className="w-4 h-4" /> Download Accepted Photos (ZIP)
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('https://facecloud.ai/download/sec-zip-mock-987')
                      alert('Secure link copied to clipboard!')
                    }}
                    className="fc-btn-secondary w-full justify-center text-xs py-3 gap-2"
                  >
                    <Link2 className="w-4 h-4" /> Copy Secure Download Link
                  </button>
                  <button onClick={reset} className="fc-btn-secondary w-full justify-center text-xs py-2 opacity-60 hover:opacity-100">
                    Upload Another Archive
                  </button>
                </div>
              </div>
            </ChartCard>
          )}
        </div>

      </div>
    </div>
  )
}
