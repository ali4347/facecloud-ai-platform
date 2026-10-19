import { useState } from 'react'
import { Loader2, RotateCw } from 'lucide-react'
import { ChartCard } from '../ui/ChartCard'
import { StatusBadge } from '../ui/StatusBadge'
import { AsyncGate } from './AsyncGate'
import { USE_API } from '../../lib/api/config'
import { listFailedBatches, listFailedJobs, retryFailedBatch, type FailedJobs } from '../../lib/api/adminOperations'
import { jobLabel } from '../../lib/adminHealth'
import { messageFor, useApiResource } from '../../lib/useApiResource'
import { formatDateTime } from '../../lib/utils'

const stageLabel = (stage: string) => (stage ? stage.replace(/_/g, ' ') : '—')

/**
 * What went wrong, with the person it happened to: upload batches that failed (with a Retry that runs the owner's own
 * retry) and the most recent failed job of every kind. Only the live server has these; the demo build hides the section.
 */
export function FailedWork() {
  if (!USE_API) return null
  return (
    <>
      <FailedBatches />
      <FailedJobs />
    </>
  )
}

function FailedBatches() {
  const [page, setPage] = useState(1)
  const state = useApiResource(signal => listFailedBatches(page, signal), () => ({ count: 0, next: null, previous: null, results: [] }), [page])
  const [busyId, setBusyId] = useState<number | null>(null)
  const [notes, setNotes] = useState<Record<number, { text: string; bad: boolean }>>({})

  const retry = async (id: number) => {
    setBusyId(id)
    setNotes(current => { const rest = { ...current }; delete rest[id]; return rest })
    try {
      await retryFailedBatch(id)
      setNotes(current => ({ ...current, [id]: { text: 'Retry started. It leaves this list when it succeeds.', bad: false } }))
      state.reload()
    } catch (caught) {
      setNotes(current => ({ ...current, [id]: { text: messageFor(caught), bad: true } }))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <ChartCard title="Failed uploads" subtitle="Upload batches that stopped with an error, newest first">
      <AsyncGate state={state} what="the failed uploads">
        {data => data.results.length === 0 ? (
          <p className="text-xs text-ink-mute py-4">No upload has failed. Nothing needs retrying.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-ink-faint border-b border-line">
                    <th className="py-2 pr-4">Upload</th><th className="py-2 pr-4">Owner</th><th className="py-2 pr-4">Organization</th><th className="py-2 pr-4">Photos</th>
                    <th className="py-2 pr-4">Stopped at</th><th className="py-2 pr-4">Error</th><th className="py-2 pr-4">Retries</th>
                    <th className="py-2 pr-4">When</th><th className="py-2"><span className="sr-only">Action</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line align-top">
                  {data.results.map(batch => (
                    <tr key={batch.id} className="text-ink">
                      <td className="py-2 pr-4 font-semibold">{batch.display_name || `Upload #${batch.id}`}<span className="block text-[10px] font-normal text-ink-faint">{batch.upload_type}</span></td>
                      <td className="py-2 pr-4">{batch.owner_username}</td>
                      <td className="py-2 pr-4 text-ink-mute">{batch.organization_name ?? '—'}</td>
                      <td className="py-2 pr-4">{batch.total_files} sent, {batch.accepted_files} accepted{(batch.failed_images ?? batch.processing_failed_files) > 0 ? <span className="text-[#EF4444]"> · {batch.failed_images ?? batch.processing_failed_files} failed</span> : null}</td>
                      <td className="py-2 pr-4 capitalize">{batch.failure_stage_label !== undefined ? batch.failure_stage_label || '—' : stageLabel(batch.current_stage)}</td>
                      <td className="py-2 pr-4 max-w-[18rem] break-words text-ink-mute">{batch.failure_reason || batch.processing_error || 'No error text was recorded'}</td>
                      <td className="py-2 pr-4 whitespace-nowrap">{batch.max_retries !== undefined ? `${batch.retry_count} of ${batch.max_retries}` : batch.retry_count}</td>
                      <td className="py-2 pr-4 whitespace-nowrap text-ink-mute">{formatDateTime(batch.failed_at ?? batch.updated_at)}</td>
                      <td className="py-2 text-right">
                        <button type="button" disabled={busyId !== null || batch.can_retry === false} title={batch.can_retry === false ? batch.retry_blocked_reason : undefined} onClick={() => void retry(batch.id)}
                          className="fc-btn-secondary !py-1.5 !px-3 text-[11px] font-bold inline-flex items-center gap-1.5 disabled:opacity-50">
                          {busyId === batch.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCw className="w-3.5 h-3.5" />}Retry
                        </button>
                        {batch.can_retry === false && batch.retry_blocked_reason && !notes[batch.id] && (
                          <p className="mt-1.5 text-[10px] max-w-[14rem] ml-auto text-ink-faint">{batch.retry_blocked_reason}</p>
                        )}
                        {notes[batch.id] && (
                          <p role={notes[batch.id].bad ? 'alert' : 'status'} className={`mt-1.5 text-[10px] max-w-[14rem] ml-auto ${notes[batch.id].bad ? 'text-[#F87171]' : 'text-[#10B981]'}`}>{notes[batch.id].text}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(data.previous || data.next) && (
              <div className="mt-4 flex items-center justify-between text-xs text-ink-mute">
                <span>{data.count} failed in all</span>
                <div className="flex gap-2">
                  <button type="button" disabled={!data.previous} onClick={() => setPage(p => Math.max(1, p - 1))} className="fc-btn-secondary !py-1.5 !px-3 text-[11px] disabled:opacity-40">Newer</button>
                  <button type="button" disabled={!data.next} onClick={() => setPage(p => p + 1)} className="fc-btn-secondary !py-1.5 !px-3 text-[11px] disabled:opacity-40">Older</button>
                </div>
              </div>
            )}
          </>
        )}
      </AsyncGate>
    </ChartCard>
  )
}

function FailedJobs() {
  const state = useApiResource<FailedJobs>(signal => listFailedJobs(signal), () => ({ generated_at: '', limit_per_kind: 10, kinds: {} }), [])
  return (
    <ChartCard title="Failed jobs" subtitle="The latest failures of each kind of background job, across every user">
      <AsyncGate state={state} what="the failed jobs">
        {data => {
          const kinds = Object.entries(data.kinds).filter(([, rows]) => rows.length > 0)
          if (kinds.length === 0) return <p className="text-xs text-ink-mute py-4">No background job has failed.</p>
          return (
            <div className="space-y-5">
              {kinds.map(([kind, rows]) => (
                <div key={kind}>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-xs font-bold text-ink">{rows[0]?.kind_label || jobLabel(kind)}</h4>
                    <StatusBadge status="error" label={`${rows.length} shown`} dot={false} />
                  </div>
                  <ul className="divide-y divide-line border border-line rounded-2xl overflow-hidden">
                    {rows.map(row => (
                      <li key={row.id} className="p-3 text-xs flex flex-wrap gap-x-6 gap-y-1 items-start justify-between bg-surface-mute">
                        <div className="min-w-0 flex-1">
                          <p className="text-ink break-words">{row.failure_reason || row.reason || 'No reason was recorded'}</p>
                          <p className="text-[10px] text-ink-faint mt-0.5">
                            #{row.id} · {row.owner_username}{row.organization_name ? ` · ${row.organization_name}` : ''}{row.failure_stage_label ? ` · stopped at ${row.failure_stage_label.toLowerCase()}` : ''}
                          </p>
                        </div>
                        <span className="text-[10px] text-ink-mute whitespace-nowrap">{formatDateTime(row.failed_at ?? row.updated_at)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <button type="button" onClick={state.reload} className="text-xs font-bold text-[#FB923C] hover:underline inline-flex items-center gap-1.5 cursor-pointer">
                <RotateCw className="w-3.5 h-3.5" />Refresh
              </button>
            </div>
          )
        }}
      </AsyncGate>
    </ChartCard>
  )
}
