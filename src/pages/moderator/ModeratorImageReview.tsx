import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { BeforeAfterSlider } from '../../components/features/BeforeAfterSlider'
import { mockReviewItems, mockGroups } from '../../data/mock'
import { ArrowLeft, Check, X, ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react'

export default function ModeratorImageReview() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const record = mockReviewItems.find(r => r.id === id) || mockReviewItems[0]

  const [approveModal, setApproveModal] = useState(false)
  const [rejectModal, setRejectModal] = useState(false)
  const [targetFolder, setTargetFolder] = useState(mockGroups[0].id)
  const [moderatorNote, setModeratorNote] = useState('')
  const [rejectReason, setRejectReason] = useState(record.rejectionReason)
  const [feedbackNotes, setFeedbackNotes] = useState(
    'The face features display low luminance boundaries. Please capture using stable ambient light sources.'
  )
  const [toastMsg, setToastMsg] = useState('')

  const handleApproveSubmit = () => {
    setApproveModal(false)
    setToastMsg('Image approved and user notified by email.')
    setTimeout(() => {
      setToastMsg('')
      navigate('/moderator/queue')
    }, 1800)
  }

  const handleRejectSubmit = () => {
    setRejectModal(false)
    setToastMsg('Rejection confirmed and user notified by email.')
    setTimeout(() => {
      setToastMsg('')
      navigate('/moderator/queue')
    }, 1800)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/moderator/queue" className="p-2 rounded-xl hover:bg-white/5 border border-white/10 text-muted hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader 
          title="Manual Image Review"
          subtitle={`Audit biometric overrides for file: ${record.filename}`}
        />
      </div>

      {toastMsg && (
        <div className="p-4 rounded-3xl bg-[#4FFFB0]/10 border border-[#4FFFB0]/20 text-xs font-bold text-[#16A34A] flex items-center justify-center gap-2">
          <CheckCircle className="w-4.5 h-4.5" />
          {toastMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Visual Assets before/after */}
        <div className="lg:col-span-6 space-y-6">
          <ChartCard title="Restored Asset Frame" subtitle="Original and enhanced visual restoration comparison">
            <div className="space-y-6">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden relative border border-border bg-black/20">
                <BeforeAfterSlider 
                  beforeColor="#0D0F14"
                  afterColor="#4FFFB0"
                />
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setApproveModal(true)}
                  className="fc-btn-success w-full justify-center py-3 text-xs"
                >
                  <Check className="w-4 h-4" /> Approve Image
                </button>
                <button 
                  onClick={() => setRejectModal(true)}
                  className="fc-btn-secondary w-full justify-center py-3 text-xs !text-pink hover:!border-pink"
                >
                  <X className="w-4 h-4" /> Confirm Rejection
                </button>
              </div>
            </div>
          </ChartCard>
        </div>

        {/* Right Column: AI Analysis details checklist */}
        <div className="lg:col-span-6 space-y-6">
          <ChartCard title="AI Diagnostic Report" subtitle="Auto-generated parameters assessments">
            <div className="space-y-6">
              
              {/* Warnings details */}
              <div className="p-4 rounded-3xl bg-pink/10 border border-pink/20 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-pink uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" />
                  <span>AI Failure Reason</span>
                </div>
                <p className="text-dark leading-relaxed font-medium">{record.rejectionReason}</p>
              </div>

              {/* Biometrics Ratings logs */}
              <div className="p-4 rounded-3xl bg-white/5 border border-white/10 text-xs text-muted space-y-3.5">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider pb-1.5 border-b border-white/5">
                  <span>Parameter checked</span>
                  <span>Calculated Rating</span>
                </div>
                <div className="flex justify-between">
                  <span>Detection Confidence:</span>
                  <span className="font-bold text-dark">{record.detectionConfidence}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Blur Score:</span>
                  <span className={`font-bold ${record.blurScore >= 60 ? 'text-mint' : 'text-pink'}`}>{record.blurScore}/100</span>
                </div>
                <div className="flex justify-between">
                  <span>Brightness Score:</span>
                  <span className={`font-bold ${record.brightnessScore >= 40 ? 'text-mint' : 'text-pink'}`}>{record.brightnessScore}/100</span>
                </div>
                <div className="flex justify-between">
                  <span>Face Size Score:</span>
                  <span className={`font-bold ${record.faceSizeScore >= 10 ? 'text-mint' : 'text-pink'}`}>{record.faceSizeScore}/100</span>
                </div>
                <div className="flex justify-between">
                  <span>Face Count:</span>
                  <span className={`font-bold ${record.faceCount === 1 ? 'text-mint' : 'text-pink'}`}>{record.faceCount} face detected</span>
                </div>
                <div className="flex justify-between">
                  <span>CNN Restorer Score:</span>
                  <span className="font-bold text-primary">{record.enhancementScore}/100</span>
                </div>
              </div>

              {/* AI Suggestion */}
              <div className="p-4 rounded-3xl bg-white/5 border border-white/10 flex gap-3 text-xs text-muted items-start">
                <ShieldAlert className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-dark">AI Decision Override Recommendation</h4>
                  <p className="mt-1 leading-relaxed text-[11px]">
                    Image quality meets standard facial cluster thresholds. Manual approval and folder assignment is recommended.
                  </p>
                </div>
              </div>

            </div>
          </ChartCard>
        </div>

      </div>

      {/* APPROVE DIALOG MODAL */}
      {approveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="fc-card p-6 w-full max-w-md bg-[#161B27] border-border space-y-6">
            <h3 className="text-base font-bold text-dark flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-mint" /> Approve face asset
            </h3>
            
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">Confirm Person Cluster Folder</label>
                <select 
                  value={targetFolder} 
                  onChange={e => setTargetFolder(e.target.value)}
                  className="fc-input text-dark"
                >
                  {mockGroups.map(g => (
                    <option key={g.id} value={g.id}>{g.label} ({g.id})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">Moderator review note (Optional)</label>
                <textarea 
                  value={moderatorNote}
                  onChange={e => setModeratorNote(e.target.value)}
                  className="w-full h-24 font-sans text-xs bg-black/15 border border-border rounded-xl p-3 text-dark focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="Add manual inspection notes..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setApproveModal(false)} className="fc-btn-secondary w-full justify-center py-2.5 text-xs">Cancel</button>
              <button onClick={handleApproveSubmit} className="fc-btn-success w-full justify-center py-2.5 text-xs">Approve and Store Image</button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT DIALOG MODAL */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="fc-card p-6 w-full max-w-md bg-[#161B27] border-border space-y-6">
            <h3 className="text-base font-bold text-dark flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-pink" /> Confirm Rejection decision
            </h3>
            
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">Select Rejection Reason</label>
                <select 
                  value={rejectReason} 
                  onChange={e => setRejectReason(e.target.value)}
                  className="fc-input text-dark"
                >
                  <option value="Image too blurry">Image too blurry</option>
                  <option value="Too dark after enhancement">Too dark after enhancement</option>
                  <option value="Multiple faces detected">Multiple faces detected</option>
                  <option value="Face not detected">Face not detected</option>
                  <option value="Face too small">Face too small</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">Feedback for user</label>
                <textarea 
                  value={feedbackNotes}
                  onChange={e => setFeedbackNotes(e.target.value)}
                  className="w-full h-24 font-sans text-xs bg-black/15 border border-border rounded-xl p-3 text-dark focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="Feedback notes details..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setRejectModal(false)} className="fc-btn-secondary w-full justify-center py-2.5 text-xs">Cancel</button>
              <button onClick={handleRejectSubmit} className="fc-btn-primary w-full justify-center py-2.5 text-xs !bg-pink shadow-none">Reject and Notify User</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
