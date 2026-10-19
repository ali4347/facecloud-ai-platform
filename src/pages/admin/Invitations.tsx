import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Send } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { GradientButton } from '../../components/ui/GradientButton'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { AsyncGate } from '../../components/admin/AsyncGate'
import { USE_API } from '../../lib/api/config'
import {
  cancelAccountInvitation, inviteAccount, listAccountInvitations, resendAccountInvitation,
  type AccountInvitation, type InvitationStatus,
} from '../../lib/api/adminOperations'
import { teamsOf, useAdminOrganizations } from '../../lib/useAdminOrganizations'
import { messageFor, useApiResource } from '../../lib/useApiResource'
import { formatDateTime } from '../../lib/utils'

const labelClass = 'text-[10px] font-bold uppercase tracking-widest text-ink-faint'
const FILTERS: { value: InvitationStatus | ''; label: string }[] = [
  { value: '', label: 'All' }, { value: 'pending', label: 'Waiting' }, { value: 'accepted', label: 'Accepted' },
  { value: 'expired', label: 'Expired' }, { value: 'cancelled', label: 'Cancelled' },
]
const TONE: Record<InvitationStatus, 'warning' | 'success' | 'error' | 'info'> = { pending: 'warning', accepted: 'success', expired: 'error', cancelled: 'info' }
const WORDS: Record<InvitationStatus, string> = { pending: 'Waiting', accepted: 'Accepted', expired: 'Expired', cancelled: 'Cancelled' }

