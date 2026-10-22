import { useEffect, useState } from 'react'
import { Building2, CheckCircle, Loader2, Plus, X } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { GradientButton } from '../../components/ui/GradientButton'
import { AsyncGate } from '../../components/admin/AsyncGate'
import { createAdminOrganization, updateAdminOrganization, type AdminOrganization, type OrganizationPlan } from '../../lib/api/adminOrganizations'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { listAdminUsersPage, type AdminUser } from '../../lib/api/adminUsers'
import { USE_API } from '../../lib/api/config'
import type { ModeratorDataScope, PlanLimits, PlanUsage } from '../../lib/api/organizations'
import { useAdminOrganizations } from '../../lib/useAdminOrganizations'
import { messageFor } from '../../lib/useApiResource'
import { formatDate } from '../../lib/utils'

const labelClass = 'text-[10px] font-bold uppercase tracking-widest text-ink-faint'
const PLANS: OrganizationPlan[] = ['free', 'team', 'enterprise']

/** "2 of 5", or just "2" when the plan has no limit. */
const seats = (used: number | undefined, limit: number | null | undefined) => (used === undefined ? '—' : limit === null || limit === undefined ? String(used) : `${used} of ${limit}`)
const full = (usage?: PlanUsage, limits?: PlanLimits) => Boolean(usage && limits && limits.moderators !== null && usage.moderators >= limits.moderators)

/** Pick the account that will own the organization: type to search the accounts on the server, then choose one. */
function OwnerPicker({ value, onChange }: { value: AdminUser | null; onChange: (user: AdminUser | null) => void }) {
  const [text, setText] = useState('')
  const [found, setFound] = useState<AdminUser[]>([])
  const [searching, setSearching] = useState(false)
  useEffect(() => {
    if (value || !USE_API || text.trim().length < 2) { setFound([]); return }
    const controller = new AbortController()
    setSearching(true)
    const timer = setTimeout(() => {
      listAdminUsersPage({ q: text.trim(), page: 1, pageSize: 6 }, controller.signal)
        .then(p => { if (!controller.signal.aborted) setFound(p.results.filter(u => u.is_active)) })
        .catch(() => { if (!controller.signal.aborted) setFound([]) })
        .finally(() => { if (!controller.signal.aborted) setSearching(false) })
    }, 250)
    return () => { controller.abort(); clearTimeout(timer) }
  }, [text, value])

  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-surface-mute border border-line text-xs">
        <span><strong className="text-ink">{value.username}</strong> <span className="text-ink-mute">{value.email}</span></span>
        <button type="button" onClick={() => { onChange(null); setText('') }} aria-label="Choose someone else" className="text-ink-mute hover:text-ink cursor-pointer"><X className="w-4 h-4" /></button>
      </div>
    )
  }
  return (
    <div className="relative">
      <input id="org-owner" className="fc-input" value={text} onChange={e => setText(e.target.value)} placeholder="Type a username or email…" autoComplete="off" />
      {(searching || found.length > 0) && (
        <ul className="absolute z-10 left-0 right-0 top-[46px] rounded-xl bg-surface border border-line shadow-soft-lg p-1.5 text-xs">
          {searching && found.length === 0 && <li className="px-3 py-2 text-ink-faint flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" />Searching…</li>}
          {found.map(u => (
            <li key={u.id}><button type="button" onClick={() => onChange(u)} className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-mute cursor-pointer">
              <strong className="text-ink">{u.username}</strong> <span className="text-ink-mute">{u.email}</span> <span className="text-ink-faint capitalize">· {u.role}</span></button></li>
          ))}
        </ul>
      )}
      {USE_API && text.trim().length >= 2 && !searching && found.length === 0 && <p className="text-[10px] text-ink-faint mt-1">No active account matches.</p>}
    </div>
  )
}

