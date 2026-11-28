import { useCallback, useEffect, useState } from 'react'
import { CheckCircle, Loader2, Mail, RefreshCw, Send, XCircle } from 'lucide-react'
import { GradientButton } from '../ui/GradientButton'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import {
  cancelOwnerInvitation, getOwnerInvitation, resendOwnerInvitation, type OwnerInvitation,
} from '../../lib/api/adminOrganizations'
import { ApiError } from '../../lib/api/client'
import { messageFor } from '../../lib/useApiResource'
import { formatDateTime } from '../../lib/utils'

const INVITATION_STATUS_LABEL: Record<OwnerInvitation['status'], string> = {
  pending: 'Waiting for the owner to accept', accepted: 'Accepted', cancelled: 'Cancelled', expired: 'Expired', rejected: 'Rejected',
}

const EMAIL_STATUS_LABEL: Record<string, string> = {
  queued: 'About to be sent', sent: 'Sent (the mail server accepted it)', failed: 'Could not be sent', '': 'Not recorded',
}

const TONE: Record<OwnerInvitation['status'], string> = {
  pending: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/25',
  accepted: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/25',
  cancelled: 'bg-surface-mute text-ink-mute border-line',
  expired: 'bg-surface-mute text-ink-mute border-line',
  rejected: 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/25',
}

