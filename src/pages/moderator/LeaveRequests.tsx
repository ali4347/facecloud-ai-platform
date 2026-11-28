import { useState } from 'react'
import { AlertTriangle, LogOut, Loader2, RefreshCw } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { EmptyState } from '../../components/ui/EmptyState'
import { NeedsApi } from '../../components/ui/NeedsApi'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { decideLeaveRequest, listLeaveRequests, type LeaveRequest } from '../../lib/api/leave'
import { DENY_REASON_MIN, LEAVE_STATUS_LABEL, isNotPending, leaveSentence } from '../../lib/leave'
import { useModeratorOrganization, useModeratorResource } from '../../lib/moderationData'
import { formatDateTime } from '../../lib/utils'

const FILTERS: { value: string; label: string }[] = [
  { value: 'pending', label: 'Pending' }, { value: 'all', label: 'All' },
  { value: 'approved', label: 'Approved' }, { value: 'denied', label: 'Denied' }, { value: 'cancelled', label: 'Cancelled' },
]
const labelClass = 'text-[10px] font-bold uppercase tracking-widest text-ink-faint'
const tone: Record<string, string> = {
  pending: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/25', approved: 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/25',
  denied: 'text-[#F87171] bg-[#EF4444]/10 border-[#EF4444]/25', cancelled: 'text-ink-mute bg-surface-mute border-line',
}

