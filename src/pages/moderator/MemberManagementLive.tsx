import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle, Loader2, Mail, RefreshCw, Search, ShieldAlert, Trash2, UserPlus, X } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import {
  cancelOrgInvitation, inviteOrgMember, listOrgInvitations, listOrgMembers, removeOrgMember, resendOrgInvitation, setOrgMemberStatus,
  type OrgInvitation, type OrgMembership, type OrgPerson,
} from '../../lib/api/organizations'
import { useModeratorOrganization } from '../../lib/moderationData'
import { getSession } from '../../lib/session'
import { messageFor, useApiResource } from '../../lib/useApiResource'
import { formatDate } from '../../lib/utils'

interface OrgData { members: OrgMembership[]; invitations: OrgInvitation[] }

type Row =
  | { kind: 'member'; key: string; id: number; name: string; email: string; role: string; status: string; invitedBy: OrgPerson | null; date: string }
  | { kind: 'invite'; key: string; id: number; name: string; email: string; role: string; status: 'pending'; invitedBy: OrgPerson | null; date: string }

const tone = (status: string) =>
  status === 'active' ? 'bg-[#10B981]/10 text-[#10B981]' : status === 'pending' || status === 'invited' ? 'bg-[#FB923C]/10 text-[#FB923C]' : 'bg-[#EF4444]/10 text-[#EF4444]'

