import { useParams, Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { BeforeAfterSlider } from '../../components/features/BeforeAfterSlider'
import { mockImages } from '../../data/mock'
import { ArrowLeft, AlertTriangle, Download, Link2 } from 'lucide-react'

export default function ImageDetail() {
  const { id } = useParams<{ id: string }>()
  
  // Find record in mock data
  const record = mockImages.find(img => img.id === id) || mockImages[0]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/dashboard/images" className="p-2 rounded-xl hover:bg-white/5 border border-white/10 text-muted hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader 
          title="Image Asset Detail"
          subtitle={`Trace and audit metrics for asset ID ${record.id}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Visual Before/After */}
        <div className="lg:col-span-6 space-y-6">
          <ChartCard title="Restored Face Asset" subtitle={record.filename}>
            <div className="space-y-6">
              
              {record.status === 'completed' ? (
                <div className="aspect-[4/3] rounded-3xl overflow-hidden relative border border-border bg-black/20">
                  <BeforeAfterSlider 
                    beforeColor="#0D0F14"
                    afterColor="#0084FF"
                  />
                </div>
              ) : (
                <div className="aspect-[4/3] rounded-3xl bg-pink/10 border border-pink/20 flex flex-col items-center justify-center text-center p-6 gap-3">
                  <AlertTriangle className="w-12 h-12 text-pink animate-bounce" />
                  <h4 className="text-sm font-bold text-pink uppercase tracking-wider">Asset Rejected by AI Node</h4>
                  <p className="text-xs text-muted max-w-xs">{record.feedback}</p>
                </div>
              )}

              {/* Action Buttons if accepted */}
              {record.status === 'completed' && (
                <div className="flex gap-3">
                  <a 
                    href="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=640&sat=20&sharp=10"
                    download="enhanced_face.jpg"
                    className="fc-btn-primary w-full justify-center py-3 text-xs"
                  >
                    <Download className="w-4 h-4" /> Download Enhanced
                  </a>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(record.secureDownloadLink || '')
                      alert('Secure download link copied to clipboard!')
                    }}
                    className="fc-btn-secondary w-full justify-center py-3 text-xs"
                  >
                    <Link2 className="w-4 h-4" /> Copy Secure Link
                  </button>
                </div>
              )}

            </div>
          </ChartCard>
        </div>

        {/* Right Column: Biometric compliance audits list */}
        <div className="lg:col-span-6 space-y-6">
          <ChartCard title="Biometrics Trace Logs" subtitle="Zero-trust compliance checks">
            <div className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <span className="block text-[8px] text-muted font-bold uppercase tracking-wider">Asset Status</span>
                  <span className={`block text-xs font-bold uppercase mt-1 ${record.status === 'completed' ? 'text-mint' : 'text-pink'}`}>
                    {record.status === 'completed' ? 'Accepted' : 'Rejected'}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <span className="block text-[8px] text-muted font-bold uppercase tracking-wider">Matching folder</span>
                  <span className="block text-xs font-bold text-dark mt-1">{record.personFolderId || 'None'}</span>
                </div>
              </div>

              {/* Pipeline details checkmarks */}
              <div className="p-4 rounded-3xl bg-white/5 border border-white/10 text-xs text-muted space-y-3.5">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider pb-1.5 border-b border-white/5">
                  <span>Methodology details</span>
                  <span>Compliance score</span>
                </div>
                <div className="flex justify-between">
                  <span>Original Asset Saved:</span>
                  <span className="font-bold text-mint">Yes (Secure write)</span>
                </div>
                <div className="flex justify-between">
                  <span>AI Restoration model:</span>
                  <span className="font-bold text-primary">{record.aiModel} (CNN Restorer)</span>
                </div>
                <div className="flex justify-between">
                  <span>Enhanced Asset Saved:</span>
                  <span className={`font-bold ${record.enhancedSaved ? 'text-mint' : 'text-pink'}`}>
                    {record.enhancedSaved ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Face detection:</span>
                  <span className={`font-bold ${record.faceDetected ? 'text-mint' : 'text-pink'}`}>
                    {record.faceDetected ? `Exactly 1 face (${record.faceCount} found)` : 'Failed (0 faces found)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Blur rating:</span>
                  <span className={`font-bold ${record.blurScore >= 60 ? 'text-mint' : 'text-pink'}`}>
                    {record.blurScore}/100
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Brightness index:</span>
                  <span className={`font-bold ${record.brightnessScore >= 40 ? 'text-mint' : 'text-pink'}`}>
                    {record.brightnessScore}/100
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Face size score:</span>
                  <span className={`font-bold ${record.faceSizeScore >= 10 ? 'text-mint' : 'text-pink'}`}>
                    {record.faceSizeScore}/100
                  </span>
                </div>
                {record.status === 'completed' && (
                  <div className="flex justify-between">
                    <span>Face embedding matched:</span>
                    <span className="font-bold text-mint">{record.matchingConfidence}% Confidence</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Email Notification sent:</span>
                  <span className="font-bold text-mint">Yes (Completed)</span>
                </div>
              </div>

              {/* Rejection block if failed */}
              {record.status === 'rejected' && (
                <div className="p-4 rounded-3xl bg-pink/10 border border-pink/20 space-y-2">
                  <div className="flex gap-2 items-center text-xs font-bold text-pink uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Rejection Reason feedback</span>
                  </div>
                  <p className="text-xs text-dark leading-relaxed font-medium">{record.feedback}</p>
                </div>
              )}

            </div>
          </ChartCard>
        </div>

      </div>
    </div>
  )
}