/** Members of this organization asking to leave. A moderator approves (the membership is suspended) or denies with a reason; the owner reads. */
function LeaveRequestsLive() {
  const [status, setStatus] = useState('pending')
  const { organizationId, team } = useModeratorOrganization()
  const { data, loading, error, reload } = useModeratorResource((orgId, signal) => listLeaveRequests(orgId, status, signal), () => [], [status])
  const requests = data ?? []
  const readOnly = team?.role === 'owner'
  const [approving, setApproving] = useState<LeaveRequest | null>(null)
  const [denying, setDenying] = useState<LeaveRequest | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [dialogError, setDialogError] = useState('')
  const [notice, setNotice] = useState<{ text: string; bad?: boolean } | null>(null)

  const close = () => { setApproving(null); setDenying(null); setNote(''); setDialogError('') }
  const decide = async (request: LeaveRequest, action: 'approve' | 'deny') => {
    if (organizationId === null) return
    setBusy(true); setDialogError('')
    try {
      await decideLeaveRequest(organizationId, request.id, action, note)
      const who = request.member.full_name || request.member.username
      setNotice({ text: action === 'approve' ? `${who}’s organization access is suspended. Nothing was deleted.` : `The request from ${who} was denied; they can see your reason.` })
      close(); reload()
    } catch (caught) {
      const text = leaveSentence(caught, 'The decision could not be saved.')
      if (isNotPending(caught)) { setNotice({ text: 'That request was already decided or cancelled, so nothing changed. The list is refreshed.', bad: true }); close(); reload() }
      else setDialogError(text)
    } finally { setBusy(false) }
  }

  return (
    <div className="page-enter">
      <PageHeader title="Membership Leave Requests" subtitle="Members ask to leave the organization; you approve (their access is suspended) or deny with a reason." />
      {readOnly && <p className="mb-4 text-xs text-ink-mute fc-card p-3" data-testid="leave-readonly">You are the owner of this organization, so you can read these requests. A moderator decides them.</p>}
      {notice && <p role={notice.bad ? 'alert' : 'status'} className={`mb-4 text-xs rounded-2xl p-3 border ${notice.bad ? 'text-[#F87171] border-[#EF4444]/25 bg-[#EF4444]/10' : 'text-[#10B981] border-[#10B981]/25 bg-[#10B981]/10'}`}>{notice.text}</p>}
      <div className="flex flex-wrap gap-2 mb-5" role="group" aria-label="Filter by status">
        {FILTERS.map(filter => (
          <button key={filter.value} type="button" aria-pressed={status === filter.value} onClick={() => setStatus(filter.value)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${status === filter.value ? 'bg-accent/15 border-accent/30 text-accent' : 'bg-surface-mute border-line text-ink-mute hover:text-ink'}`}>
            {filter.label}
          </button>
        ))}
        <button type="button" onClick={reload} className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-ink-mute hover:text-ink cursor-pointer"><RefreshCw className="w-3.5 h-3.5" />Refresh</button>
      </div>

      {loading && <p className="py-16 text-center text-xs text-ink-faint"><Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin" />Loading requests…</p>}
      {!loading && error && (
        <div className="py-16 text-center" role="alert">
          <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-error" />
          <p className="text-xs font-semibold text-ink">{error}</p>
          <button type="button" onClick={reload} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline cursor-pointer"><RefreshCw className="w-3.5 h-3.5" />Try again</button>
        </div>
      )}
      {!loading && !error && requests.length === 0 && (
        <div className="fc-card"><EmptyState icon={LogOut} title={status === 'pending' ? 'Nothing to decide' : 'No requests here'} description="A request appears here when a member of this organization asks to leave." /></div>
      )}
      {!loading && !error && requests.length > 0 && (
        <div className="fc-card overflow-x-auto">
          <table className="w-full fc-table text-left">
            <thead><tr><th>Member</th><th>Email</th><th>Organization</th><th>Requested</th><th>Reason</th><th>Status</th>{!readOnly && <th>Actions</th>}</tr></thead>
            <tbody>
              {requests.map(request => (
                <tr key={request.id} data-testid={`leave-row-${request.id}`}>
                  <td className="text-sm font-semibold text-ink">{request.member.full_name || request.member.username}<span className="block text-[10px] font-normal text-ink-faint">@{request.member.username}</span></td>
                  <td className="text-xs text-ink-soft break-all">{request.member.email}</td>
                  <td className="text-xs text-ink-soft">{request.organization_name}</td>
                  <td className="text-xs text-ink-soft whitespace-nowrap">{formatDateTime(request.submitted_at)}</td>
                  <td className="text-xs text-ink-mute max-w-[16rem]">{request.reason ? `“${request.reason}”` : '—'}</td>
                  <td>
                    <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-bold ${tone[request.status]}`}>{LEAVE_STATUS_LABEL[request.status]}</span>
                    {request.status !== 'pending' && request.decision_reason && <span className="block text-[10px] text-ink-faint mt-1">“{request.decision_reason}”</span>}
                    {request.admin_override && <span className="block text-[10px] text-ink-faint mt-1">Decided by the administrator</span>}
                  </td>
                  {!readOnly && (
                    <td>
                      {request.status === 'pending' ? (
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => { setNote(''); setDialogError(''); setApproving(request) }} className="fc-btn-primary text-[11px] py-1.5 px-3">Approve &amp; Suspend Access</button>
                          <button type="button" onClick={() => { setNote(''); setDialogError(''); setDenying(request) }} className="fc-btn-secondary text-[11px] py-1.5 px-3">Deny Request</button>
                        </div>
                      ) : <span className="text-[10px] text-ink-faint">—</span>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {approving && (
        <ConfirmDialog title="Approve and suspend access?" confirmLabel="Approve & Suspend Access" busyLabel="Saving…" busy={busy} error={dialogError} danger
          onCancel={close} onConfirm={() => void decide(approving, 'approve')}>
          <p>{approving.member.full_name || approving.member.username} ({approving.member.email}) will lose access to {approving.organization_name}.</p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>Their membership is suspended; their FaceCloud account and personal workspace are not affected.</li>
            <li>Nothing is deleted: the organization keeps its files and records.</li>
            <li>Their waiting download requests are cancelled and their live download approvals end.</li>
            <li>The seat is released.</li>
          </ul>
          <label htmlFor="approve-note" className={`${labelClass} block pt-1`}>Note (optional)</label>
          <input id="approve-note" className="fc-input w-full" value={note} onChange={e => setNote(e.target.value)} maxLength={500} />
        </ConfirmDialog>
      )}
      {denying && (
        <ConfirmDialog title="Deny this request?" confirmLabel="Deny Request" busyLabel="Saving…" busy={busy} error={dialogError}
          confirmDisabled={note.trim().length < DENY_REASON_MIN} onCancel={close} onConfirm={() => void decide(denying, 'deny')}>
          <p>{denying.member.full_name || denying.member.username} stays a member and sees your reason.</p>
          <label htmlFor="deny-reason" className={`${labelClass} block pt-1`}>Reason (required)</label>
          <textarea id="deny-reason" className="fc-input w-full" rows={3} value={note} onChange={e => setNote(e.target.value)} maxLength={500} />
          {note.trim().length > 0 && note.trim().length < DENY_REASON_MIN && <p className="text-[10px] text-error">Write at least {DENY_REASON_MIN} characters.</p>}
        </ConfirmDialog>
      )}
    </div>
  )
}

export default function LeaveRequests() {
  return <NeedsApi title="Membership Leave Requests" icon={LogOut}><LeaveRequestsLive /></NeedsApi>
}
