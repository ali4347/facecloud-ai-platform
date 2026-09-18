import { useState, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { BeforeAfterSlider } from '../../components/features/BeforeAfterSlider'
import { Upload, ArrowLeft, RefreshCw, AlertTriangle, Download, Link2, Sparkles, FolderHeart, Info, FolderOpen } from 'lucide-react'

type PipelineStatus = 'idle' | 'processing' | 'success' | 'failed'

interface PipelineResult {
  status: 'enhanced' | 'rejected' | 'accepted' | 'enhanced_with_warning'
  faceCount: number
  blurScore: number
  brightnessScore: number
  faceSizeScore: number
  qualityScore: number
  enhancementConfidence: number
  matchedPersonFolders: { id: string; name: string; confidence: number }[]
  rejectionReason?: string
  feedback?: string
  secureDownloadLink: string
}

const pipelineSteps = [
  { label: 'Upload received', desc: 'Secure transmission to FaceCloud processing node' },
  { label: 'Original image saved', desc: 'Secure write to S3 bucket' },
  { label: 'Zero-DCE low-light matrix analysis', desc: 'Checking exposure levels' },
  { label: 'Enhanced image generated', desc: 'Frontend Zero-DCE correction applied' },
  { label: 'Face detection running', desc: 'Scanning for visible face structures' },
  { label: 'Face count calculated', desc: 'Determining exact face count' },
  { label: 'Quality checks completed', desc: 'Evaluating blur, face size and brightness' },
  { label: 'Face embeddings extracted', desc: 'Compiling 128-D biometrics signatures' },
  { label: 'Person folders matched/created', desc: 'Mapping identities to target folders' },
  { label: 'Enhanced image stored', desc: 'Saving enhanced file to matched directories' },
  { label: 'Secure download link generated', desc: 'Creating time-limited download URL' },
  { label: 'Activity log created', desc: 'Audit logging processed single jobs' },
  { label: 'Notification sent', desc: 'Email dispatched to account owner' }
]

const getSeed = (file: File) => {
  let hash = 0
  for (let i = 0; i < file.name.length; i++) {
    hash = file.name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

export default function UploadSingle() {
  const [status, setStatus] = useState<PipelineStatus>('idle')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [enhancedPreviewUrl, setEnhancedPreviewUrl] = useState<string>('')
  const [currentStep, setCurrentStep] = useState(0)
  const [result, setResult] = useState<PipelineResult | null>(null)
  
  const processingRef = useRef(false)

  const generateEnhancedPreview = (srcUrl: string) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.filter = 'brightness(1.15) contrast(1.12) saturate(1.15)'
        ctx.drawImage(img, 0, 0)
        
        ctx.globalCompositeOperation = 'overlay'
        ctx.globalAlpha = 0.08
        ctx.filter = 'contrast(1.5) brightness(1.05)'
        ctx.drawImage(img, 0, 0)

        ctx.globalCompositeOperation = 'source-over'
        ctx.globalAlpha = 1.0
        ctx.filter = 'none'

        setEnhancedPreviewUrl(canvas.toDataURL('image/jpeg'))
      }
    }
    img.src = srcUrl
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setEnhancedPreviewUrl('')
      generateEnhancedPreview(url)
      setStatus('idle')
      setCurrentStep(0)
      setResult(null)
    }
  }

  const startPipeline = async () => {
    if (!selectedFile || processingRef.current) return
    processingRef.current = true
    setStatus('processing')
    setResult(null)

    // Calculate quality result deterministically
    const seed = getSeed(selectedFile)
    
    let faceCount = 1
    if (selectedFile.name.toLowerCase().includes('multi') || selectedFile.name.toLowerCase().includes('group') || seed % 3 === 0) {
      faceCount = 2 + (seed % 2) // 2 or 3 faces
    }
    
    let blurScore = 75 + (seed % 20)
    if (selectedFile.name.toLowerCase().includes('blur') || seed % 7 === 0) {
      blurScore = 20 + (seed % 15) // blur fail
    }

    let brightnessScore = 65 + (seed % 30)
    if (selectedFile.name.toLowerCase().includes('dark') || seed % 11 === 0) {
      brightnessScore = 15 + (seed % 15) // low or extremely low brightness
    }

    let faceSizeScore = 70 + (seed % 25)
    if (selectedFile.name.toLowerCase().includes('small') || selectedFile.name.toLowerCase().includes('far') || seed % 13 === 0) {
      faceSizeScore = 25 + (seed % 15) // small face fail
    }

    const enhancementConfidence = 85 + (seed % 12)
    const qualityScore = Math.round((blurScore + brightnessScore + faceSizeScore) / 3)

    let outStatus: PipelineResult['status'] = 'accepted'
    let rejectionReason = ''
    let feedback = ''

    if (blurScore < 45) {
      outStatus = 'rejected'
      rejectionReason = 'Image too blurry'
      feedback = 'The uploaded portrait fails our biometric check with a motion blur index below thresholds. Please re-shoot or upload a sharper face portrait.'
    } else if (faceSizeScore < 40) {
      outStatus = 'rejected'
      rejectionReason = 'Face not visible enough'
      feedback = 'The face region is too small, obscured, or out of capture range. FaceCloud requires a clear portrait focusing on face bounds.'
    } else if (brightnessScore < 25) {
      outStatus = 'rejected'
      rejectionReason = 'Extremely dark image'
      feedback = 'The exposure levels are too low to safely recover details. Please re-shoot with better lighting.'
    } else if (brightnessScore < 50) {
      outStatus = 'enhanced_with_warning'
      rejectionReason = 'Low brightness improved by Zero-DCE'
      feedback = 'Image exposure was low, but improved using Zero-DCE correction.'
    }

    const matchedPersonFolders: PipelineResult['matchedPersonFolders'] = []
    if (outStatus !== 'rejected') {
      const names = ['Ali Hassan', 'Ahmed Khan', 'Zainab Bibi', 'Bilal Ahmed', 'Sana Malik']
      if (faceCount === 1) {
        matchedPersonFolders.push({
          id: `grp-${(seed % 5 + 1).toString().padStart(3, '0')}`,
          name: names[seed % names.length],
          confidence: 88 + (seed % 10)
        })
      } else {
        for (let f = 0; f < faceCount; f++) {
          const idx = (seed + f) % names.length
          matchedPersonFolders.push({
            id: `grp-${(idx + 1).toString().padStart(3, '0')}`,
            name: names[idx],
            confidence: 84 + ((seed + f) % 12)
          })
        }
      }
    }

    const secureDownloadLink = `https://facecloud.ai/download/sec-mock-${seed}`
    const finalResult: PipelineResult = {
      status: outStatus,
      faceCount,
      blurScore,
      brightnessScore,
      faceSizeScore,
      qualityScore,
      enhancementConfidence,
      matchedPersonFolders,
      rejectionReason,
      feedback,
      secureDownloadLink
    }

    // Process steps sequentially
    for (let i = 0; i < pipelineSteps.length; i++) {
      setCurrentStep(i)
      // Variable speed simulation
      await new Promise(r => setTimeout(r, 450))
      
      // Stop and fail at Step 6 (Quality checks completed) if rejected
      if (outStatus === 'rejected' && i === 6) {
        setResult(finalResult)
        setStatus('failed')
        processingRef.current = false
        return
      }
    }

    setResult(finalResult)
    setStatus('success')
    processingRef.current = false
  }

  const resetPipeline = () => {
    setSelectedFile(null)
    setPreviewUrl('')
    setEnhancedPreviewUrl('')
    setStatus('idle')
    setCurrentStep(0)
    setResult(null)
    processingRef.current = false
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Link to="/dashboard/upload" className="p-2 rounded-xl hover:bg-surface-mute border border-line text-ink-mute hover:text-ink">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader 
          title="Upload a Photo"
          subtitle="Review your photo below, then confirm to start processing."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Control Card: File Ingest */}
        <div className="lg:col-span-6 space-y-6">
          <ChartCard title="Select File" subtitle="AI Pipeline Analysis">
            <div className="space-y-6">
              
              {/* Dropzone */}
              {!selectedFile ? (
                <label className="upload-dropzone block cursor-pointer">
                  <input type="file" onChange={handleFileChange} className="hidden" accept="image/*" />
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-4 rounded-full bg-[#F97316]/10 border border-[#F97316]/25 text-[#F97316]">
                      <Upload className="w-6 h-6 animate-pulse" />
                    </div>
                    <span className="text-xs font-bold text-ink">Click to browse or drop file here</span>
                    <span className="text-[10px] text-ink-faint">Supports JPG, JPEG, PNG up to 50MB</span>
                  </div>
                </label>
              ) : (
                <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-line bg-surface-mute flex items-center justify-center">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                  {status === 'idle' && (
                    <button 
                      onClick={resetPipeline}
                      className="absolute top-4 right-4 p-2.5 rounded-xl bg-black/60 border border-white/20 hover:bg-black/80 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Re-select
                    </button>
                  )}
                </div>
              )}

              {/* Explainer caption */}
              {selectedFile && status === 'idle' && (
                <p className="text-[10px] text-ink-faint font-medium">
                  FaceCloud will automatically analyze image quality, detect faces, enhance the image, and assign person folders.
                </p>
              )}

              {/* Process trigger */}
              {selectedFile && status === 'idle' && (
                <button onClick={startPipeline} className="fc-btn-primary w-full justify-center py-3 font-bold cursor-pointer flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Confirm &amp; Upload Photo
                </button>
              )}

              {/* Processing Progress checklist */}
              {status === 'processing' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#FB923C] font-bold">Processing pipeline executing...</span>
                    <span className="text-ink-mute font-mono font-bold">{Math.round((currentStep / pipelineSteps.length) * 100)}%</span>
                  </div>
                  <div className="w-full h-1 bg-surface-mute rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#F97316] to-[#10B981] transition-all duration-300"
                      style={{ width: `${((currentStep + 1) / pipelineSteps.length) * 100}%` }}
                    />
                  </div>
                  <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                    {pipelineSteps.map((step, idx) => (
                      <div key={step.label} className="flex gap-3 items-start text-xs" style={{ opacity: idx > currentStep ? 0.3 : 1 }}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0 text-[10px] font-bold ${
                          idx < currentStep ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20' :
                          idx === currentStep ? 'bg-[#F97316]/20 text-[#FB923C] border border-[#F97316]/30 animate-pulse' :
                          'bg-surface-mute text-ink-faint border border-line'
                        }`}>
                          {idx < currentStep ? '✓' : idx + 1}
                        </div>
                        <div>
                          <p className={`font-bold ${idx === currentStep ? 'text-[#FB923C]' : 'text-ink'}`}>{step.label}</p>
                          <p className="text-[10px] text-ink-faint mt-0.5">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </ChartCard>
        </div>

        {/* Right Output Card: Results */}
        <div className="lg:col-span-6">
          <AnimatePresence mode="wait">
            
            {status === 'idle' && (
              <ChartCard title="Photo Preview" subtitle="Your photo will appear here">
                <div className="h-64 flex flex-col items-center justify-center text-center text-ink-faint gap-2">
                  <Upload className="w-10 h-10 text-ink-faint opacity-40 animate-bounce" />
                  <p className="text-xs font-semibold">Select a photo and confirm to start processing.</p>
                </div>
              </ChartCard>
            )}

            {status === 'processing' && (
              <ChartCard title="Biometrics Restorations" subtitle="Real-time pipeline analytics">
                <div className="space-y-6">
                  <div className="aspect-[4/3] rounded-3xl bg-surface-mute overflow-hidden flex items-center justify-center relative border border-line">
                    <img src={previewUrl} alt="Restoring" className="w-full h-full object-cover blur-[2px] opacity-40" />
                    <div className="absolute inset-0 bg-[#0D0F14]/50 flex items-center justify-center flex-col gap-2">
                      <Sparkles className="w-8 h-8 text-[#F97316] animate-spin" />
                      <span className="text-xs font-mono font-bold text-ink uppercase tracking-wider">Compiling CNN illumination matrix...</span>
                    </div>
                  </div>
                </div>
              </ChartCard>
            )}

            {status === 'success' && result && (
              <ChartCard title="Processing Complete" subtitle="Image approved by AI system">
                <div className="space-y-6">
                  {/* Before / After comparison slider */}
                  <div className="aspect-[4/3] rounded-3xl overflow-hidden relative border border-line bg-surface-sunk">
                    <BeforeAfterSlider 
                      beforeSrc={previewUrl}
                      afterSrc={enhancedPreviewUrl || previewUrl}
                      beforeLabel="Original"
                      afterLabel="Enhanced"
                      className="h-full"
                    />
                  </div>

                  {/* Quality Scores */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { l: 'Blur Score', v: `${result.blurScore}%`, ok: result.blurScore > 45 },
                      { l: 'Brightness', v: `${result.brightnessScore}%`, ok: result.brightnessScore > 50 },
                      { l: 'Face Size', v: `${result.faceSizeScore}%`, ok: result.faceSizeScore > 40 }
                    ].map(stat => (
                      <div key={stat.l} className="p-3 rounded-2xl bg-surface-mute border border-line text-center">
                        <span className="block text-[8px] text-ink-faint font-bold uppercase tracking-wider">{stat.l}</span>
                        <span className="block text-sm font-bold mt-1 text-[#10B981]">{stat.v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Multi-face notice / folder match panel */}
                  <div className="p-4 rounded-2xl bg-surface-mute border border-line space-y-3 text-xs">
                    {result.faceCount > 1 ? (
                      <>
                        <div className="flex items-center gap-2 text-[#10B981] font-bold">
                          <FolderHeart className="w-4 h-4" />
                          <span>Multiple faces detected ({result.faceCount} faces)</span>
                        </div>
                        <p className="text-[11px] text-ink-mute leading-relaxed font-medium">
                          FaceCloud detected multiple faces and saved the enhanced image to each matched person folder.
                        </p>
                        <div className="space-y-2 pt-2 border-t border-line">
                          <span className="block text-[9px] text-ink-faint font-bold uppercase tracking-wider">Matched Folders ({result.matchedPersonFolders.length})</span>
                          {result.matchedPersonFolders.map(folder => (
                            <Link 
                              key={folder.id} 
                              to="/dashboard/groups" 
                              className="flex items-center justify-between p-2 rounded-xl bg-surface-mute border border-line hover:border-line transition-all font-semibold text-ink-soft hover:text-ink"
                            >
                              <span className="flex items-center gap-1.5">
                                <FolderOpen className="w-3.5 h-3.5 text-[#F97316]" />
                                {folder.name}
                              </span>
                              <span className="text-[10px] text-[#10B981] font-bold">{folder.confidence}% match</span>
                            </Link>
                          ))}
                        </div>
                        <p className="text-[10px] text-ink-faint italic">
                          Multi-face images are allowed. FaceCloud stores the enhanced image in every matched person folder.
                        </p>
                      </>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="block text-[9px] text-ink-faint uppercase font-bold tracking-wider">Identity Match</span>
                          {result.matchedPersonFolders[0] ? (
                            <Link to="/dashboard/groups" className="text-[#F97316] font-bold hover:underline flex items-center gap-1 mt-0.5">
                              {result.matchedPersonFolders[0].name} <Link2 className="w-3.5 h-3.5" />
                            </Link>
                          ) : (
                            <span className="text-ink-mute block mt-0.5">No match found</span>
                          )}
                        </div>
                        <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-[#10B981]/10 border border-[#10B981]/25 text-[#10B981]">ACCEPTED</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3">
                    <a 
                      href={enhancedPreviewUrl || previewUrl}
                      download="facecloud_enhanced_portrait.jpg"
                      className="fc-btn-primary flex-1 justify-center py-3 text-xs font-bold cursor-pointer"
                    >
                      <Download className="w-4 h-4" /> Download Enhanced
                    </a>
                    {result.faceCount > 1 ? (
                      <Link 
                        to="/dashboard/groups"
                        className="fc-btn-secondary flex-1 justify-center py-3 text-xs font-bold cursor-pointer"
                      >
                        <FolderOpen className="w-4 h-4 text-[#F97316]" /> View Person Folders
                      </Link>
                    ) : (
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(result.secureDownloadLink)
                          alert('Secure link copied to clipboard!')
                        }}
                        className="fc-btn-secondary flex-1 justify-center py-3 text-xs font-bold cursor-pointer"
                      >
                        <Link2 className="w-4 h-4" /> Copy Secure Link
                      </button>
                    )}
                  </div>

                  {/* Demo disclaimer */}
                  <div className="p-3.5 rounded-2xl flex items-start gap-2.5 bg-[#F97316]/5 border border-[#F97316]/15">
                    <Info className="w-4 h-4 text-[#FB923C] flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-ink-mute leading-relaxed font-medium">
                      Frontend demo enhancement. Production backend can connect Zero-DCE/GFPGAN/CodeFormer for real AI restoration.
                    </p>
                  </div>

                  {/* Start another image option */}
                  <button onClick={resetPipeline} className="w-full py-2 text-center text-xs font-semibold text-ink-faint hover:text-ink-mute hover:underline cursor-pointer">
                    Try Another Image
                  </button>
                </div>
              </ChartCard>
            )}

            {status === 'failed' && result && (
              <ChartCard title="Rejection Reason" subtitle="Biometric compliance parameters failed">
                <div className="space-y-6">
                  
                  {/* Error Card */}
                  <div className="p-4 rounded-3xl bg-[#EF4444]/10 border border-[#EF4444]/25 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#EF4444]/20 border border-[#EF4444]/35 flex items-center justify-center text-[#EF4444]">
                        <AlertTriangle className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#EF4444] uppercase tracking-wider">
                          {result.rejectionReason}
                        </h4>
                        <p className="text-[10px] text-ink-faint mt-0.5">Rejected by Face Detection node</p>
                      </div>
                    </div>
                    <p className="text-xs text-ink-soft leading-relaxed font-medium">
                      {result.feedback}
                    </p>
                  </div>

                  {/* Verification Trace info */}
                  <div className="space-y-3.5 p-4 rounded-3xl bg-surface-mute border border-line text-xs text-ink-mute">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider pb-1.5 border-b border-line">
                      <span>Pipeline Trace Info</span>
                      <span className="text-[#EF4444]">Failed at Step 7</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Face Detected:</span>
                      <span className="font-bold text-ink">{result.faceCount > 0 ? `Yes (${result.faceCount} face${result.faceCount > 1 ? 's' : ''})` : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Blur Score:</span>
                      <span className={`font-bold ${result.blurScore < 45 ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
                        {result.blurScore}/100 {result.blurScore < 45 && '(Failed)'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Brightness Score:</span>
                      <span className={`font-bold ${result.brightnessScore < 25 ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
                        {result.brightnessScore}/100 {result.brightnessScore < 25 && '(Failed)'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Face Size Score:</span>
                      <span className={`font-bold ${result.faceSizeScore < 40 ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
                        {result.faceSizeScore}/100 {result.faceSizeScore < 40 && '(Failed)'}
                      </span>
                    </div>
                  </div>

                  <button onClick={resetPipeline} className="fc-btn-secondary w-full justify-center py-3 text-xs font-bold cursor-pointer">
                    Try Another Image
                  </button>
                </div>
              </ChartCard>
            )}

          </AnimatePresence>
        </div>

      </div>
    </div>
  )
}
