import { useState } from 'react'
import { Building2, CheckCircle, Info, Mail, Plus } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { GradientButton } from '../../components/ui/GradientButton'
import { AsyncGate } from '../../components/admin/AsyncGate'
import {
  createOrganizationForOwner, isWaitingForOwner, updateAdminOrganization, type AdminOrganization, type CreatedForOwner, type OrganizationPlan,
} from '../../lib/api/adminOrganizations'
import { Modal } from '../../components/ui/Modal'
import { InvitationStatusChip, OwnerInvitationPanel } from '../../components/admin/OwnerInvitationPanel'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { USE_API } from '../../lib/api/config'
import type { ModeratorDataScope, PlanLimits, PlanUsage } from '../../lib/api/organizations'
import { useAdminOrganizations } from '../../lib/useAdminOrganizations'
import { messageFor } from '../../lib/useApiResource'
import { planAwareMessage, userSeats } from '../../lib/seats'
import { ApiError } from '../../lib/api/client'
import { formatDate } from '../../lib/utils'

const labelClass = 'text-[10px] font-bold uppercase tracking-widest text-ink-faint'
const PLANS: OrganizationPlan[] = ['free', 'team', 'enterprise']

/** "2 of 5", or just "2" when the plan has no limit. */
const seats = (used: number | undefined, limit: number | null | undefined) => (used === undefined ? '—' : limit === null || limit === undefined ? String(used) : `${used} of ${limit}`)
const full = (usage?: PlanUsage, limits?: PlanLimits) => Boolean(usage && limits && limits.moderators !== null && usage.moderators >= limits.moderators)

