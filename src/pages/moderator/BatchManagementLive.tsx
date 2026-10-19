import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle, ChevronDown, ChevronUp, HelpCircle, Loader2, Play, RefreshCw, Search, X } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { AuthedImage } from '../../components/ui/AuthedImage'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { ModeratorGate } from '../../components/moderator/ModeratorGate'
import {
  cancelBatch, getModeratorBatch, getPreview, listModeratorBatches, reprocessBatch, retryBatch,
  type ModeratorBatch, type ModeratorBatchDetail,
} from '../../lib/api/moderatorConsole'
import { formatBytes } from '../../lib/imageData'
import { useModeratorOrganization, useModeratorResource } from '../../lib/moderationData'
import { explainReason } from '../../lib/reasons'
import { messageFor } from '../../lib/useApiResource'
import { formatDateTime } from '../../lib/utils'

const ACTIVE = ['pending', 'queued', 'processing']
const TONE: Record<string, { text: string; bar: string }> = {
  completed: { text: 'text-[#10B981]', bar: '#10B981' },
  partial: { text: 'text-[#F59E0B]', bar: '#F59E0B' },
  failed: { text: 'text-red-400', bar: '#EF4444' },
  cancelled: { text: 'text-ink-faint', bar: 'rgb(var(--a-line))' },
}
const toneOf = (status: string) => TONE[status] ?? { text: 'text-[#F97316] animate-pulse', bar: '#F97316' }

const OUTCOME_CLASS: Record<string, string> = {
  accepted: 'bg-[#10B981]/10 text-[#10B981]',
  rejected: 'bg-[#EF4444]/10 text-[#EF4444]',
  needs_review: 'bg-violet-500/10 text-violet-400',
  failed: 'bg-[#F59E0B]/10 text-[#F59E0B]',
  cancelled: 'bg-surface-mute text-ink-faint',
  processing: 'bg-[#F97316]/10 text-[#F97316]',
}

