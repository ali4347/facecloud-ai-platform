import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { ArrowLeft, Upload, FileImage, CheckCircle, AlertTriangle, Play, Download, HelpCircle } from 'lucide-react'

interface UploadFileItem {
  name: string
  size: string
  status: 'pending' | 'processing' | 'success' | 'failed'
  progress: number
  outcome?: 'success' | 'blur_fail' | 'multi_face_fail'
  qualityScore?: number
}

export default function UploadMultiple() {
  const [filesList, setFilesList] = useState<UploadFileItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files).map(f => ({
        name: f.name,
        size: `${(f.size / (1024 * 1024)).toFixed(2)} MB`,
        status: 'pending' as const,
        progress: 0,
        outcome: Math.random() > 0.3 ? ('success' as const) : Math.random() > 0.5 ? ('blur_fail' as const) : ('multi_face_fail' as const)
      }))
      setFilesList(selected)
      setIsFinished(false)
    }
  }

  const runBatchPipeline = async () => {
    if (filesList.length === 0) return
    setIsProcessing(true)
    
    // Process files sequentially to simulate status transitions
    for (let i = 0; i < filesList.length; i++) {
      // Set to processing
      setFilesList(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'processing' } : f))
      
      // Simulate progress bar increments
      for (let p = 0; p <= 100; p += 25) {
        setFilesList(prev => prev.map((f, idx) => idx === i ? { ...f, progress: p } : f))
        await new Promise(r => setTimeout(r, 150))
      }

      // Finish this file
      setFilesList(prev => prev.map((f, idx) => {
        if (idx === i) {
          const success = f.outcome === 'success'
          return {
            ...f,
            status: success ? 'success' : 'failed',
            qualityScore: success ? Math.floor(Math.random() * 15) + 85 : Math.floor(Math.random() * 20) + 30
          }
        }
        return f
      }))
    }

    setIsProcessing(false)
    setIsFinished(true)
  }

  const resetBatch = () => {
    setFilesList([])
    setIsFinished(false)
    setIsProcessing(false)
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
          subtitle="Process multiple image files concurrently in our AI pipeline."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Upload Dropzone & Queue */}
        <div className="lg:col-span-8 space-y-6">
          <ChartCard title="Select Batch Files" subtitle="Supports concurrent ingestion up to 50 files">
            <div className="space-y-6">
              {filesList.length === 0 ? (
                <label className="upload-dropzone block">
                  <input type="file" multiple onChange={handleFileChange} className="hidden" accept="image/*" />
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 rounded-full bg-primary/10 border border-primary/20 text-primary">
                      <Upload className="w-6 h-6 animate-pulse" />
                    </div>
                    <span className="text-xs font-bold text-dark">Click to browse or drop multiple files here</span>
                    <span className="text-[10px] text-muted">Supports JPG, JPEG, PNG up to 50MB per file</span>
                  </div>
                </label>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-dark">{filesList.length} files selected</span>
                    <div className="flex gap-2">
                      <button onClick={resetBatch} className="fc-btn-secondary !py-2 !px-3 text-xs" disabled={isProcessing}>
                        Clear All
                      </button>
                      {!isFinished && !isProcessing && (
                        <button onClick={runBatchPipeline} className="fc-btn-primary !py-2 !px-4 text-xs">
                          <Play className="w-3.5 h-3.5" /> Run Batch
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Batch Files List */}
                  <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
                    {filesList.map((file, i) => (
                      <div 
                        key={i} 
                        className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-muted">
                            <FileImage className="w-4 h-4 text-[#8A96AD]" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-dark truncate max-w-[200px]">{file.name}</p>
                            <p className="text-[10px] text-muted mt-0.5">{file.size}</p>
                          </div>
                        </div>

                        {/* Status elements */}
                        <div className="flex items-center gap-4">
                          {file.status === 'pending' && (
                            <span className="text-muted font-semibold text-[10px] tracking-wider uppercase">Pending</span>
                          )}

                          {file.status === 'processing' && (
                            <div className="flex items-center gap-3">
                              <span className="text-primary font-bold text-[10px] animate-pulse">Restoring... {file.progress}%</span>
                              <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-primary" style={{ width: `${file.progress}%` }} />
                              </div>
                            </div>
                          )}

                          {file.status === 'success' && (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-mint uppercase">Restored ({file.qualityScore}%)</span>
                              <div className="p-1 rounded-full bg-mint/10 border border-mint/20 text-mint">
                                <CheckCircle className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          )}

                          {file.status === 'failed' && (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-pink uppercase">
                                {file.outcome === 'blur_fail' ? 'Blur Error' : 'Multiple Faces'}
                              </span>
                              <div className="p-1 rounded-full bg-pink/10 border border-pink/20 text-pink">
                                <AlertTriangle className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              )}
            </div>
          </ChartCard>
        </div>

        {/* Right Column: Processing Summary */}
        <div className="lg:col-span-4">
          <ChartCard title="Batch Execution Stats" subtitle="Queue status analytics">
            {filesList.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-muted gap-2">
                <HelpCircle className="w-8 h-8 text-muted opacity-40" />
                <p className="text-xs font-semibold">Ready to load files and Restores status logs.</p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Stats indicators */}
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <span className="block text-[8px] text-muted font-bold uppercase tracking-wider">Total processed</span>
                    <span className="block text-xl font-bold text-dark mt-1">{totalFiles}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <span className="block text-[8px] text-muted font-bold uppercase tracking-wider">Accepted Rate</span>
                    <span className="block text-xl font-bold text-mint mt-1">
                      {totalFiles > 0 ? `${Math.round((acceptedCount / totalFiles) * 100)}%` : '0%'}
                    </span>
                  </div>
                </div>

                {/* Queue status breakdown lists */}
                <div className="space-y-3.5 p-4 rounded-3xl bg-white/5 border border-white/10 text-xs text-muted">
                  <div className="flex justify-between">
                    <span>Accepted Images:</span>
                    <span className="font-bold text-mint">{acceptedCount} files</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rejected Images:</span>
                    <span className="font-bold text-pink">{rejectedCount} files</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average processing latency:</span>
                    <span className="font-bold text-dark">0.82s per file</span>
                  </div>
                </div>

                {/* Finished actions */}
                {isFinished && (
                  <div className="space-y-3 pt-2">
                    <button 
                      onClick={() => alert('Downloading batch ZIP file...')}
                      className="fc-btn-primary w-full justify-center text-xs py-3"
                    >
                      <Download className="w-4 h-4" /> Download Accepted ZIP
                    </button>
                    <button 
                      onClick={() => alert('Downloading batch PDF report...')}
                      className="fc-btn-secondary w-full justify-center text-xs py-3"
                    >
                      <Download className="w-4 h-4" /> Download Processing Report
                    </button>
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