export function LiveMemberManagement() {
  const { organizationId, resolving, error: organizationError } = useModeratorOrganization()
  const state = useApiResource<OrgData>(
    async signal => {
      const [members, invitations] = await Promise.all([
        listOrgMembers(organizationId as number, signal),
        listOrgInvitations(organizationId as number, signal),
      ])
      return { members, invitations }
    },
    () => ({ members: [], invitations: [] }),
    [organizationId],
    { ready: !resolving, skip: organizationId === null },
  )
  const [scope, setScope] = useState<'all' | 'mine'>('all')
  const [search, setSearch] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [rowBusy, setRowBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<{ text: string; bad?: boolean } | null>(null)
  const [removing, setRemoving] = useState<Row | null>(null)
  const myEmail = (getSession()?.email ?? '').toLowerCase()

  const say = (text: string, bad = false) => { setToast({ text, bad }); setTimeout(() => setToast(null), 4000) }

  const rows = useMemo<Row[]>(() => {
    const data = state.data
    if (!data) return []
    const members: Row[] = data.members.map(m => ({
      kind: 'member', key: `m${m.id}`, id: m.id, name: m.user.username, email: m.user.email, role: m.role, status: m.status,
      invitedBy: m.invited_by, date: m.created_at,
    }))
    const pending: Row[] = data.invitations.filter(i => i.status === 'pending').map(i => ({
      kind: 'invite', key: `i${i.id}`, id: i.id, name: i.email.split('@')[0], email: i.email, role: i.role, status: 'pending',
      invitedBy: i.invited_by, date: i.created_at,
    }))
    const needle = search.trim().toLowerCase()
    return [...pending, ...members].filter(r =>
      (scope === 'all' || (r.invitedBy?.email ?? '').toLowerCase() === myEmail)
      && (!needle || r.name.toLowerCase().includes(needle) || r.email.toLowerCase().includes(needle)))
  }, [state.data, scope, search, myEmail])

  const act = async (row: Row, work: () => Promise<unknown>, done: string) => {
    setRowBusy(row.key)
    try {
      await work()
      say(done)
      state.reload()
    } catch (caught) {
      say(messageFor(caught), true)
    } finally {
      setRowBusy(null)
    }
  }

  const invite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (organizationId === null) return
    setBusy(true)
    setFormError(null)
    try {
      await inviteOrgMember(organizationId, inviteEmail.trim())
      say(`Invitation sent to ${inviteEmail.trim()}`)
      setInviteEmail('')
      setInviteOpen(false)
      state.reload()
    } catch (caught) {
      setFormError(messageFor(caught))
    } finally {
      setBusy(false)
    }
  }

  const failure = organizationError ?? state.error
  const loading = resolving || (state.loading && state.data === null)

  return (
    <div className="space-y-6 page-enter relative">
      {toast && (
        <div role="status" className={`fixed top-6 right-6 z-50 p-4 rounded-3xl border text-xs font-bold flex items-center gap-2 backdrop-blur-md ${
          toast.bad ? 'bg-[#EF4444]/10 border-[#EF4444]/25 text-[#F87171]' : 'bg-[#10B981]/10 border-[#10B981]/20 text-[#10B981]'}`}>
          {toast.bad ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          <span>{toast.text}</span>
        </div>
      )}

      <PageHeader
        title="Member Management"
        subtitle="The people in your organization. You only ever see your own organization's members, never anyone else's."
        action={
          <button type="button" onClick={() => { setFormError(null); setInviteOpen(true) }} disabled={organizationId === null}
            className="fc-btn-primary !py-2.5 !px-5 text-xs font-bold flex items-center gap-2 disabled:opacity-50">
            <UserPlus className="w-4 h-4" /> Invite Member
          </button>
        }
      />

      <ChartCard title="Organization Members" subtitle="Members and pending invitations">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative max-w-md flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-3 w-4 h-4 text-ink-faint" />
              <input type="text" placeholder="Search member by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="fc-input !pl-10 !py-2" />
            </div>
            {([['all', 'Whole organization'], ['mine', 'Invited by me']] as const).map(([value, label]) => (
              <button key={value} type="button" onClick={() => setScope(value)} aria-pressed={scope === value}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer ${scope === value ? 'bg-accent-tint text-accent border-accent/30' : 'bg-surface-mute text-ink-mute border-line'}`}>
                {label}
              </button>
            ))}
          </div>

          {loading && <div className="text-center py-12 text-ink-faint"><Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin" /><p className="text-xs font-semibold">Loading members…</p></div>}

          {!loading && failure && (
            <div className="text-center py-12">
              <AlertTriangle className="w-7 h-7 mx-auto mb-3 text-[#EF4444]" />
              <p className="text-xs font-semibold text-ink">{failure}</p>
              <button type="button" onClick={state.reload} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#FB923C] hover:underline cursor-pointer"><RefreshCw className="w-3.5 h-3.5" />Try again</button>
            </div>
          )}

          {!loading && !failure && organizationId === null && (
            <div className="text-center py-12 text-ink-faint">
              <Mail className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-xs font-semibold">You are not part of an organization yet, so there are no members to manage.</p>
            </div>
          )}

          {!loading && !failure && organizationId !== null && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full fc-table text-left">
                  <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Invited by</th><th>Joined / invited</th><th>Actions</th></tr></thead>
                  <tbody className="divide-y divide-line">
                    {rows.map(row => {
                      // The backend refuses a moderator touching an owner or another moderator, so the buttons are not offered.
                      const locked = row.kind === 'member' && row.role !== 'member'
                      const working = rowBusy === row.key
                      return (
                        <tr key={row.key} className="hover:bg-surface-mute transition-colors">
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F97316] to-[#EA580C] flex items-center justify-center text-[10px] font-bold text-white uppercase">{row.name.slice(0, 2)}</div>
                              <span className="font-bold text-ink">{row.name}</span>
                            </div>
                          </td>
                          <td className="text-ink-mute">{row.email}</td>
                          <td><span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-surface-mute text-ink-mute">{row.role}</span></td>
                          <td><span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${tone(row.status)}`}>{row.status === 'pending' ? 'invited' : row.status}</span></td>
                          <td className="text-ink-mute text-xs">{row.invitedBy ? row.invitedBy.username : '—'}</td>
                          <td className="text-ink-faint font-mono text-[11px]">{formatDate(row.date)}</td>
                          <td>
                            {locked ? (
                              <span className="text-[10px] text-ink-faint font-semibold italic flex items-center gap-1.5" title="A moderator cannot manage an owner or another moderator.">
                                <ShieldAlert className="w-3.5 h-3.5" />Locked
                              </span>
                            ) : row.kind === 'invite' ? (
                              <div className="flex gap-2">
                                <button type="button" disabled={working} title="Resend invitation" onClick={() => act(row, () => resendOrgInvitation(organizationId, row.id), `Invitation resent to ${row.email}`)}
                                  className="p-1.5 rounded-lg border border-line bg-surface-mute text-ink-soft hover:text-ink disabled:opacity-50 cursor-pointer"><RefreshCw className="w-3.5 h-3.5" /></button>
                                <button type="button" disabled={working} title="Cancel invitation" onClick={() => act(row, () => cancelOrgInvitation(organizationId, row.id), `Invitation to ${row.email} cancelled`)}
                                  className="p-1.5 rounded-lg border border-red-500/10 bg-red-500/5 text-red-400 hover:text-red-300 disabled:opacity-50 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                {row.status === 'active' ? (
                                  <button type="button" disabled={working} onClick={() => act(row, () => setOrgMemberStatus(organizationId, row.id, 'suspended'), `${row.email} deactivated`)}
                                    className="fc-btn-secondary !py-1 !px-2.5 text-[10px] disabled:opacity-50">Deactivate</button>
                                ) : (
                                  <button type="button" disabled={working} onClick={() => act(row, () => setOrgMemberStatus(organizationId, row.id, 'active'), `${row.email} reactivated`)}
                                    className="fc-btn-secondary !py-1 !px-2.5 text-[10px] disabled:opacity-50">Reactivate</button>
                                )}
                                <button type="button" disabled={working} title="Remove from organization" onClick={() => setRemoving(row)}
                                  className="p-1.5 rounded-lg border border-red-500/10 bg-red-500/5 text-red-400 hover:text-red-300 disabled:opacity-50 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {rows.length === 0 && (
                <div className="text-center py-12 text-ink-faint">
                  <Mail className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-xs font-semibold">{scope === 'mine' ? 'You have not invited anyone yet.' : 'No members found.'}</p>
                </div>
              )}
            </>
          )}
        </div>
      </ChartCard>

      {removing && removing.kind === 'member' && organizationId !== null && (
        <ConfirmDialog title="Remove from organization" confirmLabel="Remove" busyLabel="Removing…" danger busy={rowBusy === removing.key}
          onCancel={() => setRemoving(null)}
          onConfirm={async () => {
            const row = removing
            await act(row, () => removeOrgMember(organizationId, row.id), `${row.email} removed from the organization`)
            setRemoving(null)
          }}>
          <p>{removing.email} loses access to this organization. Their FaceCloud account is not deleted.</p>
        </ConfirmDialog>
      )}

      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-label="Invite member" className="w-full max-w-md p-6 relative rounded-2xl bg-surface border border-line">
            <button type="button" onClick={() => setInviteOpen(false)} aria-label="Close" className="absolute top-4 right-4 text-ink-faint hover:text-ink cursor-pointer"><X className="w-4 h-4" /></button>
            <h3 className="text-sm font-bold text-ink mb-2">Invite Organization Member</h3>
            <p className="text-xs text-ink-faint mb-6">We email them a link. A moderator can only invite standard members.</p>
            <form onSubmit={invite} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="invite-email" className="text-[10px] font-bold text-ink-mute uppercase tracking-wider block">Email Address</label>
                <input id="invite-email" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="name@organization.com" className="fc-input" required />
              </div>
              {formError && <p role="alert" className="text-xs text-red-500">{formError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setInviteOpen(false)} className="fc-btn-secondary !py-2.5 text-xs flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={busy} className="fc-btn-primary !py-2.5 text-xs flex-1 justify-center disabled:opacity-60">{busy ? 'Sending…' : 'Send Invitation'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
