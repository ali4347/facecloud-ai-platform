import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { useReviewQueue } from '../../lib/moderationData'
import {
  BULK_LIMIT,
  bulkDecide,
  claimReview,
  deadlineState,
  releaseReview,
  sourceLabel,
  statusLabel,
  type ModeratorReview,
  type ReviewQueueFilters,
  type ReviewSource,
  type ReviewStatus,
} from '../../lib/api/moderation'
import { heldByAnother, useModeratorOrganization } from '../../lib/moderationData'
import { ReviewThumbnail } from '../../components/features/ReviewThumbnail'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { formatDateTime } from '../../lib/utils'
import { QUEUE_REFRESH_MS, getQueueAutoRefresh } from '../../lib/moderatorPrefs'
import { AlertTriangle, Check, Clock, Eye, Loader2, Lock, RefreshCw, Unlock, X } from 'lucide-react'

type BulkAction = 'approve' | 'reject' | 'escalate'

const DEADLINE_STYLES = {
  overdue: { label: 'Overdue', className: 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/25' },
  'due-soon': { label: 'Due soon', className: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/25' },
  'on-track': { label: 'On track', className: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/25' },
  met: { label: 'Met', className: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/25' },
  missed: { label: 'Missed', className: 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/25' },
  none: { label: 'No deadline', className: 'bg-surface-mute text-ink-faint border-line' },
} as const

function DeadlineChip({ review }: { review: ModeratorReview }) {
  const state = deadlineState(review)
  const style = DEADLINE_STYLES[state]
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${style.className}`}
      title={review.due_at ? `Due ${formatDateTime(review.due_at)}` : 'No review deadline was set'}
    >
      <Clock className="w-3 h-3" />
      {style.label}
    </span>
  )
}

export default function ReviewQueue() {
  const [status, setStatus] = useState<'' | ReviewStatus>('')
  const [source, setSource] = useState<'' | ReviewSource>('')
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [assignment, setAssignment] = useState<'' | 'mine' | 'unassigned'>('')
  const [byDeadline, setByDeadline] = useState(true)

  const filters: ReviewQueueFilters = useMemo(() => ({
    ...(status ? { status } : {}),
    ...(source ? { source } : {}),
    ...(overdueOnly ? { overdue: true } : {}),
    ...(assignment ? { assignment } : {}),
    ...(byDeadline ? { ordering: 'due_at' as const } : {}),
  }), [status, source, overdueOnly, assignment, byDeadline])

  const { data, loading, error, isDemo, reload } = useReviewQueue(filters)

  // Settings → Auto-refresh: pull in new reviews every half minute while this screen is open.
  useEffect(() => {
    if (isDemo || !getQueueAutoRefresh()) return
    const timer = setInterval(reload, QUEUE_REFRESH_MS)
    return () => clearInterval(timer)
  }, [isDemo, reload])
  const { organizationId } = useModeratorOrganization()
  const reviews = data ?? []

  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  const openReviews = reviews.filter(review => !review.decided_at)
  const allOpenSelected = openReviews.length > 0 && openReviews.every(review => selected.has(review.id))

  const toggle = (id: number) => setSelected(previous => {
    const next = new Set(previous)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })

  const toggleAll = () => setSelected(
    allOpenSelected ? new Set() : new Set(openReviews.slice(0, BULK_LIMIT).map(review => review.id)),
  )

  /* Every action here is unavailable in the demo, because there is no server to
     record it against; the banner above the table says so rather than letting a
     click fail silently. */
  const guard = () => {
    if (isDemo || organizationId === null) {
      setNotice({ kind: 'error', text: 'Connect the API to act on reviews. This is demo data.' })
      return false
    }
    return true
  }

  const [bulkAsk, setBulkAsk] = useState<'approve' | 'reject' | null>(null)
  const [bulkMessage, setBulkMessage] = useState('')

  const runBulk = async (action: BulkAction, messageToMember = '') => {
    if (!guard() || organizationId === null) return
    setBusy(true)
    setNotice(null)
    try {
      const result = await bulkDecide(organizationId, {
        review_ids: [...selected], action, ...(messageToMember.trim() ? { message_to_member: messageToMember.trim() } : {}),
      })
      // 200 does not mean everything went through: rows already decided or held
      // by another moderator come back under `failed`, so report both numbers.
      const text = result.failed_count === 0
        ? `${result.succeeded_count} review${result.succeeded_count === 1 ? '' : 's'} ${action}d.`
        : `${result.succeeded_count} ${action}d, ${result.failed_count} could not be: `
          + result.failed.map(failure => `#${failure.review_id} ${failure.detail}`).join('; ')
      setNotice({ kind: result.failed_count === 0 ? 'ok' : 'error', text })
      setSelected(new Set())
      reload()
    } catch (caught) {
      setNotice({ kind: 'error', text: caught instanceof Error ? caught.message : 'The bulk action failed.' })
    } finally {
      setBusy(false)
    }
  }

  const runClaim = async (review: ModeratorReview) => {
    if (!guard() || organizationId === null) return
    setBusy(true)
    setNotice(null)
    try {
      if (review.is_claimed) await releaseReview(organizationId, review.id)
      else await claimReview(organizationId, review.id)
      reload()
    } catch (caught) {
      setNotice({ kind: 'error', text: caught instanceof Error ? caught.message : 'Could not change the claim.' })
    } finally {
      setBusy(false)
    }
  }

  const selectStyle = {
    background: 'rgb(var(--a-surface-mute))',
    border: '1px solid rgb(var(--a-line))',
  }

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="Review Queue"
        subtitle={`${openReviews.length} review${openReviews.length === 1 ? '' : 's'} awaiting a decision`}
      />

      {isDemo && (
        <div className="p-3 rounded-2xl text-xs flex items-center gap-2 bg-surface-mute border border-line text-ink-soft">
          <AlertTriangle className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
          Showing demo data. Set <code className="fc-kbd">VITE_USE_API=true</code> to work the real queue.
        </div>
      )}

      {notice && (
        <div
          className={`p-3 rounded-2xl text-xs border ${
            notice.kind === 'ok'
              ? 'bg-[#10B981]/10 border-[#10B981]/25 text-[#10B981]'
              : 'bg-[#EF4444]/10 border-[#EF4444]/25 text-[#F87171]'
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 rounded-3xl bg-surface-mute border border-line text-xs text-ink-soft">
        <select
          value={status}
          onChange={event => setStatus(event.target.value as '' | ReviewStatus)}
          className="fc-input text-ink" style={selectStyle} aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in_review">In review</option>
          <option value="escalated">Escalated</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="corrected">Corrected</option>
        </select>

        <select
          value={source}
          onChange={event => setSource(event.target.value as '' | ReviewSource)}
          className="fc-input text-ink" style={selectStyle} aria-label="Filter by what raised the review"
        >
          <option value="">All sources</option>
          <option value="quality">Quality exceptions</option>
          <option value="duplicate">Suspected duplicates</option>
          <option value="identity">Identity matches</option>
        </select>

        <select
          value={assignment}
          onChange={event => setAssignment(event.target.value as '' | 'mine' | 'unassigned')}
          className="fc-input text-ink" style={selectStyle} aria-label="Filter by assignment"
        >
          <option value="">Anyone's</option>
          <option value="mine">Assigned to me</option>
          <option value="unassigned">Unassigned</option>
        </select>

        <label className="flex items-center gap-2 px-3 rounded-2xl cursor-pointer" style={selectStyle}>
          <input
            type="checkbox" checked={overdueOnly}
            onChange={event => setOverdueOnly(event.target.checked)}
            className="accent-[#F97316]"
          />
          Overdue only
        </label>

        <label className="flex items-center gap-2 px-3 rounded-2xl cursor-pointer" style={selectStyle}>
          <input
            type="checkbox" checked={byDeadline}
            onChange={event => setByDeadline(event.target.checked)}
            className="accent-[#F97316]"
          />
          Deadline first
        </label>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="p-3 rounded-2xl bg-surface border border-line shadow-soft flex flex-wrap items-center gap-3 text-xs">
          <span className="font-bold text-ink">
            {selected.size} selected
            {selected.size >= BULK_LIMIT && <span className="text-ink-faint"> (limit {BULK_LIMIT})</span>}
          </span>
          <div className="flex gap-2 ml-auto">
            <button
              type="button" disabled={busy} onClick={() => { if (guard()) { setBulkMessage(''); setBulkAsk('approve') } }}
              className="px-3 py-1.5 rounded-xl font-bold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/25 hover:bg-[#10B981]/20 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5 inline mr-1" />Approve
            </button>
            <button
              type="button" disabled={busy} onClick={() => { if (guard()) { setBulkMessage(''); setBulkAsk('reject') } }}
              className="px-3 py-1.5 rounded-xl font-bold bg-[#EF4444]/10 text-[#F87171] border border-[#EF4444]/25 hover:bg-[#EF4444]/20 transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5 inline mr-1" />Reject
            </button>
            <button
              type="button" disabled={busy} onClick={() => runBulk('escalate')}
              className="px-3 py-1.5 rounded-xl font-bold bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/25 hover:bg-[#F59E0B]/20 transition-colors cursor-pointer disabled:opacity-50"
            >
              <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />Escalate
            </button>
            <button
              type="button" onClick={() => setSelected(new Set())}
              className="px-3 py-1.5 rounded-xl font-bold text-ink-mute hover:text-ink transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <ChartCard
        title="Verification backlog"
        subtitle="Previews are thumbnails; correcting a review needs the full record, so open it individually"
      >
        {loading && (
          <div className="text-center py-16 text-ink-faint">
            <Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin" />
            <p className="text-xs font-semibold">Loading the queue...</p>
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-16">
            <AlertTriangle className="w-7 h-7 mx-auto mb-3 text-[#EF4444]" />
            <p className="text-xs font-semibold text-ink">{error}</p>
            <button
              type="button" onClick={reload}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#FB923C] hover:underline cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />Try again
            </button>
          </div>
        )}

        {!loading && !error && reviews.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full fc-table text-left">
              <thead>
                <tr>
                  <th className="w-8">
                    <input
                      type="checkbox" checked={allOpenSelected} onChange={toggleAll}
                      disabled={openReviews.length === 0} className="accent-[#F97316]"
                      aria-label="Select every open review"
                    />
                  </th>
                  <th>Photo</th>
                  <th>Review</th>
                  <th>Raised by</th>
                  <th>AI confidence</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th>Held by</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map(review => (
                  <tr key={review.id} className="hover:bg-surface-mute transition-colors">
                    <td>
                      <input
                        type="checkbox" checked={selected.has(review.id)}
                        onChange={() => toggle(review.id)} disabled={Boolean(review.decided_at)}
                        className="accent-[#F97316]"
                        aria-label={`Select review ${review.id}`}
                      />
                    </td>
                    <td>
                      <ReviewThumbnail
                        organizationId={organizationId}
                        reviewId={review.id}
                        alt={`Photo for review ${review.id}`}
                      />
                    </td>
                    <td>
                      <p className="font-bold text-ink text-xs truncate max-w-[220px]" title={review.image_name}>
                        {isDemo
                          ? (review.image_name || `Review #${review.id}`)
                          : <Link to={`/moderator/images/${review.id}`} className="hover:underline text-ink">{review.image_name || `Review #${review.id}`}</Link>}
                      </p>
                      <p className="text-[10px] text-ink-faint mt-0.5">
                        Review #{review.id} &middot; raised {formatDateTime(review.created_at)}
                      </p>
                    </td>
                    <td>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#F97316]/10 text-[#FB923C] border border-[#F97316]/20">
                        {sourceLabel(review.source)}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-mono text-ink-soft">
                        {review.ai_confidence === null ? '--' : `${Math.round(review.ai_confidence)}%`}
                      </span>
                    </td>
                    <td><DeadlineChip review={review} /></td>
                    <td><span className="text-xs text-ink-soft">{statusLabel(review.status)}</span></td>
                    <td>
                      {review.is_claimed && review.claimed_by ? (
                        <span className="text-[10px] text-ink-soft inline-flex items-center gap-1">
                          <Lock className="w-3 h-3 text-[#F59E0B]" />
                          {review.claimed_by.username}
                        </span>
                      ) : (
                        <span className="text-[10px] text-ink-faint">Free</span>
                      )}
                    </td>
                    <td>
                      {review.decided_at ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">
                          Decided
                        </span>
                      ) : (
                        <button
                          type="button" disabled={busy || heldByAnother(review)} onClick={() => runClaim(review)}
                          title={heldByAnother(review) ? `${review.claimed_by?.username ?? 'Another moderator'} is reviewing this. Their hold ends shortly if they do not finish.` : undefined}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#FB923C] hover:underline cursor-pointer disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
                        >
                          {heldByAnother(review)
                            ? <><Lock className="w-3.5 h-3.5" />Held</>
                            : review.is_claimed
                              ? <><Unlock className="w-3.5 h-3.5" />Release</>
                              : <><Lock className="w-3.5 h-3.5" />Claim</>}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && reviews.length === 0 && (
          <div className="text-center py-16 text-ink-faint">
            <Eye className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-xs font-semibold">Nothing in the queue.</p>
            <p className="text-[10px] text-ink-faint mt-1">
              Every uncertain result has been decided.
            </p>
          </div>
        )}
      </ChartCard>
      {bulkAsk && (
        <ConfirmDialog title={`${bulkAsk === 'approve' ? 'Approve' : 'Reject'} ${selected.size} review${selected.size === 1 ? '' : 's'}`} confirmLabel={bulkAsk === 'approve' ? 'Approve' : 'Reject'} busyLabel="Saving…"
          danger={bulkAsk === 'reject'} busy={busy} onCancel={() => setBulkAsk(null)}
          onConfirm={async () => { const a = bulkAsk; await runBulk(a, bulkMessage); setBulkAsk(null) }}>
          <p>Each member whose photo is decided is notified.</p>
          <label htmlFor="bulk-member-message" className="block text-xs font-semibold text-ink pt-1">Message to the members (optional)</label>
          <textarea id="bulk-member-message" value={bulkMessage} onChange={e => setBulkMessage(e.target.value)} rows={3} maxLength={500}
            className="w-full rounded-xl border border-line bg-surface-mute p-2 text-sm text-ink" />
          <p className="text-[11px] text-ink-faint">They see this message only. If you leave it empty each gets a standard sentence for their photo's reason.</p>
        </ConfirmDialog>
      )}
    </div>
  )
}
