import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { ArrowLeft, FileArchive, CheckCircle, Download, Link2, HelpCircle } from 'lucide-react'

export default function UploadZip() {
  const [zipFile, setZipFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'extracting' | 'finished'>('idle')
  const [progress, setProgress] = useState(0)

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setZipFile(e.target.files[0])
      setStatus('idle')
      setProgress(0)
    }
  }

  const runZipExtraction = async () => {
    if (!zipFile) return
    setStatus('extracting')
    
    // Simulate steps in extraction and enhancement pipeline
    for (let p = 0; p <= 100; p += 20) {
      setProgress(p)
      await new Promise(r => setTimeout(r, 400))
    }
    
    setStatus('finished')
  }

  const resetZip = () => {
    setZipFile(null)
    setStatus('idle')
    setProgress(0)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/dashboard/upload" className="p-2 rounded-xl hover:bg-white/5 border border-white/10 text-muted hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader 
          title="ZIP Archive Upload"
          subtitle="Upload ZIP folders containing face portraits for automated folder grouping."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Control Card: File Ingest */}
        <div className="lg:col-span-6 space-y-6">
          <ChartCard title="Select Archive" subtitle="ZIP file dropzone">
            <div className="space-y-6">
              
              {!zipFile ? (
                <label className="upload-dropzone block">
                  <input type="file" onChange={handleZipChange} className="hidden" accept=".zip" />
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 rounded-full bg-primary/10 border border-primary/20 text-primary">
                      <FileArchive className="w-6 h-6 animate-pulse" />
                    </div>
                    <span className="text-xs font-bold text-dark">Click to browse or drop ZIP file here</span>
                    <span className="text-[10px] text-muted">Supports ZIP folders up to 200MB</span>
                  </div>
                </label>
              ) : (
                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                      <FileArchive className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-dark truncate">{zipFile.name}</p>
                      <p className="text-[10px] text-muted mt-0.5">{(zipFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={resetZip} 
                      className="fc-btn-secondary !py-2 !px-3 text-xs w-full justify-center"
                      disabled={status === 'extracting'}
                    >
                      Clear File
                    </button>
                    {status === 'idle' && (
                      <button 
                        onClick={runZipExtraction} 
                        className="fc-btn-primary !py-2 !px-4 text-xs w-full justify-center"
                      >
                        Extract & Process
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Extraction progress bar */}
              {status === 'extracting' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-primary font-bold">Extracting and processing ZIP contents...</span>
                    <span className="text-muted">{progress}%</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="text-[10px] text-muted font-mono space-y-1 bg-black/15 p-3 rounded-2xl border border-white/5">
                    <div>[ZIP] Unpacking archive folders...</div>
                    {progress >= 40 && <div className="text-primary">[ZIP] Found 14 image files</div>}
                    {progress >= 80 && <div className="text-mint">[AI] zero-dce enhancement completed</div>}
                  </div>
                </div>
              )}

            </div>
          </ChartCard>
        </div>

        {/* Right Output Card: Results */}
        <div className="lg:col-span-6">
          {status === 'idle' && (
            <ChartCard title="ZIP Extraction Logs" subtitle="Waiting to initialize extraction">
              <div className="h-64 flex flex-col items-center justify-center text-center text-muted gap-2">
                <HelpCircle className="w-8 h-8 text-muted opacity-40" />
                <p className="text-xs font-semibold">Load a valid ZIP archive to start processing.</p>
              </div>
            </ChartCard>
          )}

          {status === 'extracting' && (
            <ChartCard title="ZIP Extraction Logs" subtitle="Restoring folder assets">
              <div className="h-64 flex flex-col items-center justify-center text-center text-muted gap-2">
                <FileArchive className="w-8 h-8 text-primary animate-spin" />
                <p className="text-xs font-mono font-bold text-dark mt-2 uppercase tracking-wider">Unzipping files queue...</p>
              </div>
            </ChartCard>
          )}

          {status === 'finished' && (
            <ChartCard title="ZIP Processing Complete" subtitle="Results grouped and ready">
              <div className="space-y-6">
                
                <div className="p-4 rounded-3xl bg-white/5 border border-white/10 space-y-3.5 text-xs text-muted">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider pb-1.5 border-b border-white/5">
                    <span>Archive stats summary</span>
                    <span className="text-mint font-bold flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> SUCCESS</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Unpacked images:</span>
                    <span className="font-bold text-dark">14 files</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Biometric checks passed:</span>
                    <span className="font-bold text-mint">12 files</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Biometric checks rejected:</span>
                    <span className="font-bold text-pink">2 files</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Person clusters created:</span>
                    <span className="font-bold text-dark">3 clusters</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => alert('Downloading enhanced ZIP...')}
                    className="fc-btn-primary w-full justify-center text-xs py-3"
                  >
                    <Download className="w-4 h-4" /> Download Enhanced ZIP
                  </button>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText('https://facecloud.ai/download/sec-zip-mock-987')
                      alert('Secure ZIP link copied to clipboard!')
                    }}
                    className="fc-btn-secondary w-full justify-center text-xs py-3"
                  >
                    <Link2 className="w-4 h-4" /> Copy Secure Download Link
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