export function InvitationStatusChip({ status }: { status: OwnerInvitation['status'] }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${TONE[status]}`}>
      {status === 'pending' ? 'Pending' : INVITATION_STATUS_LABEL[status]}
    </span>
  )
}

/** What the API's refusals mean for these two buttons. */
function actionError(caught: unknown): string {
  if (caught instanceof ApiError && caught.status === 409) return 'The owner has already accepted, or the invitation is no longer pending. The status below is the current one.'
  if (caught instanceof ApiError && caught.status === 403) return 'The organization is suspended: reactivate it before inviting its owner again.'
  return messageFor(caught)
}

/**
 * The owner invitation of an organization the administrator created from an e-mail address: where it stands, whether the
 * e-mail went out, and Resend / Cancel. The link itself is never shown: the API never returns it.
 */
export function OwnerInvitationPanel({ organizationId, organizationName, initial, onChanged }: {
  organizationId: number
  organizationName: string
  /** The copy the list already has, shown while the current one loads. */
  initial?: OwnerInvitation | null
  /** Told after a resend or cancel, so the list can be read again. */
  onChanged?: () => void
}) {
  const [invitation, setInvitation] = useState<OwnerInvitation | null>(initial ?? null)
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)
  /* Kept apart: a reload after a refused action must not wipe the sentence that explains the refusal. */
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState<'' | 'resend' | 'cancel'>('')
  const [confirm, setConfirm] = useState<'' | 'resend' | 'cancel'>('')

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setLoadError('')
    try {
      setInvitation(await getOwnerInvitation(organizationId, signal)); setMissing(false)
    } catch (caught) {
      if (signal?.aborted) return
      if (caught instanceof ApiError && caught.status === 404) setMissing(true)
      else setLoadError(messageFor(caught))
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  const act = async (which: 'resend' | 'cancel') => {
    setBusy(which); setError(''); setNotice('')
    try {
      const next = which === 'resend' ? await resendOwnerInvitation(organizationId) : await cancelOwnerInvitation(organizationId)
      setInvitation(next)
      setNotice(which === 'resend'
        ? `A new invitation was sent to ${next.email}. The previous link no longer works.`
        : 'The invitation was cancelled. The organization keeps waiting for its owner; Resend invites them again.')
      setConfirm('')
      onChanged?.()
    } catch (caught) {
      setError(actionError(caught))
      setConfirm('')
      void load()
    } finally {
      setBusy('')
    }
  }

  if (missing) {
    return <p className="text-xs text-ink-mute">{organizationName} was not created from an owner e-mail address, so it has no owner invitation.</p>
  }
  if (!invitation) {
    return loadError
      ? <p role="alert" className="text-xs text-[#F87171]">{loadError}</p>
      : <p className="text-xs text-ink-faint flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" />Loading the invitation…</p>
  }

  const pending = invitation.status === 'pending'
  return (
    <div className="space-y-3 text-xs">
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
        <div><dt className="text-ink-faint">Owner e-mail</dt><dd className="font-semibold text-ink break-all flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-ink-faint" />{invitation.email}</dd></div>
        <div><dt className="text-ink-faint">Invitation</dt><dd className="flex items-center gap-2 pt-0.5"><InvitationStatusChip status={invitation.status} /></dd></div>
        <div><dt className="text-ink-faint">E-mail</dt><dd className={`font-semibold ${invitation.email_status === 'failed' ? 'text-[#F87171]' : 'text-ink'}`}>
          {EMAIL_STATUS_LABEL[invitation.email_status] ?? invitation.email_status}{invitation.email_sent_at ? ` · ${formatDateTime(invitation.email_sent_at)}` : ''}</dd></div>
        <div><dt className="text-ink-faint">{invitation.status === 'expired' ? 'Expired' : 'Open until'}</dt><dd className="font-semibold text-ink">{formatDateTime(invitation.expires_at)}</dd></div>
        {invitation.email_failure_reason && (
          <div className="sm:col-span-2"><dt className="text-ink-faint">Why it was not sent</dt><dd className="text-[#F87171]">{invitation.email_failure_reason}</dd></div>
        )}
        {invitation.accepted_by && (
          <div className="sm:col-span-2"><dt className="text-ink-faint">Owner</dt><dd className="font-semibold text-[#10B981] flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" />
            Owner accepted by {invitation.accepted_by.username}{invitation.accepted_at ? ` on ${formatDateTime(invitation.accepted_at)}` : ''}</dd></div>
        )}
      </dl>
      <p className="text-[10px] text-ink-faint">“Sent” means the mail server accepted the message; whether it reached the inbox cannot be known. The link is never shown here.</p>

      {notice && <p role="status" className="p-2.5 rounded-xl bg-[#10B981]/10 border border-[#10B981]/25 text-[#10B981]">{notice}</p>}
      {(error || loadError) && <p role="alert" className="p-2.5 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/25 text-[#F87171]">{error || loadError}</p>}

      <div className="flex flex-wrap gap-2">
        {invitation.can_resend && (
          <GradientButton size="sm" disabled={busy !== ''} onClick={() => setConfirm('resend')}
            leftIcon={busy === 'resend' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}>Resend invitation</GradientButton>
        )}
        {pending && (
          <GradientButton size="sm" variant="danger" disabled={busy !== ''} onClick={() => setConfirm('cancel')}
            leftIcon={<XCircle className="w-3.5 h-3.5" />}>Cancel invitation</GradientButton>
        )}
        <GradientButton size="sm" variant="secondary" disabled={loading || busy !== ''} onClick={() => void load()}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}>Refresh</GradientButton>
      </div>

      {confirm === 'resend' && (
        <ConfirmDialog title="Send a new invitation?" confirmLabel="Resend invitation" busyLabel="Sending…" busy={busy === 'resend'}
          onConfirm={() => void act('resend')} onCancel={() => setConfirm('')}>
          <p>{invitation.email} gets a new link to become the owner of {organizationName}. The link sent before stops working.</p>
        </ConfirmDialog>
      )}
      {confirm === 'cancel' && (
        <ConfirmDialog title="Cancel the invitation?" confirmLabel="Cancel invitation" busyLabel="Cancelling…" busy={busy === 'cancel'} danger
          onConfirm={() => void act('cancel')} onCancel={() => setConfirm('')}>
          <p>The link sent to {invitation.email} stops working. {organizationName} keeps waiting for its owner; you can resend an invitation later.</p>
        </ConfirmDialog>
      )}
    </div>
  )
}
