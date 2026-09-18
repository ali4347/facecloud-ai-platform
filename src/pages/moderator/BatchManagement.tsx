import { useState, useMemo } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { mockBatches, mockModeratorAudit, mockModNotifications } from '../../data/mock'
import type { BatchRecord } from '../../data/mock'
import { formatDateTime } from '../../lib/utils'
import { 
  Play, Download, X, RefreshCw, ChevronDown, ChevronUp, CheckCircle, Search, HelpCircle, ShieldAlert 
} from 'lucide-react'

export default function BatchManagement() {
  const [batches, setBatches] = useState<BatchRecord[]>(mockBatches)
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const sessionStr = localStorage.getItem('facecloud_session')
  const session = sessionStr ? JSON.parse(sessionStr) : { name: 'Vaneeza Sohaib' }

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Audit and notification logging
  const logBatchAction = (batchId: string, action: string, details: string) => {
    mockModeratorAudit.unshift({
      id: `ma-${Date.now()}`,
      timestamp: new Date().toISOString(),
      moderatorName: session.name,
      filename: batchId,
      action: action,
      oldStatus: 'active',
      newStatus: 'modified',
      reason: details,
      userNotified: true
    })

    mockModNotifications.unshift({
      id: `n-${Date.now()}`,
      type: 'Assignment',
      description: `Batch ${batchId}: ${action} executed by ${session.name}`,
      timestamp: new Date().toISOString(),
      isRead: false
    })
  }

  // Batch actions
  const handleCancel = (id: string) => {
    setBatches(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled', progress: 100 } : b))
    logBatchAction(id, 'Cancel Ingestion', `Ingestion cancelled manually.`)
    showToast(`Batch ${id} ingestion cancelled.`)
  }

  const handleReprocess = (id: string) => {
    setBatches(prev => prev.map(b => b.id === id ? { ...b, status: 'processing', progress: 0 } : b))
    logBatchAction(id, 'Reprocess Batch', `Re-triggered batch pipeline processing.`)
    showToast(`Batch ${id} scheduled for reprocessing.`)
  }

  const handleRetry = (id: string) => {
    setBatches(prev => prev.map(b => b.id === id ? { ...b, status: 'processing', progress: 0 } : b))
    logBatchAction(id, 'Retry Ingestion', `Retried pipeline processing queue.`)
    showToast(`Retrying batch ${id} processing.`)
  }

  const handleDownload = (id: string) => {
    logBatchAction(id, 'Download Batch Results', `Downloaded enhanced batch archives.`)
    showToast(`Downloading results for batch ${id}...`)
  }

  const toggleExpand = (id: string) => {
    setExpandedBatchId(expandedBatchId === id ? null : id)
  }

  // Search filter
  const filteredBatches = useMemo(() => {
    return batches.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()) || b.id.includes(searchTerm))
  }, [batches, searchTerm])

  return (
    <div className="space-y-6 page-enter relative">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-3xl bg-[#10B981]/10 border border-[#10B981]/20 text-xs font-bold text-[#10B981] flex items-center gap-2 shadow-[0_4px_24px_rgba(16,185,129,0.15)] backdrop-blur-md animate-enter">
          <CheckCircle className="w-4.5 h-4.5" />
          <span>{toastMessage}</span>
        </div>
      )}

      <PageHeader 
        title="Batch Management"
        subtitle="Monitor and control multi-image uploads and archive unzipping pipelines."
      />

      <div className="grid grid-cols-1 gap-6">
        <ChartCard title="All Batch Ingestions" subtitle="Track execution logs and control tasks status">
          <div className="space-y-4">
            
            {/* Search Input */}
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-3 w-4 h-4 text-ink-faint" />
              <input 
                type="text" 
                placeholder="Search batch by name or ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="fc-input !pl-10 !py-2"
              />
            </div>

            {/* Batch List */}
            <div className="space-y-4">
              {filteredBatches.map(batch => {
                const isExpanded = expandedBatchId === batch.id
                
                // Actions eligibility
                const canCancel = batch.status === 'processing'
                const canReprocess = batch.status === 'completed'
                const canRetry = batch.status === 'failed' || batch.status === 'cancelled'
                const canDownload = batch.status === 'completed'
                const isLocked = batch.status === 'locked'

                return (
                  <div key={batch.id} className="rounded-3xl border border-line bg-surface-mute overflow-hidden transition-all duration-300">
                    {/* Header Row */}
                    <div 
                      className="p-5 flex flex-wrap lg:flex-nowrap items-center justify-between gap-4 cursor-pointer hover:bg-surface-mute"
                      onClick={() => toggleExpand(batch.id)}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-ink text-sm">{batch.name}</h4>
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-surface-mute text-ink-faint">{batch.id}</span>
                          <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-surface-mute text-ink-mute">
                            {batch.type}
                          </span>
                        </div>
                        <p className="text-[10px] text-ink-faint mt-1">
                          Submitted by {batch.submittedBy} on {formatDateTime(batch.submittedAt)}
                        </p>
                      </div>

                      {/* Progress & Status */}
                      <div className="w-full lg:w-48 shrink-0 space-y-1.5">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className={`font-bold uppercase tracking-wider ${
                            batch.status === 'completed' ? 'text-[#10B981]' :
                            batch.status === 'processing' ? 'text-[#F97316] animate-pulse' :
                            batch.status === 'failed' ? 'text-red-400' :
                            batch.status === 'cancelled' ? 'text-ink-faint' :
                            'text-[#F59E0B]'
                          }`}>
                            {batch.status}
                          </span>
                          <span className="text-ink-mute">{batch.progress}%</span>
                        </div>
                        <div className="w-full h-1 bg-surface-mute rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-300"
                            style={{ 
                              width: `${batch.progress}%`,
                              backgroundColor: 
                                batch.status === 'completed' ? '#10B981' :
                                batch.status === 'processing' ? '#F97316' :
                                batch.status === 'failed' ? '#EF4444' :
                                batch.status === 'cancelled' ? 'rgb(var(--a-line))' :
                                '#F59E0B'
                            }}
                          />
                        </div>
                      </div>

                      {/* Counts */}
                      <div className="flex gap-3 text-[10px] bg-surface-mute p-2 px-3 rounded-2xl border border-line shrink-0">
                        <span className="text-[#10B981] font-bold">✓ {batch.counts.accepted}</span>
                        <span className="text-red-400 font-bold">✗ {batch.counts.rejected}</span>
                        <span className="text-violet-400 font-bold">⚠ {batch.counts.review}</span>
                        {batch.counts.failed > 0 && <span className="text-[#F59E0B] font-bold">— {batch.counts.failed}</span>}
                      </div>

                      {/* Expand Toggle */}
                      <div className="text-ink-faint">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>

                    {/* Expandable Section */}
                    {isExpanded && (
                      <div className="p-5 bg-surface-mute border-t border-line space-y-4">
                        {/* Control Actions Bar */}
                        <div className="flex flex-wrap gap-2 items-center justify-between">
                          <span className="text-[10px] text-ink-faint font-bold uppercase tracking-wider">Ingestion Pipeline Controls</span>
                          
                          <div className="flex gap-2">
                            {isLocked ? (
                              <div className="relative group inline-block">
                                <span className="text-[10px] text-ink-faint font-semibold cursor-not-allowed italic flex items-center gap-1.5 px-3 py-2 bg-surface-mute border border-line rounded-xl">
                                  <ShieldAlert className="w-3.5 h-3.5" /> Locked
                                </span>
                                <div className="absolute bottom-full right-0 mb-2 w-56 p-2 bg-[rgb(var(--a-surface))]/95 border border-line rounded-xl text-[9px] text-[#EF4444] font-bold shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 text-center leading-normal">
                                  This batch has already completed and can't be modified.
                                </div>
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleRetry(batch.id)}
                                  disabled={!canRetry}
                                  className="fc-btn-secondary !py-2 !px-3 text-[10px] font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                                  title="Retry failed or cancelled ingestion queue"
                                >
                                  <RefreshCw className="w-3 h-3" /> Retry
                                </button>
                                <button
                                  onClick={() => handleReprocess(batch.id)}
                                  disabled={!canReprocess}
                                  className="fc-btn-secondary !py-2 !px-3 text-[10px] font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                                  title="Reprocess all images in completed batch"
                                >
                                  <Play className="w-3 h-3" /> Reprocess
                                </button>
                                <button
                                  onClick={() => handleCancel(batch.id)}
                                  disabled={!canCancel}
                                  className="fc-btn-secondary !py-2 !px-3 text-[10px] font-bold !text-red-400 hover:!border-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
                                  title="Safely cancel active processing queue"
                                >
                                  <X className="w-3 h-3" /> Cancel Ingest
                                </button>
                                <button
                                  onClick={() => handleDownload(batch.id)}
                                  disabled={!canDownload}
                                  className="fc-btn-primary !py-2 !px-4 text-[10px] font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                                  title="Download accepted batch ZIP output"
                                >
                                  <Download className="w-3 h-3" /> Download Results
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Images list breakdown */}
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {batch.images.length === 0 ? (
                            <p className="text-center py-6 text-xs text-ink-faint">No files tracked under this queue record.</p>
                          ) : (
                            batch.images.map(img => (
                              <div key={img.id} className="p-3 rounded-2xl bg-surface-mute border border-line flex items-center justify-between text-xs">
                                <span className="font-bold text-ink-soft">{img.filename}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] text-ink-faint">{img.size}</span>
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                    img.outcome === 'accepted' ? 'bg-[#10B981]/10 text-[#10B981]' :
                                    img.outcome === 'rejected' ? 'bg-[#EF4444]/10 text-[#EF4444]' :
                                    img.outcome === 'review' ? 'bg-violet-500/10 text-violet-400' :
                                    'bg-[#F59E0B]/10 text-[#F59E0B]'
                                  }`}>
                                    {img.outcome}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {filteredBatches.length === 0 && (
              <div className="text-center py-12 text-ink-faint">
                <HelpCircle className="w-8 h-8 mx-auto mb-3 opacity-30 animate-pulse" />
                <p className="text-xs font-semibold">No batch ingestion logs found.</p>
              </div>
            )}

          </div>
        </ChartCard>
      </div>
    </div>
  )
}
