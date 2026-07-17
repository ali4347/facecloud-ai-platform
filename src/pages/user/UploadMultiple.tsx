import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { ArrowLeft, Upload, FileImage, CheckCircle, AlertTriangle, Play, Download, HelpCircle, X, Eye } from 'lucide-react'

interface UploadFileItem {
  name: string
  size: string
  status: 'pending' | 'processing' | 'success' | 'failed'
  progress: number
  outcome?: 'success' | 'blur_fail' | 'multi_face_fail'
  qualityScore?: number
  previewUrl?: string
  rawFile?: File
}

type Stage = 'select' | 'preview' | 'processing' | 'done'

export default function UploadMultiple() {
  const [stage, setStage] = useState<Stage>('select')
  const [filesList, setFilesList] = useState<UploadFileItem[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected: UploadFileItem[] = Array.from(e.target.files).map(f => ({
        name: f.name,
        size: `${(f.size / (1024 * 1024)).toFixed(2)} MB`,
        status: 'pending' as const,
        progress: 0,
        outcome: Math.random() > 0.3 ? ('success' as const) : Math.random() > 0.5 ? ('blur_fail' as const) : ('multi_face_fail' as const),
        previewUrl: URL.createObjectURL(f),
        rawFile: f,
      }))
      setFilesList(selected)
      setStage('preview')
    }
  }

  const removeFile = (idx: number) => {
    setFilesList(prev => prev.filter((_, i) => i !== idx))
  }

  const confirmAndUpload = async () => {
    if (filesList.length === 0) return
    setStage('processing')

    for (let i = 0; i < filesList.length; i++) {
      setFilesList(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'processing' } : f))
      for (let p = 0; p <= 100; p += 25) {
        setFilesList(prev => prev.map((f, idx) => idx === i ? { ...f, progress: p } : f))
        await new Promise(r => setTimeout(r, 150))
      }
      setFilesList(prev => prev.map((f, idx) => {
        if (idx === i) {
          const success = f.outcome === 'success'
          return {
            ...f,
            status: success ? 'success' : 'failed',
            qualityScore: success ? Math.floor(Math.random() * 15) + 85 : Math.floor(Math.random() * 20) + 30,
          }
        }
        return f
      }))
    }
    setStage('done')
  }

  const reset = () => {
    filesList.forEach(f => f.previewUrl && URL.revokeObjectURL(f.previewUrl))
    setFilesList([])
    setStage('select')
    if (inputRef.current) inputRef.current.value = ''
  }

  const totalFiles = filesList.length
  const acceptedCount = filesList.filter(f => f.status === 'success').length
  const rejectedCount = filesList.filter(f => f.status === 'failed').length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/dashboard/upload" className="p-2 rounded-xl hover:bg-white/5 border border-white/10 text-muted hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader
          title="Multiple Batch Upload"
          subtitle="Select your photos, review them, then confirm to start processing."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column */}
        <div className="lg:col-span-8 space-y-6">

          {/* ── SELECT STAGE ── */}
          {stage === 'select' && (
            <ChartCard title="Select Photos" subtitle="Choose multiple image files to upload">
              <label className="upload-dropzone block cursor-pointer">
                <input ref={inputRef} type="file" multiple onChange={handleFileChange} className="hidden" accept="image/*" />
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 rounded-full bg-primary/10 border border-primary/20 text-primary">
                    <Upload className="w-6 h-6 animate-pulse" />
                  </div>
                  <span className="text-xs font-bold text-dark">Click to browse or drop files here</span>
                  <span className="text-[10px] text-muted">Supports JPG, JPEG, PNG · up to 50 files</span>
                </div>
              </label>
            </ChartCard>
          )}

          {/* ── PREVIEW STAGE ── */}
          {stage === 'preview' && (
            <ChartCard
              title={`${filesList.length} photo${filesList.length !== 1 ? 's' : ''} selected`}
              subtitle="Review your selection, then confirm to start uploading"
            >
              <div className="space-y-4">
                {/* Thumbnail grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filesList.map((file, i) => (
                    <div key={i} className="relative group rounded-2xl overflow-hidden border border-white/10 bg-white/5 aspect-square">
                      {file.previewUrl ? (
                        <img src={file.previewUrl} alt={file.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileImage className="w-8 h-8 text-white/20" />
                        </div>
                      )}
                      {/* Overlay with name */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
                        <p className="text-[9px] text-white/80 font-medium truncate">{file.name}</p>
                        <p className="text-[8px] text-white/40">{file.size}</p>
                      </div>
                      {/* Remove button */}
                      <button
                        onClick={() => removeFile(i)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white hover:bg-red-500/80"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {filesList.length === 0 && (
                  <p className="text-center text-xs text-muted py-4">All files removed. Go back to select new files.</p>
                )}

                {/* Confirm / Cancel */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={reset}
                    className="fc-btn-secondary !py-2.5 !px-4 text-xs flex-1 justify-center"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmAndUpload}
                    disabled={filesList.length === 0}
                    className="fc-btn-primary !py-2.5 !px-4 text-xs flex-1 justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Confirm & Upload {filesList.length} photo{filesList.length !== 1 ? 's' : ''}
                  </button>
                </div>
              </div>
            </ChartCard>
          )}

          {/* ── PROCESSING / DONE STAGE ── */}
          {(stage === 'processing' || stage === 'done') && (
            <ChartCard
              title={stage === 'done' ? 'Upload complete' : 'Processing your photos…'}
              subtitle={stage === 'done' ? `${acceptedCount} accepted · ${rejectedCount} rejected` : 'Please wait while we enhance and validate each photo'}
            >
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {filesList.map((file, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      {file.previewUrl ? (
                        <img src={file.previewUrl} alt="" className="w-9 h-9 rounded-lg object-cover border border-white/10 shrink-0" />
                      ) : (
                        <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-muted shrink-0">
                          <FileImage className="w-4 h-4 text-[#8A96AD]" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-dark truncate max-w-[200px]">{file.name}</p>
                        <p className="text-[10px] text-muted mt-0.5">{file.size}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {file.status === 'pending' && (
                        <span className="text-muted font-semibold text-[10px] tracking-wider uppercase">Queued</span>
                      )}
                      {file.status === 'processing' && (
                        <div className="flex items-center gap-3">
                          <span className="text-primary font-bold text-[10px] animate-pulse">{file.progress}%</span>
                          <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all" style={{ width: `${file.progress}%` }} />
                          </div>
                        </div>
                      )}
                      {file.status === 'success' && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-mint uppercase">Accepted</span>
                          <CheckCircle className="w-3.5 h-3.5 text-mint" />
                        </div>
                      )}
                      {file.status === 'failed' && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-pink uppercase">
                            {file.outcome === 'blur_fail' ? 'Too blurry' : 'Multiple faces'}
                          </span>
                          <AlertTriangle className="w-3.5 h-3.5 text-pink" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {stage === 'done' && (
                <div className="flex gap-3 pt-4">
                  <button onClick={reset} className="fc-btn-secondary !py-2.5 !px-4 text-xs flex-1 justify-center">
                    Upload More
                  </button>
                  {acceptedCount > 0 && (
                    <button onClick={() => alert('Downloading batch ZIP…')} className="fc-btn-primary !py-2.5 !px-4 text-xs flex-1 justify-center gap-2">
                      <Download className="w-3.5 h-3.5" /> Download Accepted ({acceptedCount})
                    </button>
                  )}
                </div>
              )}
            </ChartCard>
          )}

        </div>

        {/* Right Column: Summary */}
        <div className="lg:col-span-4">
          <ChartCard title="Summary" subtitle="Upload results">
            {filesList.length === 0 && stage === 'select' ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-muted gap-2">
                <HelpCircle className="w-8 h-8 text-muted opacity-40" />
                <p className="text-xs font-semibold">Select photos to see a summary here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <span className="block text-[8px] text-muted font-bold uppercase tracking-wider">Selected</span>
                    <span className="block text-xl font-bold text-dark mt-1">{totalFiles}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <span className="block text-[8px] text-muted font-bold uppercase tracking-wider">Accepted</span>
                    <span className="block text-xl font-bold text-mint mt-1">
                      {stage === 'done' ? acceptedCount : '—'}
                    </span>
                  </div>
                </div>

                {stage === 'done' && (
                  <div className="space-y-2.5 p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-muted">
                    <div className="flex justify-between">
                      <span>Photos accepted:</span>
                      <span className="font-bold text-mint">{acceptedCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Photos rejected:</span>
                      <span className="font-bold text-pink">{rejectedCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Success rate:</span>
                      <span className="font-bold text-dark">
                        {totalFiles > 0 ? `${Math.round((acceptedCount / totalFiles) * 100)}%` : '0%'}
                      </span>
                    </div>
                  </div>
                )}

                {stage === 'preview' && (
                  <div className="p-4 rounded-2xl bg-[#0084FF]/[0.06] border border-[#0084FF]/20 text-xs text-[#60B1FF] font-medium">
                    <Eye className="w-4 h-4 mb-2 text-[#60B1FF]" />
                    Review your photos above. You can remove any before uploading.
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