export function LiveBatchManagement() {
  const { organizationId } = useModeratorOrganization()
  const state = useModeratorResource((id, signal) => listModeratorBatches(id, signal), () => [] as ModeratorBatch[], [])
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState<number | null>(null)
  const [detail, setDetail] = useState<ModeratorBatchDetail | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [reprocessing, setReprocessing] = useState<ModeratorBatch | null>(null)
  const [reason, setReason] = useState('')
  const [reprocessError, setReprocessError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ text: string; bad?: boolean } | null>(null)

  const say = (text: string, bad = false) => { setToast({ text, bad }); setTimeout(() => setToast(null), 4000) }

  // Keep a batch that is still running fresh.
  const anyRunning = (state.data ?? []).some(b => ACTIVE.includes(b.processing_status))
  const reload = state.reload
  useEffect(() => {
    if (!anyRunning) return
    const timer = setInterval(reload, 6000)
    return () => clearInterval(timer)
  }, [anyRunning, reload])

  useEffect(() => {
    if (open === null || organizationId === null) { setDetail(null); return }
    const controller = new AbortController()
    setDetail(null); setDetailError(null)
    getModeratorBatch(organizationId, open, controller.signal)
      .then(d => { if (!controller.signal.aborted) setDetail(d) })
      .catch(e => { if (!controller.signal.aborted) setDetailError(messageFor(e)) })
    return () => controller.abort()
  }, [open, organizationId, state.data])

  const rows = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return (state.data ?? []).filter(b => !needle || b.name.toLowerCase().includes(needle) || String(b.id).includes(needle) || b.owner_username.toLowerCase().includes(needle))
  }, [state.data, search])

  const act = async (batch: ModeratorBatch, work: () => Promise<unknown>, done: string) => {
    setBusy(`${batch.id}`)
    try { await work(); say(done); state.reload() } catch (caught) { say(messageFor(caught), true) } finally { setBusy(null) }
  }

  return (
    <div className="space-y-6 page-enter relative">
      {toast && (
        <div role="status" className={`fixed top-6 right-6 z-50 p-4 rounded-3xl border text-xs font-bold flex items-center gap-2 backdrop-blur-md ${
          toast.bad ? 'bg-[#EF4444]/10 border-[#EF4444]/25 text-[#F87171]' : 'bg-[#10B981]/10 border-[#10B981]/20 text-[#10B981]'}`}>
          {toast.bad ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}<span>{toast.text}</span>
        </div>
      )}
      <PageHeader title="Batch Management" subtitle="Uploads submitted to your organization: watch their progress and retry, cancel or reprocess them." />

      <ModeratorGate state={state} what="the batches">
        {() => (
          <ChartCard title="All Batch Ingestions" subtitle="Newest activity first">
            <div className="space-y-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-3 w-4 h-4 text-ink-faint" />
                <input type="text" placeholder="Search by name, ID or uploader..." value={search} onChange={e => setSearch(e.target.value)} className="fc-input !pl-10 !py-2" />
              </div>

              {rows.map(batch => {
                const expanded = open === batch.id
                const tone = toneOf(batch.processing_status)
                const running = ACTIVE.includes(batch.processing_status)
                const canCancel = running
                const canRetry = (batch.processing_status === 'failed' || batch.processing_status === 'partial') && batch.counts.failed > 0
                const canReprocess = batch.processing_status === 'completed' || batch.processing_status === 'partial'
                return (
                  <div key={batch.id} className="rounded-3xl border border-line bg-surface-mute overflow-hidden">
                    <div className="p-5 flex flex-wrap lg:flex-nowrap items-center justify-between gap-4 cursor-pointer" onClick={() => setOpen(expanded ? null : batch.id)}>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-ink text-sm break-all">{batch.name}</h4>
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-mono bg-surface-mute text-ink-faint">#{batch.id}</span>
                          <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-surface-mute text-ink-mute">{batch.upload_type}</span>
                        </div>
                        <p className="text-[10px] text-ink-faint mt-1">Submitted by {batch.owner_username} on {formatDateTime(batch.created_at)}</p>
                      </div>
                      <div className="w-full lg:w-48 shrink-0 space-y-1.5">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className={`font-bold uppercase tracking-wider ${tone.text}`}>{batch.processing_status}</span>
                          <span className="text-ink-mute">{Math.round(batch.progress_percentage)}%</span>
                        </div>
                        <div className="w-full h-1 bg-surface rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${batch.progress_percentage}%`, backgroundColor: tone.bar }} />
                        </div>
                      </div>
                      <div className="flex gap-3 text-[10px] bg-surface-mute p-2 px-3 rounded-2xl border border-line shrink-0">
                        <span className="text-[#10B981] font-bold" title="Accepted">✓ {batch.counts.accepted}</span>
                        <span className="text-red-400 font-bold" title="Rejected">✗ {batch.counts.rejected}</span>
                        <span className="text-violet-400 font-bold" title="Needs review">⚠ {batch.counts.needs_review}</span>
                        {batch.counts.failed > 0 && <span className="text-[#F59E0B] font-bold" title="Failed">— {batch.counts.failed}</span>}
                      </div>
                      <div className="text-ink-faint">{expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</div>
                    </div>

                    {expanded && (
                      <div className="p-5 border-t border-line space-y-4">
                        {batch.processing_error && <p className="text-xs text-[#F87171]">{batch.processing_error}</p>}
                        <div className="flex flex-wrap gap-2 items-center justify-between">
                          <span className="text-[10px] text-ink-faint font-bold uppercase tracking-wider">Pipeline controls</span>
                          <div className="flex gap-2">
                            <button type="button" disabled={!canRetry || busy === `${batch.id}`} title="Requeue the photos that failed, from where they failed"
                              onClick={() => organizationId !== null && act(batch, () => retryBatch(organizationId, batch.id), `Retrying batch ${batch.id}.`)}
                              className="fc-btn-secondary !py-2 !px-3 text-[10px] font-bold disabled:opacity-40 disabled:cursor-not-allowed"><RefreshCw className="w-3 h-3" /> Retry failed</button>
                            <button type="button" disabled={!canReprocess || busy === `${batch.id}`} title="Run enhancement again for every eligible photo; originals and earlier results are kept"
                              onClick={() => { setReason(''); setReprocessError(null); setReprocessing(batch) }}
                              className="fc-btn-secondary !py-2 !px-3 text-[10px] font-bold disabled:opacity-40 disabled:cursor-not-allowed"><Play className="w-3 h-3" /> Reprocess</button>
                            <button type="button" disabled={!canCancel || busy === `${batch.id}`} title="Stop a batch that is still in progress"
                              onClick={() => organizationId !== null && act(batch, () => cancelBatch(organizationId, batch.id), `Batch ${batch.id} cancelled.`)}
                              className="fc-btn-secondary !py-2 !px-3 text-[10px] font-bold !text-red-400 disabled:opacity-40 disabled:cursor-not-allowed"><X className="w-3 h-3" /> Cancel</button>
                          </div>
                        </div>

                        {!detail && !detailError && <div className="py-6 text-center"><Loader2 className="w-5 h-5 mx-auto animate-spin text-ink-faint" /></div>}
                        {detailError && <p role="alert" className="text-xs text-[#F87171]">{detailError}</p>}
                        {detail && detail.batch.id === batch.id && (
                          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                            {detail.images.length === 0 && <p className="text-center py-6 text-xs text-ink-faint">No files tracked under this batch.</p>}
                            {detail.images.map(img => (
                              <div key={img.id} className="p-3 rounded-2xl bg-surface border border-line flex items-center gap-3 text-xs">
                                <AuthedImage load={img.preview_url ? signal => getPreview(img.preview_url as string, signal) : null} cacheKey={`batch-img-${img.id}`} alt="" box={36} rounded="rounded-lg" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-ink-soft truncate">{img.original_name}</p>
                                  {(img.rejection_reason || img.failure_reason) && (
                                    <p className="text-[10px] text-ink-faint truncate">{img.failure_reason || explainReason(img.rejection_reason).title}</p>
                                  )}
                                </div>
                                <span className="text-[10px] text-ink-faint">{formatBytes(img.file_size)}</span>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${OUTCOME_CLASS[img.outcome] ?? OUTCOME_CLASS.processing}`}>{img.outcome.replace('_', ' ')}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {rows.length === 0 && (
                <div className="text-center py-12 text-ink-faint">
                  <HelpCircle className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-xs font-semibold">{search ? 'No batch matches that search.' : 'No uploads have been submitted to your organization yet.'}</p>
                </div>
              )}
            </div>
          </ChartCard>
        )}
      </ModeratorGate>

      {reprocessing && organizationId !== null && (
        <ConfirmDialog title="Reprocess this batch" confirmLabel="Reprocess" busyLabel="Starting…" busy={busy === `${reprocessing.id}`} error={reprocessError}
          onCancel={() => setReprocessing(null)}
          onConfirm={async () => {
            const batch = reprocessing
            setBusy(`${batch.id}`); setReprocessError(null)
            try {
              const result = await reprocessBatch(organizationId, batch.id, reason.trim())
              say(`Enhancement started for ${result.total_images} photo${result.total_images === 1 ? '' : 's'}.`)
              setReprocessing(null); state.reload()
            } catch (caught) { setReprocessError(messageFor(caught)) } finally { setBusy(null) }
          }}>
          <p>Enhancement runs again for every eligible photo in “{reprocessing.name}”. Originals and earlier results are kept; each photo gets a new version.</p>
          <label htmlFor="reprocess-reason" className="block text-xs font-semibold text-ink pt-1">Reason (optional)</label>
          <input id="reprocess-reason" value={reason} onChange={e => setReason(e.target.value)} maxLength={500} className="fc-input" />
        </ConfirmDialog>
      )}
    </div>
  )
}