export default function InvitationsPage() {
  const [filter, setFilter] = useState<InvitationStatus | ''>('')
  const state = useApiResource(signal => listAccountInvitations(filter, signal), () => [] as AccountInvitation[], [filter])
  const orgs = useAdminOrganizations()
  const teams = teamsOf(orgs.data)

  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'user' | 'moderator'>('user')
  const [organizationId, setOrganizationId] = useState<number | ''>('')
  const [sending, setSending] = useState(false)
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState<{ text: string; bad?: boolean } | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [toCancel, setToCancel] = useState<AccountInvitation | null>(null)
  const [cancelError, setCancelError] = useState<string | null>(null)

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(''); setNotice(null)
    if (!USE_API) { setFormError('Invitations are not sent in the demo build.'); return }
    if (role === 'moderator' && organizationId === '') { setFormError('Choose the organization this moderator will work for.'); return }
    setSending(true)
    try {
      await inviteAccount({ email: email.trim(), role, ...(role === 'moderator' && organizationId !== '' ? { organization_id: organizationId } : {}) })
      setNotice({ text: `Invitation sent to ${email.trim()}. The link is valid for a limited time.` })
      setEmail(''); state.reload()
    } catch (caught) { setFormError(messageFor(caught)) } finally { setSending(false) }
  }

  const resend = async (row: AccountInvitation) => {
    setBusyId(row.id); setNotice(null)
    try { await resendAccountInvitation(row.id); setNotice({ text: `A fresh link was sent to ${row.email}.` }); state.reload() }
    catch (caught) { setNotice({ text: messageFor(caught), bad: true }) } finally { setBusyId(null) }
  }

  const confirmCancel = async () => {
    if (!toCancel) return
    setBusyId(toCancel.id); setCancelError(null)
    try { await cancelAccountInvitation(toCancel.id); setNotice({ text: `The invitation to ${toCancel.email} was cancelled.` }); setToCancel(null); state.reload() }
    catch (caught) { setCancelError(messageFor(caught)) } finally { setBusyId(null) }
  }

  return (
    <div className="space-y-6 page-enter">
      <PageHeader title="Invitations" subtitle="Invite someone by email. They choose their own password when they accept." />

      {notice && (
        <div role={notice.bad ? 'alert' : 'status'} className={`p-3 rounded-2xl text-xs border ${notice.bad ? 'bg-[#EF4444]/10 border-[#EF4444]/25 text-[#F87171]' : 'bg-[#10B981]/10 border-[#10B981]/25 text-[#10B981]'}`}>{notice.text}</div>
      )}

      <ChartCard title="Invite a person" subtitle="A moderator belongs to one organization and only sees its members and photos">
        <form onSubmit={send} className="space-y-4 max-w-xl">
          {formError && <div role="alert" className="p-3 rounded-2xl text-xs bg-[#EF4444]/10 border border-[#EF4444]/25 text-[#F87171]">{formError}</div>}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="inv-email" className={labelClass}>Email</label>
              <input id="inv-email" type="email" className="fc-input" value={email} autoComplete="off" onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="inv-role" className={labelClass}>Role</label>
              <select id="inv-role" className="fc-input" value={role} onChange={e => setRole(e.target.value as 'user' | 'moderator')}>
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
              </select>
            </div>
          </div>
          {role === 'moderator' && (
            <div className="space-y-1.5 max-w-sm">
              <label htmlFor="inv-org" className={labelClass}>Organization</label>
              {teams.length === 0 ? (
                <p className="text-xs text-ink-mute">There is no organization yet. <Link to="/admin/organizations" className="font-semibold text-[#FB923C] hover:underline">Create one first</Link>.</p>
              ) : (
                <select id="inv-org" className="fc-input" value={organizationId} onChange={e => setOrganizationId(e.target.value ? Number(e.target.value) : '')} required>
                  <option value="">Choose an organization…</option>
                  {teams.map(o => {
                    const full = Boolean(o.usage && o.limits && o.limits.moderators !== null && o.usage.moderators >= o.limits.moderators)
                    return <option key={o.id} value={o.id} disabled={full}>{o.name}{full ? ' (moderator seats full)' : ''}</option>
                  })}
                </select>
              )}
            </div>
          )}
          <GradientButton type="submit" disabled={sending || (role === 'moderator' && teams.length === 0)} leftIcon={<Send className="w-4 h-4" />}>
            {sending ? 'Sending…' : 'Send invitation'}
          </GradientButton>
        </form>
      </ChartCard>

      <ChartCard title="Sent invitations" subtitle="Newest first">
        <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Filter by status">
          {FILTERS.map(f => (
            <button key={f.value || 'all'} type="button" onClick={() => setFilter(f.value)} aria-pressed={filter === f.value}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${filter === f.value ? 'bg-accent-tint text-accent-soft border-accent/30' : 'border-line text-ink-mute hover:text-ink'}`}>{f.label}</button>
          ))}
        </div>
        <AsyncGate state={state} what="the invitations">
          {rows => rows.length === 0 ? (
            <p className="text-xs text-ink-mute py-4 flex items-center gap-2"><Mail className="w-4 h-4" />{filter ? 'No invitation has this status.' : 'No invitation has been sent yet.'}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-ink-faint border-b border-line">
                    <th className="py-2 pr-4">Email</th><th className="py-2 pr-4">Role</th><th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Invited by</th><th className="py-2 pr-4">Sent</th><th className="py-2 pr-4">Link valid until / accepted</th><th className="py-2"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map(row => (
                    <tr key={row.id} className="text-ink">
                      <td className="py-2 pr-4 font-semibold break-all">{row.email}</td>
                      <td className="py-2 pr-4 capitalize">{row.role}{row.organization ? <span className="block text-[10px] normal-case text-ink-faint">{row.organization.name}</span> : null}</td>
                      <td className="py-2 pr-4"><StatusBadge status={TONE[row.status] ?? 'info'} label={WORDS[row.status] ?? row.status} dot={false} /></td>
                      <td className="py-2 pr-4 text-ink-mute">{row.invited_by ?? '—'}</td>
                      <td className="py-2 pr-4 text-ink-mute whitespace-nowrap">{formatDateTime(row.created_at)}</td>
                      <td className="py-2 pr-4 text-ink-mute whitespace-nowrap">{row.status === 'accepted' && row.accepted_at ? formatDateTime(row.accepted_at) : formatDateTime(row.expires_at)}</td>
                      <td className="py-2 text-right whitespace-nowrap">
                        {(row.status === 'pending' || row.status === 'expired') && (
                          <button type="button" disabled={busyId !== null} onClick={() => void resend(row)} className="text-[11px] font-bold text-[#FB923C] hover:underline mr-3 cursor-pointer disabled:opacity-50">Resend</button>
                        )}
                        {row.status === 'pending' && (
                          <button type="button" disabled={busyId !== null} onClick={() => { setCancelError(null); setToCancel(row) }} className="text-[11px] font-bold text-error hover:underline cursor-pointer disabled:opacity-50">Cancel</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AsyncGate>
      </ChartCard>

      {toCancel && (
        <ConfirmDialog title="Cancel this invitation?" confirmLabel="Cancel invitation" busyLabel="Cancelling…" danger busy={busyId === toCancel.id} error={cancelError}
          onConfirm={() => void confirmCancel()} onCancel={() => setToCancel(null)}>
          <p>The link sent to <strong className="text-ink">{toCancel.email}</strong> stops working. You can invite them again later.</p>
        </ConfirmDialog>
      )}
    </div>
  )
}
