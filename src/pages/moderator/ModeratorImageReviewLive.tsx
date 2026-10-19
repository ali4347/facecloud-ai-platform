import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Check, GitMerge, Loader2, ShieldAlert, Unlock, UserCheck, Lock, X } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { AuthedImage } from '../../components/ui/AuthedImage'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { ModeratorGate } from '../../components/moderator/ModeratorGate'
import {
  assignReview, claimReview, decideReview, deadlineState, escalateReview, getReview, getReviewImage, mergeDuplicateFolders, releaseReview, sourceLabel, statusLabel,
  type ModeratorReview,
} from '../../lib/api/moderation'
import { listOrgAudit, type OrgAuditEvent, type ReviewImageInfo } from '../../lib/api/moderatorConsole'
import { listOrgMembers, type OrgMembership } from '../../lib/api/organizations'
import { formatBytes } from '../../lib/imageData'
import { useModeratorOrganization, useModeratorResource } from '../../lib/moderationData'
import { explainReason } from '../../lib/reasons'
import { messageFor } from '../../lib/useApiResource'
import { formatDateTime } from '../../lib/utils'

type ReviewDetail = ModeratorReview & { image?: ReviewImageInfo | null }
type Action = 'approve' | 'reject' | 'keep_in_review' | 'escalate'

const DEADLINE: Record<string, { label: string; tone: 'error' | 'warning' | 'success' | 'muted' }> = {
  overdue: { label: 'Overdue', tone: 'error' }, 'due-soon': { label: 'Due soon', tone: 'warning' }, 'on-track': { label: 'On track', tone: 'success' },
  met: { label: 'Deadline met', tone: 'success' }, missed: { label: 'Deadline missed', tone: 'error' }, none: { label: 'No deadline', tone: 'muted' },
}

const DIALOG: Record<Action, { title: string; confirm: string; noun: string; required: boolean }> = {
  approve: { title: 'Approve this photo', confirm: 'Approve', noun: 'Internal note (optional, the member does not see it)', required: false },
  reject: { title: 'Reject this photo', confirm: 'Reject', noun: 'Reason for the record (required, the member does not see it)', required: true },
  keep_in_review: { title: 'Keep in review', confirm: 'Keep in review', noun: 'Note (optional)', required: false },
  escalate: { title: 'Escalate to an administrator', confirm: 'Escalate', noun: 'What should the administrator look at? (optional)', required: false },
}