/** How an organization's state reads in the list. `pending_owner`: created from an e-mail address, nobody belongs to it yet. */
function orgStatusBadge(status: string) {
  if (status === 'active') return <StatusBadge status="success" label="Active" />
  if (status === 'pending_owner') return <StatusBadge status="info" label="Waiting for owner" />
  return <StatusBadge status="warning" label="Suspended" />
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const FIELD_LABELS: Record<string, string> = { name: 'Organization name', owner_email: 'Owner email', plan: 'Subscription plan', owner_id: 'Owner' }

/** The server's refusal with the field it is about ("Owner email: …"), not a bare "This field is required." */
function refusalFor(caught: unknown): string {
  if (caught instanceof ApiError && caught.body && typeof caught.body === 'object') {
    const body = caught.body as Record<string, unknown>
    // An older backend (before the owner-invitation release) still asks for an existing account's id and ignores the e-mail address.
    if (body.owner_id) return 'The server is not ready for this form yet: it still asks for an existing account (owner_id) instead of the owner’s e-mail. The backend update has to be deployed first.'
    const parts = Object.entries(body)
      .filter(([key]) => key in FIELD_LABELS)
      .map(([key, value]) => `${FIELD_LABELS[key]}: ${Array.isArray(value) ? value.join(' ') : String(value)}`)
    if (parts.length) return parts.join(' ')
  }
  return messageFor(caught)
}

export default function Organizations() {
  const [showPersonal, setShowPersonal] = useState(false)
  // Shared organizations only, unless the administrator asks for the personal workspaces too (every account has one).
  const state = useAdminOrganizations(showPersonal ? 'all' : 'organization')
  const [formOpen, setFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [plan, setPlan] = useState<OrganizationPlan>('free')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<CreatedForOwner | null>(null)
  const [demoCreated, setDemoCreated] = useState<string | null>(null)
  const [invitationFor, setInvitationFor] = useState<AdminOrganization | null>(null)
  const [addedInDemo, setAddedInDemo] = useState<AdminOrganization[]>([])
  const [editing, setEditing] = useState<AdminOrganization | null>(null)
  const [suspending, setSuspending] = useState<AdminOrganization | null>(null)
  const [demoPatch, setDemoPatch] = useState<Record<number, Partial<AdminOrganization>>>({})
  const [notice, setNotice] = useState<{ text: string; bad?: boolean } | null>(null)
  const [working, setWorking] = useState(false)
  const [form, setForm] = useState({ name: '', plan: 'free' as OrganizationPlan, scope: 'own_members' as ModeratorDataScope, reason: '' })

  const apply = async (org: AdminOrganization, patch: Parameters<typeof updateAdminOrganization>[1], doneText: string) => {
    let done = doneText
    setWorking(true); setNotice(null)
    try {
      if (USE_API) {
        const updated = await updateAdminOrganization(org.id, patch); state.reload()
        // Reactivating an organization whose owner never accepted puts it back to waiting, not to active.
        if (patch.status === 'active' && updated?.status === 'pending_owner') done = `${org.name} is waiting for its owner again.`
      }
      else setDemoPatch(p => ({ ...p, [org.id]: { ...p[org.id], ...(patch.name ? { name: patch.name } : {}), ...(patch.plan ? { plan: patch.plan } : {}), ...(patch.status ? { status: patch.status } : {}), ...(patch.moderator_data_scope ? { moderator_data_scope: patch.moderator_data_scope } : {}) } }))
      setNotice({ text: done }); setEditing(null); setSuspending(null)
    } catch (caught) { setNotice({ text: planAwareMessage(caught, messageFor), bad: true }) } finally { setWorking(false) }
  }
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const email = ownerEmail.trim()
    if (!name.trim()) { setError('Give the organization a name.'); return }
    if (!EMAIL_RE.test(email)) { setError('Enter the owner’s e-mail address.'); return }
    if (!USE_API) {
      setAddedInDemo(rows => [{ id: 100 + rows.length, name: name.trim(), slug: name.trim().toLowerCase().replace(/\s+/g, '-'), status: 'pending_owner', plan, is_personal: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, ...rows])
      setDemoCreated(name.trim()); setFormOpen(false); setName(''); setOwnerEmail(''); return
    }
    setBusy(true)
    try {
      const answer = await createOrganizationForOwner({ name: name.trim(), owner_email: email, plan })
      setCreated(answer); setFormOpen(false); setName(''); setOwnerEmail(''); state.reload()
    } catch (caught) { setError(refusalFor(caught)) } finally { setBusy(false) }
  }

  return (
    <div className="page-enter">
      <PageHeader title="Organizations" subtitle="Each organization is a separate project: its moderators and members only ever see its own photos and people."
        action={<GradientButton leftIcon={<Plus className="w-4 h-4" />} onClick={() => { setCreated(null); setDemoCreated(null); setError(''); setFormOpen(true) }}>New organization</GradientButton>} />

      <AsyncGate state={state} what="the organizations">
        {all => {
          const rows = [...addedInDemo, ...all].map(o => ({ ...o, ...demoPatch[o.id] })).filter(o => showPersonal || !o.is_personal)
          return (
            <div className="space-y-5">
              {demoCreated && (
                <div role="status" className="p-3 rounded-2xl text-xs bg-[#10B981]/10 border border-[#10B981]/25 text-[#10B981] flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> “{demoCreated}” was created and waits for its owner (demo — nothing is saved and no e-mail is sent).
                </div>
              )}
              {created && (
                <div role="status" className="p-4 rounded-2xl text-xs bg-[#10B981]/10 border border-[#10B981]/25 space-y-2">
                  <p className="font-semibold text-[#10B981] flex items-center gap-2"><CheckCircle className="w-4 h-4" />
                    {created.created
                      ? `“${created.name}” was created and is waiting for its owner.`
                      : `“${created.name}” already exists and is waiting for this owner. Nothing new was created and no second e-mail was sent.`}
                  </p>
                  {created.owner_invitation && (
                    <p className="text-ink-soft">
                      Invitation for <strong className="text-ink">{created.owner_invitation.email}</strong>: {created.owner_invitation.email_status === 'failed'
                        ? <span className="text-[#F87171]">the e-mail could not be sent ({created.owner_invitation.email_failure_reason || 'no reason given'}). Use Resend.</span>
                        : created.owner_invitation.email_status === 'sent' ? 'e-mail sent.' : 'e-mail about to be sent.'}{' '}
                      {created.owner_account_exists === true && 'This address already has a FaceCloud account: they will be asked to sign in, then accept.'}
                      {created.owner_account_exists === false && 'There is no account with this address yet: they will create one from the invitation.'}
                    </p>
                  )}
                  <p className="text-ink-mute">Nobody belongs to it until they accept. No password is sent; the link works once and expires.</p>
                  <button type="button" onClick={() => setInvitationFor(created)} className="font-bold text-[#FB923C] hover:underline cursor-pointer">Open the invitation</button>
                </div>
              )}

              {notice && (
                <div role={notice.bad ? 'alert' : 'status'} className={`p-3 rounded-2xl text-xs border ${notice.bad ? 'bg-[#EF4444]/10 border-[#EF4444]/25 text-[#F87171]' : 'bg-[#10B981]/10 border-[#10B981]/25 text-[#10B981]'}`}>{notice.text}</div>
              )}

              {formOpen && (
                <ChartCard title="New organization" subtitle="The owner does not need an account: they get an invitation e-mail and become the owner when they accept it">
                  <form onSubmit={submit} className="space-y-4 max-w-xl" noValidate>
                    {error && <div role="alert" className="p-3 rounded-2xl text-xs bg-[#EF4444]/10 border border-[#EF4444]/25 text-[#F87171]">{error}</div>}
                    <div className="space-y-1.5">
                      <label htmlFor="org-name" className={labelClass}>Organization name</label>
                      <input id="org-name" className="fc-input" value={name} onChange={e => setName(e.target.value)} maxLength={120} required />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label htmlFor="org-owner-email" className={labelClass}>Owner email</label>
                        <input id="org-owner-email" type="email" className="fc-input" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} autoComplete="off" placeholder="owner@company.com" required />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="org-plan" className={labelClass}>Subscription plan</label>
                        <select id="org-plan" className="fc-input" value={plan} onChange={e => setPlan(e.target.value as OrganizationPlan)}>
                          {PLANS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                        </select>
                      </div>
                    </div>
                    <p className="text-[10px] text-ink-faint flex gap-1.5"><Info className="w-3 h-3 flex-shrink-0 mt-px" />
                      The organization waits for its owner and nobody can use it until they accept. The owner then invites the moderators, and the moderators invite the members.</p>
                    <div className="flex gap-2 pt-1">
                      <GradientButton type="submit" disabled={busy} leftIcon={<Mail className="w-4 h-4" />}>{busy ? 'Creating…' : 'Create Organization & Send Invitation'}</GradientButton>
                      <GradientButton type="button" variant="secondary" onClick={() => setFormOpen(false)} disabled={busy}>Cancel</GradientButton>
                    </div>
                  </form>
                </ChartCard>
              )}

              <div className="fc-card overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-line text-xs text-ink-mute">
                  <span>{rows.length} organization{rows.length === 1 ? '' : 's'}</span>
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={showPersonal} onChange={e => setShowPersonal(e.target.checked)} />Also show personal workspaces</label>
                </div>
                {rows.length === 0 ? (
                  <p className="py-12 text-center text-sm text-ink-faint">No organization yet. Create the first one with the button above.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full fc-table">
                      <thead><tr><th>Organization</th><th>Owner</th><th>People</th><th>Moderators</th><th>Plan</th><th>Status</th><th>Actions</th></tr></thead>
                      <tbody>
                        {rows.map(o => (
                          <tr key={o.id}>
                            <td><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-xl bg-accent-tint flex items-center justify-center"><Building2 className="w-4 h-4 text-accent" /></div>
                              <div><p className="text-sm font-semibold text-ink">{o.name}</p><p className="text-[10px] text-ink-faint">{o.is_personal ? 'Personal workspace' : `${o.slug} · created ${formatDate(o.created_at)}`}</p></div></div></td>
                            <td className="text-sm text-ink-soft">
                              {o.owner?.username ?? (isWaitingForOwner(o) && o.owner_invitation
                                ? <div className="space-y-1"><p className="text-xs break-all">Invited: {o.owner_invitation.email}</p><InvitationStatusChip status={o.owner_invitation.status} /></div>
                                : '—')}
                            </td>
                            <td className="text-sm text-ink-soft">{o.member_count ?? '—'}</td>
                            <td className="text-sm text-ink-soft">{seats(o.usage?.moderators, o.limits?.moderators)}{full(o.usage, o.limits) && <span className="ml-1.5 text-[10px] font-semibold text-[#F59E0B]">full</span>}</td>
                            <td className="text-sm text-ink-soft">
                              <span className="capitalize">{o.plan}</span>
                              {(() => { const seats = userSeats(o.usage, o.limits); return seats && (
                                <span data-testid={`seats-${o.id}`} className="block text-[10px] text-ink-faint">{seats.text}{seats.remaining !== null && ` · ${seats.full ? 'full' : `${seats.remaining} left`}`}{seats.full && <span className="ml-1.5 font-semibold text-[#F59E0B]">limit reached</span>}</span>
                              ) })()}
                            </td>
                            <td>{orgStatusBadge(o.status)}</td>
                            <td>
                              {o.is_personal ? <span className="text-[10px] text-ink-faint">—</span> : (
                                <div className="flex flex-wrap gap-2">
                                  {isWaitingForOwner(o) && (
                                    <button type="button" onClick={() => setInvitationFor(o)} className="fc-btn-secondary !py-1 !px-2.5 text-[10px] cursor-pointer">Invitation</button>
                                  )}
                                  <button type="button" onClick={() => { setForm({ name: o.name, plan: o.plan as OrganizationPlan, scope: o.moderator_data_scope ?? 'own_members', reason: '' }); setNotice(null); setEditing(o) }} className="fc-btn-secondary !py-1 !px-2.5 text-[10px] cursor-pointer">Edit</button>
                                  {o.status === 'active' || isWaitingForOwner(o)
                                    ? <button type="button" onClick={() => { setForm(f => ({ ...f, reason: '' })); setNotice(null); setSuspending(o) }} className="fc-btn-secondary !py-1 !px-2.5 text-[10px] !text-[#F59E0B] cursor-pointer">Suspend</button>
                                    : <button type="button" onClick={() => void apply(o, { status: 'active' }, `${o.name} is active again.`)} disabled={working} className="fc-btn-secondary !py-1 !px-2.5 text-[10px] !text-[#10B981] cursor-pointer disabled:opacity-50">Reactivate</button>}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )
        }}
      </AsyncGate>

      {editing && (
        <div className="fixed inset-0 z-[70] flex overflow-y-auto p-4 bg-black/70 backdrop-blur-[2px]" onMouseDown={e => { if (e.target === e.currentTarget && !working) setEditing(null) }}>
          <form role="dialog" aria-modal="true" aria-label={`Edit ${editing.name}`} className="m-auto w-full max-w-md rounded-2xl bg-surface border border-line shadow-soft-lg p-6 space-y-4"
            onSubmit={e => { e.preventDefault(); const patch: Parameters<typeof updateAdminOrganization>[1] = {}; if (form.name.trim() !== editing.name) patch.name = form.name.trim(); if (form.plan !== editing.plan) patch.plan = form.plan; if (form.scope !== (editing.moderator_data_scope ?? 'own_members')) patch.moderator_data_scope = form.scope; if (form.reason.trim()) patch.reason = form.reason.trim(); if (Object.keys(patch).filter(k => k !== 'reason').length === 0) { setEditing(null); return } void apply(editing, patch, `${editing.name} was updated.`) }}>
            <h2 className="text-base font-bold text-ink">Edit {editing.name}</h2>
            <div className="space-y-1.5"><label htmlFor="edit-org-name" className={labelClass}>Name</label><input id="edit-org-name" className="fc-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} maxLength={150} required /></div>
            <div className="space-y-1.5"><label htmlFor="edit-org-plan" className={labelClass}>Plan</label>
              <select id="edit-org-plan" className="fc-input text-ink" value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value as OrganizationPlan }))}>{PLANS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}</select>
              <p className="text-[10px] text-ink-faint">The plan sets how many moderators and members it may have. Nobody is removed if it goes down.</p></div>
            <div className="space-y-1.5"><label htmlFor="edit-org-scope" className={labelClass}>What a moderator sees</label>
              <select id="edit-org-scope" className="fc-input text-ink" value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value as ModeratorDataScope }))}>
                <option value="own_members">Only the members they invited, and members nobody invited</option>
                <option value="organization">Every member of the organization</option></select></div>
            <div className="space-y-1.5"><label htmlFor="edit-org-reason" className={labelClass}>Reason (kept in the audit trail)</label><input id="edit-org-reason" className="fc-input" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} maxLength={500} /></div>
            <div className="flex justify-end gap-2 pt-1"><GradientButton type="button" variant="secondary" onClick={() => setEditing(null)} disabled={working}>Cancel</GradientButton><GradientButton type="submit" disabled={working}>{working ? 'Saving…' : 'Save changes'}</GradientButton></div>
          </form>
        </div>
      )}

      {invitationFor && (
        <Modal title={`Owner invitation · ${invitationFor.name}`} onClose={() => setInvitationFor(null)} wide>
          <OwnerInvitationPanel organizationId={invitationFor.id} organizationName={invitationFor.name} initial={invitationFor.owner_invitation} onChanged={state.reload} />
        </Modal>
      )}

      {suspending && (
        <ConfirmDialog title={`Suspend ${suspending.name}`} confirmLabel="Suspend" busyLabel="Suspending…" danger busy={working} onCancel={() => setSuspending(null)}
          onConfirm={() => void apply(suspending, { status: 'suspended', ...(form.reason.trim() ? { reason: form.reason.trim() } : {}) }, `${suspending.name} is suspended.`)}>
          <p>Nothing is deleted. Until you reactivate it, its owner, moderators and members are told the organization is suspended and cannot use it or upload to it. Their own personal workspaces keep working.</p>
          <label htmlFor="suspend-reason" className="block text-xs font-semibold text-ink pt-1">Reason (kept in the audit trail)</label>
          <input id="suspend-reason" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} maxLength={500} className="fc-input" />
        </ConfirmDialog>
      )}
    </div>
  )
}
