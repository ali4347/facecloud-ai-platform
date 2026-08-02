import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { mockReviewItems, mockGroups, mockModeratorAudit, mockModNotifications } from '../../data/mock'
import { ArrowLeft, Check, X, ShieldAlert, CheckCircle, AlertTriangle, Play, RefreshCw, AlertOctagon } from 'lucide-react'

export default function ModeratorImageReview() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const record = mockReviewItems.find(r => r.id === id) || mockReviewItems[0]

  const [approveModal, setApproveModal] = useState(false)
  const [rejectModal, setRejectModal] = useState(false)
  const [correctModal, setCorrectModal] = useState(false)
  const [escalateModal, setEscalateModal] = useState(false)

  const [targetFolder, setTargetFolder] = useState(mockGroups[0]?.id || 'grp-001')
  const [correctOption, setCorrectOption] = useState<'folder' | 'not_duplicate'>(record.isDuplicate ? 'not_duplicate' : 'folder')
  const [moderatorNote, setModeratorNote] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [feedbackNotes, setFeedbackNotes] = useState('')
  const [escalationNote, setEscalationNote] = useState('')
  const [toastMsg, setToastMsg] = useState('')

  const sessionStr = localStorage.getItem('facecloud_session')
  const session = sessionStr ? JSON.parse(sessionStr) : { name: 'Vaneeza Sohaib' }

  const showToastAndRedirect = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => {
      setToastMsg('')
      navigate('/moderator/queue')
    }, 1800)
  }

  // Audit and notification helpers
  const logDecision = (action: string, details: string) => {
    const newAudit = {
      id: `ma-${Date.now()}`,
      timestamp: new Date().toISOString(),
      moderatorName: session.name,
      filename: record.filename,
      action: action,
      oldStatus: record.status,
      newStatus: action === 'Approve' ? 'approved' : action === 'Reject' ? 'rejected' : 'flagged',
      reason: details,
      userNotified: true
    }
    mockModeratorAudit.unshift(newAudit)
  }

  const triggerOrgNotification = (desc: string) => {
    mockModNotifications.unshift({
      id: `n-${Date.now()}`,
      type: 'Assignment',
      description: desc,
      timestamp: new Date().toISOString(),
      isRead: false
    })
  }

  // Action submissions
  const handleApproveSubmit = () => {
    record.status = 'approved'
    logDecision('Approve Image', `Manually approved and assigned to person folder: ${targetFolder}. Notes: ${moderatorNote}`)
    triggerOrgNotification(`Asset ${record.filename} approved manually by ${session.name}`)
    setApproveModal(false)
    showToastAndRedirect('Image approved and user notified.')
  }

  const handleRejectSubmit = () => {
    if (!rejectReason) {
      alert('Please select a rejection reason.')
      return
    }
    record.status = 'rejected'
    record.rejectionReason = rejectReason
    logDecision('Reject Image', `Rejection confirmed. Reason: ${rejectReason}. Feedback: ${feedbackNotes}`)
    triggerOrgNotification(`Asset ${record.filename} rejected: ${rejectReason}`)
    setRejectModal(false)
    showToastAndRedirect('Rejection confirmed and feedback sent.')
  }

  const handleCorrectSubmit = () => {
    if (correctOption === 'not_duplicate') {
      record.isDuplicate = false
      logDecision('Correct Duplicate Flag', `Marked as NOT a duplicate.`)
      triggerOrgNotification(`Duplicate flag cleared on ${record.filename}`)
    } else {
      logDecision('Correct Folder Mapping', `Reassigned cluster folder mapping to: ${targetFolder}`)
      triggerOrgNotification(`Folder mapping updated for ${record.filename}`)
    }
    setCorrectModal(false)
    showToastAndRedirect('Correction applied successfully.')
  }

  const handleReprocessSubmit = () => {
    if (!record.allowReprocess) return
    logDecision('Reprocess Image', 'Triggered AI pipeline reprocessing sequence')
    triggerOrgNotification(`Reprocessing requested for ${record.filename}`)
    showToastAndRedirect('Image scheduled for reprocessing.')
  }

  const handleEscalateSubmit = () => {
    record.escalated = true
    record.escalationNote = escalationNote
    logDecision('Escalate Case', `Case escalated to admin. Note: ${escalationNote}`)
    
    // Add to Notification Center as Escalation type
    mockModNotifications.unshift({
      id: `n-${Date.now()}`,
      type: 'Escalation',
      description: `Moderator Vaneeza escalated ${record.filename} for Admin review: ${escalationNote}`,
      timestamp: new Date().toISOString(),
      isRead: false
    })

    setEscalateModal(false)
    showToastAndRedirect('Case escalated to FaceCloud Admin.')
  }

  return (
    <div className="space-y-6 page-enter relative">
      <div className="flex items-center gap-3">
        <Link to="/moderator/queue" className="p-2 rounded-xl hover:bg-white/5 border border-white/10 text-muted hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader 
          title="Manual Verification & Decisions"
          subtitle={`Audit exceptions and resolve duplicates for: ${record.filename}`}
        />
      </div>

      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-3xl bg-[#4FFFB0]/10 border border-[#4FFFB0]/20 text-xs font-bold text-[#4FFFB0] flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(79,255,176,0.15)] backdrop-blur-md animate-enter">
          <CheckCircle className="w-4.5 h-4.5" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Visual Assets Comparison */}
        <div className="lg:col-span-6 space-y-6">
          <ChartCard title="Visual Restoration Audit" subtitle="Compare original file against pipeline enhanced output">
            <div className="space-y-6">
              
              {/* Side-by-Side Swatches */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-center">
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider block">Original Image</span>
                  <div className="aspect-[4/3] rounded-3xl border border-white/10 flex items-center justify-center relative overflow-hidden"
                    style={{ background: `radial-gradient(circle, rgba(255,255,255,0.05), transparent), ${record.thumbnail}` }}
                  >
                    {record.isDuplicate && (
                      <div className="absolute top-3 left-3 p-1.5 bg-[#EF4444]/90 border border-red-500/30 rounded-xl text-[9px] font-bold text-white uppercase shadow-lg">
                        Duplicate Flag
                      </div>
                    )}
                    <span className="text-white/20 font-bold text-xs">Original Photo</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-center">
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider block">Enhanced Image</span>
                  <div className="aspect-[4/3] rounded-3xl border border-white/10 flex items-center justify-center relative overflow-hidden"
                    style={{ background: `radial-gradient(circle, rgba(79,255,176,0.1), transparent), ${record.thumbnail}` }}
                  >
                    <span className="text-[#4FFFB0] font-bold text-xs flex items-center gap-1">
                      <Play className="w-3.5 h-3.5 fill-[#4FFFB0]" />
                      Enhanced V1
                    </span>
                  </div>
                </div>
              </div>

              {/* Flagged Duplicate Comparison Panel */}
              {record.isDuplicate && (
                <div className="p-4 rounded-3xl bg-[#EA580C]/[0.06] border border-[#EA580C]/20 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">Duplicate Match Analysis</span>
                    <span className="text-xs font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded">
                      {record.similarityScore}% Similarity Match
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="space-y-1">
                      <p className="text-[9px] text-white/40 font-semibold truncate">{record.filename}</p>
                      <div className="aspect-[3/2] rounded-2xl border border-white/10 flex items-center justify-center" style={{ backgroundColor: record.thumbnail }}>
                        <span className="text-white/20 text-[10px]">This Upload</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] text-white/40 font-semibold truncate">{record.matchedFilename}</p>
                      <div className="aspect-[3/2] rounded-2xl border border-white/10 flex items-center justify-center" style={{ backgroundColor: record.matchedThumbnail }}>
                        <span className="text-white/20 text-[10px]">Existing Match</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 5 Decisions Actions Menu */}
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setApproveModal(true)}
                    className="fc-btn-success w-full justify-center py-3 text-xs font-bold flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Approve Image
                  </button>
                  <button 
                    onClick={() => setRejectModal(true)}
                    className="fc-btn-secondary w-full justify-center py-3 text-xs font-bold flex items-center gap-2 !text-red-400 hover:!border-red-500/50"
                  >
                    <X className="w-4 h-4" /> Confirm Rejection
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <button 
                    onClick={() => setCorrectModal(true)}
                    className="fc-btn-secondary w-full justify-center py-3 text-xs font-bold flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-purple-300" /> Correct
                  </button>
                  
                  <button 
                    onClick={handleReprocessSubmit}
                    disabled={!record.allowReprocess}
                    className="fc-btn-secondary w-full justify-center py-3 text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    title={!record.allowReprocess ? "Reprocessing is not permitted for this item's state" : "Request pipeline reprocessing"}
                  >
                    <Play className="w-3.5 h-3.5 text-[#F97316]" /> Reprocess
                  </button>
                  
                  <button 
                    onClick={() => setEscalateModal(true)}
                    className="fc-btn-secondary w-full justify-center py-3 text-xs font-bold flex items-center gap-1.5 !text-[#F59E0B] hover:!border-[#F59E0B]/50"
                  >
                    <AlertOctagon className="w-3.5 h-3.5" /> Escalate
                  </button>
                </div>
              </div>

            </div>
          </ChartCard>
        </div>

        {/* Right Column: AI Diagnostics Report */}
        <div className="lg:col-span-6 space-y-6">
          <ChartCard title="AI Diagnostic Parameters" subtitle="Evaluated metric scores and thresholds verification">
            <div className="space-y-6">
              
              {/* Warnings details */}
              <div className="p-4 rounded-3xl bg-red-500/5 border border-red-500/10 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-red-400 uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" />
                  <span>AI Exception Trigger</span>
                </div>
                <p className="text-white/60 leading-relaxed font-semibold">
                  {record.isDuplicate ? `Duplicate image match found: matched with ${record.matchedFilename}` : record.rejectionReason}
                </p>
              </div>

              {/* Progress bars ratings */}
              <div className="p-5 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                <h4 className="text-[10px] text-white/40 font-bold uppercase tracking-wider pb-2 border-b border-white/5">Biometric Threshold Ratings</h4>
                
                {/* Blur */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between font-bold">
                    <span>Blur Score (Image Sharpness)</span>
                    <span className={record.blurScore >= 60 ? 'text-[#4FFFB0]' : 'text-red-400'}>{record.blurScore}/100</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full transition-all" style={{ width: `${record.blurScore}%`, backgroundColor: record.blurScore >= 60 ? '#4FFFB0' : '#EF4444' }} />
                  </div>
                </div>

                {/* Brightness */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between font-bold">
                    <span>Exposure / Brightness Rating</span>
                    <span className={record.brightnessScore >= 45 ? 'text-[#4FFFB0]' : 'text-red-400'}>{record.brightnessScore}/100</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full transition-all" style={{ width: `${record.brightnessScore}%`, backgroundColor: record.brightnessScore >= 45 ? '#4FFFB0' : '#EF4444' }} />
                  </div>
                </div>

                {/* Face Size */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between font-bold">
                    <span>Face Boundary Coverage</span>
                    <span className={record.faceSizeScore >= 50 ? 'text-[#4FFFB0]' : 'text-red-400'}>{record.faceSizeScore}/100</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full transition-all" style={{ width: `${record.faceSizeScore}%`, backgroundColor: record.faceSizeScore >= 50 ? '#4FFFB0' : '#EF4444' }} />
                  </div>
                </div>
              </div>

              {/* Recommendation summary card */}
              <div className="p-4 rounded-3xl bg-white/5 border border-white/10 flex gap-3 text-xs text-white/55 items-start">
                <ShieldAlert className="w-5 h-5 text-[#F97316] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white">AI Policy Recommender</h4>
                  <p className="mt-1 leading-relaxed text-[11px] text-white/45">
                    {record.isDuplicate 
                      ? "Flagged for duplicate scan verification. Review original vs matched profile and confirm mapping override decision."
                      : "Image checks flag standard thresholds deviation. Manually override, schedule reprocessing, or decline ingestion."}
                  </p>
                </div>
              </div>

            </div>
          </ChartCard>
        </div>

      </div>

      {/* APPROVE DIALOG MODAL */}
      {approveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-enter">
          <div className="fc-panel-strong p-6 w-full max-w-md bg-[#0D0F14] border border-white/10 space-y-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#4FFFB0]" /> Approve Image Ingest
            </h3>
            
            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider block">Confirm Person Cluster Folder</label>
                <select 
                  value={targetFolder} 
                  onChange={e => setTargetFolder(e.target.value)}
                  className="fc-input text-white"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  {mockGroups.map(g => (
                    <option key={g.id} value={g.id} className="bg-[#05070A]">{g.label} ({g.id})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider block">Review Comments (Optional)</label>
                <textarea 
                  value={moderatorNote}
                  onChange={e => setModeratorNote(e.target.value)}
                  className="w-full h-24 fc-input !p-3 resize-none"
                  placeholder="Override diagnostics reason or comments..."
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setApproveModal(false)} className="fc-btn-secondary w-full justify-center py-2.5 text-xs">Cancel</button>
              <button onClick={handleApproveSubmit} className="fc-btn-primary w-full justify-center py-2.5 text-xs !bg-[#4FFFB0] !text-black shadow-none font-bold">Approve & Ingest</button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT DIALOG MODAL */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-enter">
          <div className="fc-panel-strong p-6 w-full max-w-md bg-[#0D0F14] border border-white/10 space-y-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" /> Confirm Rejection Decision
            </h3>
            
            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider block">Rejection Reason *</label>
                <select 
                  value={rejectReason} 
                  onChange={e => setRejectReason(e.target.value)}
                  className="fc-input text-white"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                  required
                >
                  <option value="" className="bg-[#05070A]">-- Select Rejection Reason --</option>
                  <option value="Image too blurry" className="bg-[#05070A]">Image too blurry</option>
                  <option value="Too dark after enhancement" className="bg-[#05070A]">Too dark after enhancement</option>
                  <option value="Multiple faces detected" className="bg-[#05070A]">Multiple faces detected</option>
                  <option value="Face not detected" className="bg-[#05070A]">Face not detected</option>
                  <option value="Face too small" className="bg-[#05070A]">Face too small</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider block">Instructions for User (Optional)</label>
                <textarea 
                  value={feedbackNotes}
                  onChange={e => setFeedbackNotes(e.target.value)}
                  className="w-full h-24 fc-input !p-3 resize-none"
                  placeholder="Tell the user how to fix their photo..."
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setRejectModal(false)} className="fc-btn-secondary w-full justify-center py-2.5 text-xs">Cancel</button>
              <button 
                onClick={handleRejectSubmit} 
                disabled={!rejectReason}
                className="fc-btn-primary w-full justify-center py-2.5 text-xs !bg-red-500 !text-white shadow-none font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Decline & Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CORRECT DIALOG MODAL */}
      {correctModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-enter">
          <div className="fc-panel-strong p-6 w-full max-w-md bg-[#0D0F14] border border-white/10 space-y-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-purple-300 animate-spin" style={{ animationDuration: '3s' }} /> Correct AI Mapping
            </h3>
            
            <div className="space-y-4 text-xs">
              <div className="flex gap-4 p-2.5 rounded-xl bg-white/5 border border-white/5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="correct-option" 
                    checked={correctOption === 'folder'}
                    onChange={() => setCorrectOption('folder')}
                    className="cursor-pointer"
                  />
                  <span>Reassign Folder</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="correct-option" 
                    checked={correctOption === 'not_duplicate'}
                    onChange={() => setCorrectOption('not_duplicate')}
                    className="cursor-pointer"
                  />
                  <span>Clear Duplicate Flag</span>
                </label>
              </div>

              {correctOption === 'folder' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider block">Select Target Cluster Folder</label>
                  <select 
                    value={targetFolder} 
                    onChange={e => setTargetFolder(e.target.value)}
                    className="fc-input text-white"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    {mockGroups.map(g => (
                      <option key={g.id} value={g.id} className="bg-[#05070A]">{g.label} ({g.id})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setCorrectModal(false)} className="fc-btn-secondary w-full justify-center py-2.5 text-xs">Cancel</button>
              <button onClick={handleCorrectSubmit} className="fc-btn-primary w-full justify-center py-2.5 text-xs !bg-purple-600 !text-white shadow-none font-bold">Confirm Correction</button>
            </div>
          </div>
        </div>
      )}

      {/* ESCALATE DIALOG MODAL */}
      {escalateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-enter">
          <div className="fc-panel-strong p-6 w-full max-w-md bg-[#0D0F14] border border-white/10 space-y-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-[#F59E0B]" /> Escalate to Administration
            </h3>
            
            <div className="space-y-4 text-xs">
              <p className="text-white/40 leading-relaxed">
                This case will be removed from your active backlog queue and flagged for senior FaceCloud administration diagnostics override.
              </p>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider block">Escalation Reason Notes *</label>
                <textarea 
                  value={escalationNote}
                  onChange={e => setEscalationNote(e.target.value)}
                  className="w-full h-24 fc-input !p-3 resize-none"
                  placeholder="Explain why this case requires administrative review..."
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setEscalateModal(false)} className="fc-btn-secondary w-full justify-center py-2.5 text-xs">Cancel</button>
              <button 
                onClick={handleEscalateSubmit} 
                disabled={!escalationNote}
                className="fc-btn-primary w-full justify-center py-2.5 text-xs !bg-[#F59E0B] !text-black shadow-none font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Escalate Case
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
