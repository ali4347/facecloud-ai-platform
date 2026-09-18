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
        <Link to="/dashboard/images" className="p-2 rounded-xl hover:bg-surface-mute border border-line text-ink-mute hover:text-ink">
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
                <div className="aspect-[4/3] rounded-3xl overflow-hidden relative border border-line bg-surface-mute">
                  <BeforeAfterSlider 
                    beforeColor="#0D0F14"
                    afterColor="#4F46E5"
                  />
                </div>
              ) : (
                <div className="aspect-[4/3] rounded-3xl bg-accent-tint/10 border border-accent/30/20 flex flex-col items-center justify-center text-center p-6 gap-3">
                  <AlertTriangle className="w-12 h-12 text-accent-soft animate-bounce" />
                  <h4 className="text-sm font-bold text-accent-soft uppercase tracking-wider">Asset Rejected by AI Node</h4>
                  <p className="text-xs text-ink-mute max-w-xs">{record.feedback}</p>
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
                <div className="p-4 rounded-2xl bg-surface-mute border border-line">
                  <span className="block text-[8px] text-ink-mute font-bold uppercase tracking-wider">Asset Status</span>
                  <span className={`block text-xs font-bold uppercase mt-1 ${record.status === 'completed' ? 'text-emerald-600' : 'text-accent-soft'}`}>
                    {record.status === 'completed' ? 'Accepted' : 'Rejected'}
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-surface-mute border border-line">
                  <span className="block text-[8px] text-ink-mute font-bold uppercase tracking-wider">Matching folder</span>
                  <span className="block text-xs font-bold text-ink mt-1">{record.personFolderId || 'None'}</span>
                </div>
              </div>

              {/* Pipeline details checkmarks */}
              <div className="p-4 rounded-3xl bg-surface-mute border border-line text-xs text-ink-mute space-y-3.5">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider pb-1.5 border-b border-line">
                  <span>Methodology details</span>
                  <span>Compliance score</span>
                </div>
                <div className="flex justify-between">
                  <span>Original Asset Saved:</span>
                  <span className="font-bold text-emerald-600">Yes (Secure write)</span>
                </div>
                <div className="flex justify-between">
                  <span>AI Restoration model:</span>
                  <span className="font-bold text-accent">{record.aiModel} (CNN Restorer)</span>
                </div>
                <div className="flex justify-between">
                  <span>Enhanced Asset Saved:</span>
                  <span className={`font-bold ${record.enhancedSaved ? 'text-emerald-600' : 'text-accent-soft'}`}>
                    {record.enhancedSaved ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Face detection:</span>
                  <span className={`font-bold ${record.faceDetected ? 'text-emerald-600' : 'text-accent-soft'}`}>
                    {record.faceDetected ? `Exactly 1 face (${record.faceCount} found)` : 'Failed (0 faces found)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Blur rating:</span>
                  <span className={`font-bold ${record.blurScore >= 60 ? 'text-emerald-600' : 'text-accent-soft'}`}>
                    {record.blurScore}/100
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Brightness index:</span>
                  <span className={`font-bold ${record.brightnessScore >= 40 ? 'text-emerald-600' : 'text-accent-soft'}`}>
                    {record.brightnessScore}/100
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Face size score:</span>
                  <span className={`font-bold ${record.faceSizeScore >= 10 ? 'text-emerald-600' : 'text-accent-soft'}`}>
                    {record.faceSizeScore}/100
                  </span>
                </div>
                {record.status === 'completed' && (
                  <div className="flex justify-between">
                    <span>Face embedding matched:</span>
                    <span className="font-bold text-emerald-600">{record.matchingConfidence}% Confidence</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Email Notification sent:</span>
                  <span className="font-bold text-emerald-600">Yes (Completed)</span>
                </div>
              </div>

              {/* Rejection block if failed */}
              {record.status === 'rejected' && (
                <div className="p-4 rounded-3xl bg-accent-tint/10 border border-accent/30/20 space-y-2">
                  <div className="flex gap-2 items-center text-xs font-bold text-accent-soft uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Rejection Reason feedback</span>
                  </div>
                  <p className="text-xs text-ink leading-relaxed font-medium">{record.feedback}</p>
                </div>
              )}

            </div>
          </ChartCard>
        </div>

      </div>
    </div>
  )
}