export default function Organizations() {
  const state = useAdminOrganizations()
  const [formOpen, setFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [plan, setPlan] = useState<OrganizationPlan>('free')
  const [owner, setOwner] = useState<AdminUser | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<string | null>(null)
  const [addedInDemo, setAddedInDemo] = useState<AdminOrganization[]>([])
  const [editing, setEditing] = useState<AdminOrganization | null>(null)
  const [suspending, setSuspending] = useState<AdminOrganization | null>(null)
  const [demoPatch, setDemoPatch] = useState<Record<number, Partial<AdminOrganization>>>({})
  const [notice, setNotice] = useState<{ text: string; bad?: boolean } | null>(null)
  const [working, setWorking] = useState(false)
  const [form, setForm] = useState({ name: '', plan: 'free' as OrganizationPlan, scope: 'own_members' as ModeratorDataScope, reason: '' })

  const apply = async (org: AdminOrganization, patch: Parameters<typeof updateAdminOrganization>[1], done: string) => {
    setWorking(true); setNotice(null)
    try {
      if (USE_API) { await updateAdminOrganization(org.id, patch); state.reload() }
      else setDemoPatch(p => ({ ...p, [org.id]: { ...p[org.id], ...(patch.name ? { name: patch.name } : {}), ...(patch.plan ? { plan: patch.plan } : {}), ...(patch.status ? { status: patch.status } : {}), ...(patch.moderator_data_scope ? { moderator_data_scope: patch.moderator_data_scope } : {}) } }))
      setNotice({ text: done }); setEditing(null); setSuspending(null)
    } catch (caught) { setNotice({ text: messageFor(caught), bad: true }) } finally { setWorking(false) }
  }
  const [showPersonal, setShowPersonal] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!USE_API) {
      setAddedInDemo(rows => [{ id: 100 + rows.length, name: name.trim(), slug: name.trim().toLowerCase().replace(/\s+/g, '-'), status: 'active', plan, is_personal: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, ...rows])
      setCreated(name.trim()); setFormOpen(false); setName(''); return
    }
    if (!owner) { setError('Choose the account that will own the organization.'); return }
    setBusy(true)
    try {
      await createAdminOrganization({ name: name.trim(), owner_id: owner.id, plan })
      setCreated(name.trim()); setFormOpen(false); setName(''); setOwner(null); state.reload()
    } catch (caught) { setError(messageFor(caught)) } finally { setBusy(false) }
  }

  return (
    <div className="page-enter">
      <PageHeader title="Organizations" subtitle="Each organization is a separate project: its moderators and members only ever see its own photos and people."
        action={<GradientButton leftIcon={<Plus className="w-4 h-4" />} onClick={() => { setCreated(null); setFormOpen(true) }}>New organization</GradientButton>} />

      <AsyncGate state={state} what="the organizations">
        {all => {
          const rows = [...addedInDemo, ...all].map(o => ({ ...o, ...demoPatch[o.id] })).filter(o => showPersonal || !o.is_personal)
          const personal = all.filter(o => o.is_personal).length
          return (
            <div className="space-y-5">
              {created && (
                <div role="status" className="p-3 rounded-2xl text-xs bg-[#10B981]/10 border border-[#10B981]/25 text-[#10B981] flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> “{created}” was created{USE_API ? '' : ' (demo — nothing is saved)'}. Add its moderators from Moderators → Create moderator.
                </div>
              )}

              {notice && (
                <div role={notice.bad ? 'alert' : 'status'} className={`p-3 rounded-2xl text-xs border ${notice.bad ? 'bg-[#EF4444]/10 border-[#EF4444]/25 text-[#F87171]' : 'bg-[#10B981]/10 border-[#10B981]/25 text-[#10B981]'}`}>{notice.text}</div>
              )}

              {formOpen && (
                <ChartCard title="New organization" subtitle="Give the project a name and the person who owns it">
                  <form onSubmit={submit} className="space-y-4 max-w-xl">
                    {error && <div role="alert" className="p-3 rounded-2xl text-xs bg-[#EF4444]/10 border border-[#EF4444]/25 text-[#F87171]">{error}</div>}
                    <div className="space-y-1.5">
                      <label htmlFor="org-name" className={labelClass}>Name</label>
                      <input id="org-name" className="fc-input" value={name} onChange={e => setName(e.target.value)} maxLength={120} required />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label htmlFor="org-owner" className={labelClass}>Owner</label>
                        {USE_API ? <OwnerPicker value={owner} onChange={setOwner} /> : <input className="fc-input" placeholder="(demo) any account" disabled />}
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="org-plan" className={labelClass}>Plan</label>
                        <select id="org-plan" className="fc-input" value={plan} onChange={e => setPlan(e.target.value as OrganizationPlan)}>
                          {PLANS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                        </select>
                      </div>
                    </div>
                    <p className="text-[10px] text-ink-faint">The owner can invite members and sees the whole organization. Moderators are added afterwards from Moderators, each tied to one organization.</p>
                    <div className="flex gap-2 pt-1">
                      <GradientButton type="submit" disabled={busy} leftIcon={<Building2 className="w-4 h-4" />}>{busy ? 'Creating…' : 'Create organization'}</GradientButton>
                      <GradientButton type="button" variant="secondary" onClick={() => setFormOpen(false)} disabled={busy}>Cancel</GradientButton>
                    </div>
                  </form>
                </ChartCard>
              )}

              <div className="fc-card overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-line text-xs text-ink-mute">
                  <span>{rows.length} organization{rows.length === 1 ? '' : 's'}</span>
                  {personal > 0 && (
                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={showPersonal} onChange={e => setShowPersonal(e.target.checked)} />Also show the {personal} personal workspace{personal === 1 ? '' : 's'}</label>
                  )}
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
                            <td className="text-sm text-ink-soft">{o.owner?.username ?? '—'}</td>
                            <td className="text-sm text-ink-soft">{o.member_count ?? '—'}</td>
                            <td className="text-sm text-ink-soft">{seats(o.usage?.moderators, o.limits?.moderators)}{full(o.usage, o.limits) && <span className="ml-1.5 text-[10px] font-semibold text-[#F59E0B]">full</span>}</td>
                            <td className="text-sm text-ink-soft capitalize">{o.plan}</td>
                            <td><StatusBadge status={o.status === 'active' ? 'success' : 'warning'} label={o.status === 'active' ? 'Active' : 'Suspended'} /></td>
                            <td>
                              {o.is_personal ? <span className="text-[10px] text-ink-faint">—</span> : (
                                <div className="flex gap-2">
                                  <button type="button" onClick={() => { setForm({ name: o.name, plan: o.plan as OrganizationPlan, scope: o.moderator_data_scope ?? 'own_members', reason: '' }); setNotice(null); setEditing(o) }} className="fc-btn-secondary !py-1 !px-2.5 text-[10px] cursor-pointer">Edit</button>
                                  {o.status === 'active'
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
