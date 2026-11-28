import { useCallback, useEffect, useState } from 'react'
import { CheckCircle, Clock, Loader2, LogOut, XCircle } from 'lucide-react'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { ApiError } from '../../lib/api/client'
import { cancelLeaveRequest, getMyLeaveRequest, requestToLeave, type LeaveRequest } from '../../lib/api/leave'
import { LEAVE_REASON_MAX, isNotPending, leaveSentence } from '../../lib/leave'
import { formatDateTime } from '../../lib/utils'

const labelClass = 'text-[10px] font-bold uppercase tracking-widest text-ink-faint'

/**
 * "Request to Leave Organization", for a plain member of a shared organization. A member never leaves on their own: the request goes to the
 * organization's moderator, access stays until it is approved, and an approval suspends the organization access (nothing stored is deleted and the
 * personal workspace is not touched). Shown only to members: the caller decides that (owner, moderator and personal workspace never render this).
 */
export function LeaveRequestCard({ organizationId, organizationName, onAccessEnded }: { organizationId: number; organizationName: string; onAccessEnded?: () => void }) {
  const [request, setRequest] = useState<LeaveRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [asking, setAsking] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [dialogError, setDialogError] = useState('')

  const refresh = useCallback(async () => {
    try { setRequest(await getMyLeaveRequest(organizationId)); setError('') }
    catch (caught) {
      // A 404 means the membership is no longer active (an approval just went through): the page explains that instead.
      if (caught instanceof ApiError && caught.status === 404) onAccessEnded?.()
      else setError(leaveSentence(caught, 'Could not load your leave request.'))
    } finally { setLoading(false) }
  }, [organizationId, onAccessEnded])
  useEffect(() => { void refresh() }, [refresh])

  const submit = async () => {
    setBusy(true); setDialogError('')
    try { setRequest(await requestToLeave(organizationId, reason)); setAsking(false); setReason(''); setNotice(''); setError('') }
    catch (caught) {
      setDialogError(leaveSentence(caught, 'Your request could not be sent.'))
      if (caught instanceof ApiError && caught.status === 409) void refresh()          // already pending: show the pending request behind the dialog
    } finally { setBusy(false) }
  }

  const cancel = async () => {
    setBusy(true); setError(''); setNotice('')
    try { setRequest(await cancelLeaveRequest(organizationId)); setNotice('Your request was cancelled. You are still a member.') }
    catch (caught) {
      if (isNotPending(caught)) { setNotice('The moderator had already decided this request, so it could not be cancelled. Here is where it stands now.'); await refresh() }
      else setError(leaveSentence(caught, 'Your request could not be cancelled.'))
    } finally { setBusy(false) }
  }

  if (loading) return <div className="fc-card p-5 text-xs text-ink-faint flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Checking your leave request…</div>
  const pending = request?.status === 'pending'

  return (
    <section className="fc-card p-5 space-y-3" aria-label="Leaving this organization" data-testid="leave-card">
      <div className="flex items-start gap-3">
        <LogOut className="w-5 h-5 text-accent mt-0.5" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-ink">Leaving this organization</h2>
          <p className="text-xs text-ink-mute mt-0.5">Your moderator decides. Until they approve, you keep your access.</p>
        </div>
      </div>

      {error && <p role="alert" className="text-xs text-error">{error}</p>}
      {notice && <p role="status" className="text-xs text-ink-soft">{notice}</p>}

      {pending && request && (
        <div className="rounded-2xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-4 space-y-2" data-testid="leave-pending">
          <p className="text-sm font-semibold text-[#F59E0B] flex items-center gap-2"><Clock className="w-4 h-4" />Leave Request Pending Moderator Approval</p>
          <p className="text-xs text-ink-soft">Sent {formatDateTime(request.submitted_at)}. You are still a member of {organizationName} until a moderator approves.</p>
          {request.reason && <p className="text-xs text-ink-mute">Your reason: “{request.reason}”</p>}
          <button type="button" onClick={() => void cancel()} disabled={busy} className="fc-btn-secondary text-xs py-2 px-4 disabled:opacity-60">{busy ? 'Cancelling…' : 'Cancel request'}</button>
        </div>
      )}

      {!pending && request?.status === 'denied' && (
        <div className="rounded-2xl border border-[#EF4444]/25 bg-[#EF4444]/10 p-4 space-y-1" data-testid="leave-denied">
          <p className="text-sm font-semibold text-[#F87171] flex items-center gap-2"><XCircle className="w-4 h-4" />Your last request was denied</p>
          <p className="text-xs text-ink-soft">{request.decided_at ? `Decided ${formatDateTime(request.decided_at)}. ` : ''}You are still a member.</p>
          {request.decision_reason && <p className="text-xs text-ink-mute">Moderator’s reason: “{request.decision_reason}”</p>}
        </div>
      )}

      {!pending && request?.status === 'approved' && (
        <div className="rounded-2xl border border-[#10B981]/25 bg-[#10B981]/10 p-4 space-y-1" data-testid="leave-approved">
          <p className="text-sm font-semibold text-[#10B981] flex items-center gap-2"><CheckCircle className="w-4 h-4" />Your request was approved</p>
          <p className="text-xs text-ink-soft">Your access to {organizationName} is suspended. Your personal workspace is not affected.</p>
        </div>
      )}

      {!pending && (
        <button type="button" onClick={() => { setDialogError(''); setAsking(true) }} className="fc-btn-secondary text-xs py-2 px-4">
          Request to Leave Organization
        </button>
      )}

      {asking && (
        <ConfirmDialog title="Request to leave this organization?" confirmLabel="Send request" busyLabel="Sending…" busy={busy} error={dialogError}
          confirmDisabled={reason.length > LEAVE_REASON_MAX} onCancel={() => setAsking(false)} onConfirm={() => void submit()}>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>Your request goes to the organization’s moderator.</li>
            <li>You keep your access until the moderator approves it.</li>
            <li>Approval suspends your access to this organization.</li>
            <li>The organization’s files and records stay stored securely.</li>
            <li>Your personal FaceCloud workspace is not affected.</li>
          </ul>
          <label htmlFor="leave-reason" className={`${labelClass} block pt-1`}>Reason (optional)</label>
          <textarea id="leave-reason" value={reason} onChange={e => setReason(e.target.value)} rows={3} maxLength={LEAVE_REASON_MAX + 50}
            className="fc-input w-full" placeholder="For example: I moved to another team" />
          <p className={`text-[10px] ${reason.length > LEAVE_REASON_MAX ? 'text-error' : 'text-ink-faint'}`}>{reason.length} / {LEAVE_REASON_MAX}</p>
        </ConfirmDialog>
      )}
    </section>
  )
}
