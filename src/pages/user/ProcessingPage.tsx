import { useParams, Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { useBatchProgress } from '../../lib/imageData'
import { statusLabel } from '../../lib/imageData'
import { PIPELINE_STAGES, cancelBatch, retryBatch } from '../../lib/api/images'
import { formatDateTime } from '../../lib/utils'
import { explainReason } from '../../lib/reasons'
import { useState } from 'react'
import {
  AlertCircle, AlertTriangle, ArrowLeft, CheckCircle2, Circle, Loader2, RefreshCw, XCircle,
} from 'lucide-react'

/** The same wording the upload screen uses, for the stages the backend reports. */
const STAGE_LABELS: Record<string, { label: string; detail: string }> = {
  uploaded: { label: 'Upload received', detail: 'Your photos reached FaceCloud safely' },
  queued: { label: 'Queued', detail: 'Waiting for a free processing slot' },
  preprocessing: { label: 'Preparing the photos', detail: 'Reading them and standardising the format' },
  face_validation: { label: 'Looking for faces', detail: 'Checking a face is present and clear enough' },
  quality_analysis: { label: 'Checking quality', detail: 'Sharpness, lighting and how large the face is' },
  identity_grouping: { label: 'Matching to person folders', detail: 'Grouping each face with the same person' },
  enhancement: { label: 'Enhancing', detail: 'Improving exposure and detail' },
  finalizing: { label: 'Finishing up', detail: 'Saving the results and your downloads' },
  completed: { label: 'Done', detail: 'Everything that could be processed has been' },
}

export default function ProcessingPage() {
  const { id } = useParams<{ id: string }>()
  const batchId = id && /^\d+$/.test(id) ? Number(id) : null
  const { data, loading, error, isDemo, reload, finished } = useBatchProgress(batchId)
  const [action, setAction] = useState<{ busy: boolean; message: string }>({ busy: false, message: '' })

  const currentIndex = data ? PIPELINE_STAGES.indexOf(data.stage as typeof PIPELINE_STAGES[number]) : -1
  const failedStatus = data?.status === 'failed'
  const partial = data?.status === 'partial'

  const run = async (what: 'cancel' | 'retry') => {
    if (batchId === null) return
    setAction({ busy: true, message: '' })
    try {
      if (what === 'cancel') await cancelBatch(batchId)
      else await retryBatch(batchId)
      reload()
      setAction({ busy: false, message: what === 'cancel' ? 'Cancellation requested.' : 'Failed photos requeued.' })
    } catch (caught) {
      setAction({
        busy: false,
        message: caught instanceof Error ? caught.message : 'That did not work.',
      })
    }
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard/jobs"
          className="p-2 rounded-xl hover:bg-surface-mute border border-line text-ink-mute hover:text-ink"
          aria-label="Back to jobs"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader
          title={batchId ? `Upload ${batchId}` : 'Processing'}
          subtitle={
            finished ? 'This upload has finished.' : 'Following the pipeline as it works.'
          }
        />
      </div>

      {isDemo && (
        <div className="p-3 rounded-2xl text-xs flex items-center gap-2 bg-surface-mute border border-line text-ink-soft">
          <AlertTriangle className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
          Demo mode — there is no real upload to follow. Set <code className="fc-kbd">VITE_USE_API=true</code>.
        </div>
      )}

      {batchId === null && !isDemo && (
        <div className="fc-card p-10 text-center text-ink-faint">
          <p className="text-xs font-semibold text-ink">That is not an upload reference.</p>
          <Link to="/dashboard/jobs" className="text-xs font-bold text-[#FB923C] hover:underline mt-2 inline-block">
            Back to your uploads
          </Link>
        </div>
      )}

      {loading && (
        <div className="fc-card p-12 text-center text-ink-faint">
          <Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin" />
          <p className="text-xs font-semibold">Loading progress…</p>
        </div>
      )}

      {!loading && error && !data && (
        <div className="fc-card p-12 text-center">
          <AlertTriangle className="w-7 h-7 mx-auto mb-3 text-[#EF4444]" />
          <p className="text-xs font-semibold text-ink">{error}</p>
          <button
            type="button"
            onClick={reload}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#FB923C] hover:underline cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />Try again
          </button>
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <ChartCard
              title="What is happening"
              subtitle={`${Math.round(data.progress_percentage)}% through`}
            >
              <div className="space-y-4">
                {PIPELINE_STAGES.map((stage, index) => {
                  const copy = STAGE_LABELS[stage] ?? { label: stage, detail: '' }
                  const done = index < currentIndex || (finished && !failedStatus)
                  const active = index === currentIndex && !finished
                  return (
                    <div
                      key={stage}
                      className={`p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                        done ? 'bg-emerald-500/5 border-emerald-500/20 text-ink'
                        : active ? 'bg-accent/5 border-accent/30 text-ink ring-1 ring-accent'
                        : 'bg-surface-mute border-line text-ink-mute'
                      }`}
                    >
                      <div className="mt-0.5">
                        {done && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                        {active && <RefreshCw className="w-5 h-5 text-accent animate-spin" />}
                        {!done && !active && <Circle className="w-5 h-5 text-ink-mute/40" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center gap-2">
                          <h4 className="text-xs font-bold">{copy.label}</h4>
                          {active && (
                            <span className="text-[10px] text-accent font-bold uppercase tracking-wider">Running</span>
                          )}
                          {done && (
                            <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Done</span>
                          )}
                        </div>
                        <p className="text-[10px] text-ink-mute mt-0.5">{copy.detail}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ChartCard>

            {data.images.length > 0 && (
              <ChartCard title="Each photo" subtitle="A batch can finish partly — these are the individual results">
                <div className="overflow-x-auto">
                  <table className="w-full fc-table text-left">
                    <thead>
                      <tr><th>File</th><th>Stage</th><th>Status</th><th>Progress</th><th>Problem</th></tr>
                    </thead>
                    <tbody>
                      {data.images.map(image => (
                        <tr key={image.image_id} className="hover:bg-surface-mute transition-colors">
                          <td>
                            <Link
                              to={`/dashboard/images/${image.image_id}`}
                              className="text-xs font-bold text-ink hover:text-[#FB923C] truncate max-w-[220px] inline-block"
                            >
                              {image.filename}
                            </Link>
                          </td>
                          <td className="text-xs text-ink-soft">
                            {STAGE_LABELS[image.stage]?.label ?? image.stage}
                          </td>
                          <td className="text-xs text-ink-soft">{statusLabel(image.status)}</td>
                          <td className="text-xs font-mono text-ink-mute">
                            {Math.round(image.progress_percentage)}%
                          </td>
                          <td className="text-xs text-[#F87171] max-w-[220px] truncate" title={image.failure_reason ? `${explainReason(image.failure_reason).title}. ${explainReason(image.failure_reason).hint}` : undefined}>
                            {image.failure_reason ? explainReason(image.failure_reason).title : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ChartCard>
            )}
          </div>

          <div className="lg:col-span-4 space-y-6">
            <ChartCard title="This upload" subtitle="Where it stands">
              <div className="space-y-5">
                <div className="p-4 rounded-3xl bg-surface-mute border border-line text-xs text-ink-mute space-y-3.5">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={`font-bold ${
                      failedStatus ? 'text-[#F87171]'
                      : partial ? 'text-[#F59E0B]'
                      : finished ? 'text-emerald-400' : 'text-accent'
                    }`}>
                      {statusLabel(data.status)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Photos:</span>
                    <span className="font-bold text-ink">{data.images.length}</span>
                  </div>
                  {Object.entries(data.counts)
                    .filter(([, count]) => count > 0)
                    .map(([name, count]) => (
                      <div key={name} className="flex justify-between">
                        <span>{statusLabel(name)}:</span>
                        <span className="font-bold text-ink">{count}</span>
                      </div>
                    ))}
                  {data.estimated_completion_at && !finished && (
                    <div className="flex justify-between">
                      <span>Expected by:</span>
                      <span className="font-bold text-ink">{formatDateTime(data.estimated_completion_at)}</span>
                    </div>
                  )}
                  {data.retry_count > 0 && (
                    <div className="flex justify-between">
                      <span>Retries:</span>
                      <span className="font-bold text-ink">{data.retry_count}</span>
                    </div>
                  )}
                </div>

                {partial && (
                  <div className="p-4 rounded-3xl bg-[#F59E0B]/5 border border-[#F59E0B]/20 flex gap-3 text-xs text-ink-mute">
                    <AlertCircle className="w-5 h-5 text-[#F59E0B] flex-shrink-0" />
                    <p>Some photos went through and some did not. The table shows which.</p>
                  </div>
                )}

                {failedStatus && (
                  <div className="p-4 rounded-3xl bg-[#EF4444]/5 border border-[#EF4444]/20 flex gap-3 text-xs text-ink-mute">
                    <XCircle className="w-5 h-5 text-[#F87171] flex-shrink-0" />
                    <p>Nothing in this upload could be processed. Retrying requeues the failures.</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {!finished && !data.cancellation_requested && (
                    <button
                      type="button"
                      disabled={action.busy}
                      onClick={() => run('cancel')}
                      className="px-4 py-2 rounded-xl text-xs font-bold border border-line text-ink-soft hover:text-ink transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Cancel upload
                    </button>
                  )}
                  {finished && (failedStatus || partial) && (
                    <button
                      type="button"
                      disabled={action.busy}
                      onClick={() => run('retry')}
                      className="fc-btn-primary !py-2 !px-4 text-xs font-bold cursor-pointer disabled:opacity-50"
                    >
                      Retry the failures
                    </button>
                  )}
                  <Link
                    to="/dashboard/images"
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-line text-ink-soft hover:text-ink transition-colors"
                  >
                    My Images
                  </Link>
                </div>

                {data.cancellation_requested && !finished && (
                  <p className="text-[11px] text-[#F59E0B]">
                    Cancellation requested — the pipeline stops after the photo it is on.
                  </p>
                )}
                {action.message && <p className="text-[11px] text-ink-mute">{action.message}</p>}
                {error && data && (
                  <p className="text-[11px] text-[#F87171]">
                    Lost contact for a moment ({error}) — still trying.
                  </p>
                )}
              </div>
            </ChartCard>
          </div>
        </div>
      )}
    </div>
  )
}