export function LiveImageReview() {
  const { id } = useParams<{ id: string }>()
  const reviewId = Number(id)
  const { organizationId } = useModeratorOrganization()
  const state = useModeratorResource<ReviewDetail>(org => getReview(org, reviewId), () => ({}) as ReviewDetail, [reviewId])
  const [history, setHistory] = useState<OrgAuditEvent[] | null>(null)
  const [action, setAction] = useState<Action | null>(null)
  const [text, setText] = useState('')
  const [memberMessage, setMemberMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ text: string; bad?: boolean } | null>(null)
  // Handing the review to another moderator, and merging the person folders behind a duplicate match.
  const [assigning, setAssigning] = useState(false)
  const [people, setPeople] = useState<OrgMembership[] | null>(null)
  const [assignee, setAssignee] = useState('')
  const [merging, setMerging] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)

  const reload = state.reload
  useEffect(() => {
    if (organizationId === null || !Number.isFinite(reviewId)) return
    const controller = new AbortController()
    listOrgAudit(organizationId, { target_type: 'ModeratorReview', target_id: reviewId }, controller.signal)
      .then(rows => { if (!controller.signal.aborted) setHistory(rows) })
      .catch(() => { if (!controller.signal.aborted) setHistory([]) })
    return () => controller.abort()
  }, [organizationId, reviewId, state.data])

  const run = async (work: () => Promise<unknown>, done: string) => {
    setBusy(true); setNotice(null)
    try { await work(); setNotice({ text: done }); reload() } catch (caught) { setNotice({ text: messageFor(caught), bad: true }) } finally { setBusy(false) }
  }

  const openAssign = (current: number | null) => {
    setAssigning(true); setDialogError(null); setAssignee(current === null ? '' : String(current))
    if (people === null && organizationId !== null) {
      listOrgMembers(organizationId)
        .then(rows => setPeople(rows.filter(row => row.status === 'active' && (row.role === 'moderator' || row.role === 'owner'))))
        .catch(caught => { setPeople([]); setDialogError(messageFor(caught)) })
    }
  }

  const confirmAssign = async () => {
    if (organizationId === null || !assignee) return
    setBusy(true); setDialogError(null)
    try {
      await assignReview(organizationId, reviewId, Number(assignee))
      setAssigning(false); setNotice({ text: 'Assigned.' }); reload()
    } catch (caught) { setDialogError(messageFor(caught)) } finally { setBusy(false) }
  }

  const confirmMerge = async () => {
    if (organizationId === null) return
    setBusy(true); setDialogError(null)
    try {
      const done = await mergeDuplicateFolders(organizationId, reviewId, text.trim())
      setMerging(false); setText(''); setNotice({ text: `Merged “${done.source.display_name}” into “${done.target.display_name}”.` }); reload()
    } catch (caught) { setDialogError(messageFor(caught)) } finally { setBusy(false) }
  }

  const submit = async () => {
    if (!action || organizationId === null) return
    setBusy(true); setFormError(null)
    try {
      if (action === 'escalate') await escalateReview(organizationId, reviewId, text.trim())
      else await decideReview(organizationId, reviewId, { action, reason: text.trim(), ...(memberMessage.trim() ? { message_to_member: memberMessage.trim() } : {}) })
      setNotice({ text: action === 'escalate' ? 'Escalated.' : action === 'keep_in_review' ? 'Kept in review.' : `${action === 'approve' ? 'Approved' : 'Rejected'}.` })
      setAction(null); setText(''); setMemberMessage(''); reload()
    } catch (caught) { setFormError(messageFor(caught)) } finally { setBusy(false) }
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Link to="/moderator/queue" aria-label="Back to the queue" className="p-2 rounded-xl hover:bg-surface-mute border border-line text-ink-mute hover:text-ink"><ArrowLeft className="w-4 h-4" /></Link>
        <PageHeader title="Review" subtitle={state.data?.image_name ? `Decide on ${state.data.image_name}` : `Review #${reviewId}`} />
      </div>

      {notice && (
        <div role="status" className={`p-3 rounded-2xl text-xs border ${notice.bad ? 'bg-[#EF4444]/10 border-[#EF4444]/25 text-[#F87171]' : 'bg-[#10B981]/10 border-[#10B981]/25 text-[#10B981]'}`}>{notice.text}</div>
      )}

      <ModeratorGate state={state} what="the review">
        {review => {
          const open = !review.decided_at && ['pending', 'in_review', 'escalated'].includes(review.status)
          const deadline = DEADLINE[deadlineState(review)]
          const image = review.image
          return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 space-y-6">
                <ChartCard title="The photo" subtitle="As submitted to your organization">
                  <div className="flex justify-center rounded-3xl bg-surface-mute border border-line p-3">
                    <AuthedImage load={organizationId === null ? null : signal => getReviewImage(organizationId, reviewId, 1024, signal)} cacheKey={`review-${reviewId}`} alt={review.image_name}
                      className="max-h-[420px] w-auto object-contain" rounded="rounded-2xl" />
                  </div>
                </ChartCard>

                {image && (
                  <ChartCard title="Measurements" subtitle="From the quality check">
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                      <div><dt className="text-ink-faint">Uploaded by</dt><dd className="font-semibold text-ink">{image.uploader.username}</dd></div>
                      <div><dt className="text-ink-faint">Size</dt><dd className="font-semibold text-ink">{formatBytes(image.file_size)}{image.width && image.height ? ` · ${image.width} × ${image.height}` : ''}</dd></div>
                      <div><dt className="text-ink-faint">Faces found</dt><dd className="font-semibold text-ink">{image.face_count}</dd></div>
                      <div><dt className="text-ink-faint">Quality score</dt><dd className="font-semibold text-ink">{image.quality.overall_score === null ? '—' : Math.round(image.quality.overall_score)}</dd></div>
                      <div><dt className="text-ink-faint">Quality verdict</dt><dd className="font-semibold text-ink capitalize">{(image.quality.decision ?? 'not decided').replace('_', ' ')}</dd></div>
                    </dl>
                    {(image.quality.rejection_reasons.length > 0 || image.quality.warnings.length > 0) && (
                      <ul className="mt-4 space-y-1.5 text-xs">
                        {[...image.quality.rejection_reasons, ...image.quality.warnings].map(code => (
                          <li key={code} className="p-2 rounded-xl bg-surface-mute border border-line">
                            <span className="font-semibold text-ink">{explainReason(code).title}</span>
                            {explainReason(code).hint && <span className="text-ink-mute"> — {explainReason(code).hint}</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </ChartCard>
                )}
              </div>

              <div className="lg:col-span-6 space-y-6">
                <ChartCard title="Review" subtitle={sourceLabel(review.source)}>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <StatusBadge status={review.status === 'approved' ? 'success' : review.status === 'rejected' ? 'error' : review.status === 'escalated' ? 'purple' : 'warning'} label={statusLabel(review.status)} dot={false} />
                    <StatusBadge status={deadline.tone} label={deadline.label} dot={false} />
                    {review.is_claimed && <StatusBadge status="info" label={`Held by ${review.claimed_by?.username ?? 'a moderator'}`} dot={false} />}
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                    <div><dt className="text-ink-faint">Raised because</dt><dd className="font-semibold text-ink">{explainReason(review.ai_recommendation).title}</dd></div>
                    <div><dt className="text-ink-faint">Confidence</dt><dd className="font-semibold text-ink">{review.ai_confidence === null ? '—' : `${Math.round(review.ai_confidence)}%`}</dd></div>
                    <div><dt className="text-ink-faint">Due</dt><dd className="font-semibold text-ink">{review.due_at ? formatDateTime(review.due_at) : '—'}</dd></div>
                    <div><dt className="text-ink-faint">Assigned to</dt><dd className="font-semibold text-ink">{review.assigned_moderator?.username ?? 'Nobody'}</dd></div>
                    {review.decided_at && <div className="col-span-2"><dt className="text-ink-faint">Decision</dt><dd className="font-semibold text-ink">{statusLabel(review.status)} by {review.decided_by?.username ?? 'a moderator'}, {formatDateTime(review.decided_at)}{review.decision_reason ? ` — ${review.decision_reason}` : ''}</dd></div>}
                    {review.decided_at && review.message_to_member && <div className="col-span-2"><dt className="text-ink-faint">Message the member received</dt><dd className="text-ink">“{review.message_to_member}”</dd></div>}
                  </dl>

                  {open ? (
                    <div className="mt-5 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" disabled={busy} onClick={() => organizationId !== null && run(() => (review.is_claimed ? releaseReview(organizationId, reviewId) : claimReview(organizationId, reviewId)), review.is_claimed ? 'Released to the queue.' : 'You took this review.')}
                          className="fc-btn-secondary !py-2 !px-3 text-[11px] font-bold disabled:opacity-50">{review.is_claimed ? <><Unlock className="w-3.5 h-3.5" /> Release</> : <><Lock className="w-3.5 h-3.5" /> Take it</>}</button>
                        <button type="button" disabled={busy} onClick={() => { setText(''); setMemberMessage(''); setFormError(null); setAction('approve') }} className="fc-btn-primary !py-2 !px-3 text-[11px] font-bold"><Check className="w-3.5 h-3.5" /> Approve</button>
                        <button type="button" disabled={busy} onClick={() => { setText(''); setMemberMessage(''); setFormError(null); setAction('reject') }} className="fc-btn-secondary !py-2 !px-3 text-[11px] font-bold !text-red-400"><X className="w-3.5 h-3.5" /> Reject</button>
                        <button type="button" disabled={busy} onClick={() => { setText(''); setMemberMessage(''); setFormError(null); setAction('keep_in_review') }} className="fc-btn-secondary !py-2 !px-3 text-[11px] font-bold">Keep in review</button>
                        <button type="button" disabled={busy} onClick={() => { setText(''); setMemberMessage(''); setFormError(null); setAction('escalate') }} className="fc-btn-secondary !py-2 !px-3 text-[11px] font-bold"><ShieldAlert className="w-3.5 h-3.5" /> Escalate</button>
                        <button type="button" disabled={busy} onClick={() => openAssign(review.assigned_moderator?.id ?? null)} className="fc-btn-secondary !py-2 !px-3 text-[11px] font-bold"><UserCheck className="w-3.5 h-3.5" /> Assign to…</button>
                        {review.source === 'duplicate' && (
                          <button type="button" disabled={busy} onClick={() => { setText(''); setDialogError(null); setMerging(true) }} className="fc-btn-secondary !py-2 !px-3 text-[11px] font-bold"><GitMerge className="w-3.5 h-3.5" /> Merge their folders</button>
                        )}
                      </div>
                      <p className="text-[10px] text-ink-faint">A review someone else holds cannot be decided; the message says who.</p>
                    </div>
                  ) : (
                    <p className="mt-4 text-xs text-ink-mute">This review is closed.</p>
                  )}
                </ChartCard>

                <ChartCard title="History" subtitle="Everything done on this review">
                  {history === null && <div className="py-6 text-center"><Loader2 className="w-5 h-5 mx-auto animate-spin text-ink-faint" /></div>}
                  {history && history.length === 0 && <p className="text-xs text-ink-faint py-4">Nothing has been done on this review yet.</p>}
                  {history && history.length > 0 && (
                    <ul className="space-y-3">
                      {history.map(event => (
                        <li key={event.id} className="flex gap-3 text-xs">
                          <div className="w-1.5 mt-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-ink"><span className="font-semibold">{event.actor_name}</span> {event.message.charAt(0).toLowerCase() + event.message.slice(1)}</p>
                            {(event.from_status || event.to_status) && <p className="text-ink-faint">{event.from_status ?? '—'} → {event.to_status ?? '—'}</p>}
                            {event.reason && <p className="text-ink-mute">“{event.reason}”</p>}
                            <p className="text-[10px] font-mono text-ink-faint">{formatDateTime(event.created_at)}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </ChartCard>
              </div>
            </div>
          )
        }}
      </ModeratorGate>

      {assigning && (
        <ConfirmDialog title="Assign this review" confirmLabel="Assign" busyLabel="Assigning…" busy={busy} error={dialogError}
          confirmDisabled={!assignee || people === null} onCancel={() => setAssigning(false)} onConfirm={confirmAssign}>
          <label htmlFor="review-assignee" className="block text-xs font-semibold text-ink">Who should handle it?</label>
          {people === null ? (
            <p className="text-xs text-ink-mute flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Loading the team…</p>
          ) : people.length === 0 ? (
            <p className="text-xs text-ink-mute">No other moderator is available to take it.</p>
          ) : (
            <select id="review-assignee" value={assignee} onChange={e => setAssignee(e.target.value)} className="w-full rounded-xl border border-line bg-surface-mute p-2 text-sm text-ink">
              <option value="">Choose a person</option>
              {people.map(row => <option key={row.id} value={row.user.id}>{row.user.username} ({row.role})</option>)}
            </select>
          )}
          <p className="text-[11px] text-ink-faint">They are told it was assigned to them.</p>
        </ConfirmDialog>
      )}

      {merging && (
        <ConfirmDialog title="Merge the two person folders" confirmLabel="Merge folders" busyLabel="Merging…" busy={busy} error={dialogError}
          onCancel={() => setMerging(false)} onConfirm={confirmMerge}>
          <p className="text-xs text-ink">This photo was flagged as a duplicate of one in another person folder. Merging puts both folders' photos into one folder; nothing is deleted.</p>
          <label htmlFor="merge-reason" className="block text-xs font-semibold text-ink pt-2">Why? (optional)</label>
          <textarea id="merge-reason" value={text} onChange={e => setText(e.target.value)} rows={2} maxLength={500} className="w-full rounded-xl border border-line bg-surface-mute p-2 text-sm text-ink" />
          <p className="text-[11px] text-ink-faint">If a side has more than one folder, the server says so; use Identity Review to choose which folders to merge.</p>
        </ConfirmDialog>
      )}

      {action && (
        <ConfirmDialog title={DIALOG[action].title} confirmLabel={DIALOG[action].confirm} busyLabel="Saving…" busy={busy} error={formError}
          danger={action === 'reject'} confirmDisabled={DIALOG[action].required && text.trim().length === 0} onCancel={() => setAction(null)} onConfirm={submit}>
          <label htmlFor="review-note" className="block text-xs font-semibold text-ink">{DIALOG[action].noun}</label>
          <textarea id="review-note" value={text} onChange={e => setText(e.target.value)} rows={2} maxLength={500} className="w-full rounded-xl border border-line bg-surface-mute p-2 text-sm text-ink" />
          {(action === 'approve' || action === 'reject') && (
            <>
              <label htmlFor="review-member-message" className="block text-xs font-semibold text-ink pt-2">Message to the member (optional)</label>
              <textarea id="review-member-message" value={memberMessage} onChange={e => setMemberMessage(e.target.value)} rows={2} maxLength={500}
                placeholder={action === 'reject' ? 'e.g. The face is too small. Please send a closer photo.' : 'e.g. Looks good, thank you.'}
                className="w-full rounded-xl border border-line bg-surface-mute p-2 text-sm text-ink" />
              <p className="text-[11px] text-ink-faint">The member is notified of this decision. They see this message only; if you leave it empty they get a standard sentence for the reason.</p>
            </>
          )}
        </ConfirmDialog>
      )}
    </div>
  )
}
