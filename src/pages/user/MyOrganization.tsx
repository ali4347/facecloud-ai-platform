import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Building2, CheckCircle, Download, Image as ImageIcon, Loader2, Mail, RefreshCw, Save, ShieldAlert, Trash2, Upload, UserPlus, Users, X } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { AuthedImage } from '../../components/ui/AuthedImage'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { listOrgAuditPage, type OrgAuditEvent } from '../../lib/api/moderatorConsole'
import {
  cancelOrgInvitation, deleteOrgLogo, displayName, downloadOrgExport, getOrgExport, getOrgLogoBlob, getOrganization, inviteOrgMember, updateOwnOrganization, uploadOrgLogo,
  type ModeratorDataScope, type OrganizationDetail, listOrgInvitations, listOrgMembers, removeOrgMember,
  requestOrgExport, resendOrgInvitation, setOrgMemberRole, setOrgMemberStatus, type OrgInvitation, type OrgMembership,
} from '../../lib/api/organizations'
import { saveBlob } from '../../lib/saveBlob'
import { getSession } from '../../lib/session'
import { useOwnedOrganizations } from '../../lib/useOwnedOrganizations'
import { messageFor } from '../../lib/useApiResource'
import { planAwareMessage, seatSummary, userSeats } from '../../lib/seats'
import { formatDate, formatDateTime } from '../../lib/utils'

const labelClass = 'text-[10px] font-bold uppercase tracking-widest text-ink-faint'
const tone = (status: string) => (status === 'active' ? 'success' : status === 'suspended' ? 'error' : 'warning')

/** The organization owner's own screen: who is in it, who may join, what happened, and a copy of its data. */
export default function MyOrganization() {
  const { owned, loading: loadingOrgs } = useOwnedOrganizations()
  const [orgId, setOrgId] = useState<number | null>(null)
  const org = owned.find(o => o.id === orgId) ?? owned[0] ?? null
  const id = org?.id ?? null
  const myEmail = (getSession()?.email ?? '').toLowerCase()

  const [members, setMembers] = useState<OrgMembership[]>([])
  const [invites, setInvites] = useState<OrgInvitation[]>([])
  const [audit, setAudit] = useState<OrgAuditEvent[]>([])
  const [auditMore, setAuditMore] = useState(false)
  const [auditPage, setAuditPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ text: string; bad?: boolean } | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [removing, setRemoving] = useState<OrgMembership | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'member' | 'moderator'>('member')
  const [exporting, setExporting] = useState(false)
  const [detail, setDetail] = useState<OrganizationDetail | null>(null)
  const [draft, setDraft] = useState({ name: '', scope: 'own_members' as ModeratorDataScope, brandName: '', accent: '' })
  const [savingSettings, setSavingSettings] = useState(false)
  const [logoBusy, setLogoBusy] = useState(false)
  const suspended = org?.status === 'suspended'

  const say = (text: string, bad = false) => { setToast({ text, bad }); setTimeout(() => setToast(null), 4500) }

  const load = useCallback(async (organizationId: number) => {
    setLoading(true); setError(null)
    try {
      const [m, i, a, d] = await Promise.all([listOrgMembers(organizationId), listOrgInvitations(organizationId), listOrgAuditPage(organizationId, {}, 1), getOrganization(organizationId)])
      setMembers(m); setInvites(i.filter(x => x.status === 'pending')); setAudit(a.results); setAuditMore(Boolean(a.next)); setAuditPage(1)
      setDetail(d)
      setDraft({ name: d.name, scope: d.moderator_data_scope ?? 'own_members', brandName: d.brand_name ?? '', accent: d.brand_accent ?? '' })
    } catch (caught) { setError(messageFor(caught)) } finally { setLoading(false) }
  }, [])
  // A suspended organization answers every request with a refusal, so nothing is asked of it; the banner says why.
  useEffect(() => { if (id !== null && !suspended) void load(id) }, [id, load, suspended])

  const act = async (key: string, work: () => Promise<unknown>, done: string) => {
    if (id === null) return false
    setBusy(key)
    try { await work(); say(done); await load(id); return true } catch (caught) { say(planAwareMessage(caught, messageFor), true); return false } finally { setBusy(null) }
  }

  const invite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (id === null) return
    // A refused invitation (plan full, address already invited…) keeps what was typed, so it can be corrected instead of typed again.
    if (await act('invite', () => inviteOrgMember(id, inviteEmail.trim(), inviteRole), `Invitation sent to ${inviteEmail.trim()}.`)) setInviteEmail('')
  }

  const loadOlder = async () => {
    if (id === null) return
    try { const next = await listOrgAuditPage(id, {}, auditPage + 1); setAudit(cur => [...cur, ...next.results]); setAuditPage(auditPage + 1); setAuditMore(Boolean(next.next)) }
    catch (caught) { say(messageFor(caught), true) }
  }

  // Ask for the export, wait for it to be ready, then hand the file over.
  const exportData = async () => {
    if (id === null) return
    setExporting(true)
    try {
      let job = await requestOrgExport(id)
      for (let tries = 0; job.status !== 'ready' && tries < 60; tries++) {
        if (job.status === 'failed' || job.status === 'expired') throw new Error(job.failure_reason || 'The export could not be made. Try again.')
        await new Promise(r => setTimeout(r, 2000))
        job = await getOrgExport(id, job.id)
      }
      if (job.status !== 'ready') throw new Error('The export is taking longer than expected. Try again in a minute.')
      saveBlob(await downloadOrgExport(id, job.id), `${org?.slug ?? 'organization'}-export.json`)
      say('Your export was downloaded.')
    } catch (caught) { say(messageFor(caught), true) } finally { setExporting(false) }
  }

  const seatFull = (kind: 'moderators' | 'members') => {
    const limit = detail?.limits?.[kind]
    const kindFull = limit !== null && limit !== undefined && (detail?.usage?.[kind] ?? 0) >= limit
    return kindFull || Boolean(userSeats(detail?.usage, detail?.limits)?.full)     // the plan's total user limit stops invitations of either kind
  }
  const seatText = (kind: 'moderators' | 'members') => {
    const used = detail?.usage?.[kind]
    const limit = detail?.limits?.[kind]
    return used === undefined ? '—' : limit === null || limit === undefined ? String(used) : `${used} of ${limit}`
  }

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (id === null || !detail) return
    setSavingSettings(true)
    try {
      const patch: Parameters<typeof updateOwnOrganization>[1] = {}
      if (draft.name.trim() !== detail.name) patch.name = draft.name.trim()
      if (draft.scope !== (detail.moderator_data_scope ?? 'own_members')) patch.moderator_data_scope = draft.scope
      if (draft.brandName.trim() !== (detail.brand_name ?? '')) patch.brand_name = draft.brandName.trim()
      if (draft.accent.trim().toLowerCase() !== (detail.brand_accent ?? '')) patch.brand_accent = draft.accent.trim()
      if (Object.keys(patch).length === 0) { say('Nothing was changed.'); return }
      await updateOwnOrganization(id, patch)
      say('Saved.'); await load(id)
    } catch (caught) { say(messageFor(caught), true) } finally { setSavingSettings(false) }
  }

  const chooseLogo = async (file: File | undefined) => {
    if (!file || id === null) return
    setLogoBusy(true)
    try { await uploadOrgLogo(id, file); say('Logo updated.'); await load(id) } catch (caught) { say(messageFor(caught), true) } finally { setLogoBusy(false) }
  }
  const removeLogo = async () => {
    if (id === null) return
    setLogoBusy(true)
    try { await deleteOrgLogo(id); say('Logo removed.'); await load(id) } catch (caught) { say(messageFor(caught), true) } finally { setLogoBusy(false) }
  }

  const counts = useMemo(() => ({
    members: members.filter(m => m.status === 'active').length,
    moderators: members.filter(m => m.role === 'moderator' && m.status === 'active').length,
  }), [members])

  if (loadingOrgs) return <div className="text-center py-20 text-ink-faint"><Loader2 className="w-6 h-6 mx-auto animate-spin" /></div>
  if (!org) {
    return (
      <div className="max-w-md mx-auto text-center py-24">
        <Building2 className="w-10 h-10 mx-auto mb-4 text-ink-faint" />
        <h1 className="text-lg font-bold text-ink mb-2">You do not own an organization</h1>
        <p className="text-sm text-ink-mute">This page is for the owner of an organization. A FaceCloud administrator creates the organization and names its owner.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 page-enter relative">
      {toast && (
        <div role="status" className={`fixed top-6 right-6 z-50 p-4 rounded-3xl border text-xs font-bold flex items-center gap-2 backdrop-blur-md ${
          toast.bad ? 'bg-[#EF4444]/10 border-[#EF4444]/25 text-[#F87171]' : 'bg-[#10B981]/10 border-[#10B981]/20 text-[#10B981]'}`}>
          {toast.bad ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}<span>{toast.text}</span>
        </div>
      )}

      <PageHeader title={displayName(detail ?? org)} subtitle="You own this organization: you decide who works in it and you can see everything about it."
        action={owned.length > 1 ? (
          <select aria-label="Organization" value={org.id} onChange={e => setOrgId(Number(e.target.value))} className="fc-input !w-auto text-ink">
            {owned.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        ) : undefined} />

      {error && <p role="alert" className="p-3 rounded-2xl text-xs bg-[#EF4444]/10 border border-[#EF4444]/25 text-[#F87171]">{error}</p>}
      {suspended && (
        <div role="alert" className="p-4 rounded-2xl text-sm bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-ink-soft flex gap-3">
          <AlertTriangle className="w-5 h-5 text-[#F59E0B] flex-shrink-0" />
          <div><p className="font-semibold text-ink">This organization is suspended.</p><p className="text-xs mt-1">The FaceCloud administrator has paused it. Nothing is deleted, but nobody can use it or upload to it until it is reactivated. Contact the administrator to find out why.</p></div>
        </div>
      )}

      {!suspended && (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'People', value: String(detail?.member_count ?? counts.members), icon: Users },
          { label: 'Moderators', value: seatText('moderators'), icon: ShieldAlert },
          { label: 'Members', value: seatText('members'), icon: Users },
          { label: 'Waiting to join', value: String(invites.length), icon: Mail },
          { label: 'Plan', value: org.plan.charAt(0).toUpperCase() + org.plan.slice(1), note: seatSummary(detail?.usage, detail?.limits), icon: Building2 },
        ].map(card => (
          <div key={card.label} className="fc-card p-5 flex items-center justify-between">
            <div><span className={labelClass}>{card.label}</span><p className="text-xl font-bold text-ink mt-1">{card.value}</p>{'note' in card && card.note && <p data-testid="plan-seats" className={`text-[11px] mt-0.5 ${userSeats(detail?.usage, detail?.limits)?.full ? 'text-[#F59E0B]' : 'text-ink-faint'}`}>{card.note}</p>}</div>
            <card.icon className="w-5 h-5 text-accent" />
          </div>
        ))}
      </div>
      )}

      {!suspended && <>
      <ChartCard title="Invite someone" subtitle="They get an email with a link; a moderator sees and reviews your team's photos">
        <form onSubmit={invite} className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5 flex-1 min-w-[16rem]">
            <label htmlFor="owner-invite-email" className={labelClass}>Email address</label>
            <input id="owner-invite-email" type="email" className="fc-input" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="name@company.com" required />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="owner-invite-role" className={labelClass}>Role</label>
            <select id="owner-invite-role" className="fc-input text-ink" value={inviteRole} onChange={e => setInviteRole(e.target.value as 'member' | 'moderator')}>
              <option value="member" disabled={seatFull('members')}>Member (uploads photos){seatFull('members') ? ' — seats full' : ''}</option>
              <option value="moderator" disabled={seatFull('moderators')}>Moderator (reviews photos){seatFull('moderators') ? ' — seats full' : ''}</option>
            </select>
          </div>
          <button type="submit" disabled={busy === 'invite' || seatFull(inviteRole === 'moderator' ? 'moderators' : 'members')} className="fc-btn-primary !py-3 !px-5 text-xs font-bold disabled:opacity-60"><UserPlus className="w-4 h-4" /> {busy === 'invite' ? 'Sending…' : 'Send invitation'}</button>
        </form>
        {(seatFull('moderators') || seatFull('members')) && (
          <p className="mt-3 text-xs text-[#F59E0B]">Your {org.plan} plan has no free {seatFull('moderators') && seatFull('members') ? 'moderator or member' : seatFull('moderators') ? 'moderator' : 'member'} seat. Invitations that are still waiting also hold a seat. Ask the FaceCloud administrator to change your plan, or cancel a waiting invitation.</p>
        )}
      </ChartCard>

      <ChartCard title="People" subtitle="Everyone in the organization">
        {loading && members.length === 0 ? <div className="py-8 text-center"><Loader2 className="w-5 h-5 mx-auto animate-spin text-ink-faint" /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full fc-table text-left">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
              <tbody className="divide-y divide-line">
                {members.map(m => {
                  const me = m.user.email.toLowerCase() === myEmail
                  const locked = m.role === 'owner' || me
                  const working = busy === `m${m.id}`
                  return (
                    <tr key={m.id}>
                      <td className="font-bold text-ink">{m.user.username}{me && <span className="ml-2 text-[10px] text-ink-faint">you</span>}</td>
                      <td className="text-ink-mute">{m.user.email}</td>
                      <td className="text-xs text-ink-soft capitalize">{m.role}</td>
                      <td><StatusBadge status={tone(m.status)} label={m.status} dot={false} /></td>
                      <td className="text-ink-faint text-xs">{formatDate(m.created_at)}</td>
                      <td>
                        {locked ? <span className="text-[10px] text-ink-faint italic">{me ? 'This is you' : 'Owner'}</span> : (
                          <div className="flex flex-wrap gap-2">
                            <button type="button" disabled={working || (m.role !== 'moderator' && seatFull('moderators'))} title={m.role !== 'moderator' && seatFull('moderators') ? 'No free moderator seat on your plan' : undefined} onClick={() => act(`m${m.id}`, () => setOrgMemberRole(org.id, m.id, m.role === 'moderator' ? 'member' : 'moderator'), m.role === 'moderator' ? `${m.user.username} is now a member.` : `${m.user.username} is now a moderator.`)}
                              className="fc-btn-secondary !py-1 !px-2.5 text-[10px] disabled:opacity-50">{m.role === 'moderator' ? 'Make member' : 'Make moderator'}</button>
                            <button type="button" disabled={working} onClick={() => act(`m${m.id}`, () => setOrgMemberStatus(org.id, m.id, m.status === 'active' ? 'suspended' : 'active'), m.status === 'active' ? `${m.user.username} was deactivated.` : `${m.user.username} was reactivated.`)}
                              className="fc-btn-secondary !py-1 !px-2.5 text-[10px] disabled:opacity-50">{m.status === 'active' ? 'Deactivate' : 'Reactivate'}</button>
                            <button type="button" disabled={working} onClick={() => setRemoving(m)} title="Remove from the organization" className="p-1.5 rounded-lg border border-red-500/10 bg-red-500/5 text-red-400 hover:text-red-300 disabled:opacity-50 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </ChartCard>

      {invites.length > 0 && (
        <ChartCard title="Waiting to join" subtitle="Invitations that have not been accepted yet">
          <ul className="divide-y divide-line">
            {invites.map(i => (
              <li key={i.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div><p className="font-semibold text-ink">{i.email}</p><p className="text-ink-faint capitalize">{i.role} · invited {formatDate(i.created_at)} · expires {formatDateTime(i.expires_at)}</p></div>
                <div className="flex gap-2">
                  <button type="button" disabled={busy === `i${i.id}`} title="Send the email again" onClick={() => act(`i${i.id}`, () => resendOrgInvitation(org.id, i.id), `Invitation sent again to ${i.email}.`)} className="p-1.5 rounded-lg border border-line bg-surface-mute text-ink-soft hover:text-ink disabled:opacity-50 cursor-pointer"><RefreshCw className="w-3.5 h-3.5" /></button>
                  <button type="button" disabled={busy === `i${i.id}`} title="Cancel the invitation" onClick={() => act(`i${i.id}`, () => cancelOrgInvitation(org.id, i.id), `The invitation to ${i.email} was cancelled.`)} className="p-1.5 rounded-lg border border-red-500/10 bg-red-500/5 text-red-400 hover:text-red-300 disabled:opacity-50 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                </div>
              </li>
            ))}
          </ul>
        </ChartCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Organization settings" subtitle="Who sees what inside your organization">
          <form onSubmit={saveSettings} className="space-y-4">
            <div className="space-y-1.5"><label htmlFor="org-set-name" className={labelClass}>Name</label><input id="org-set-name" className="fc-input" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} maxLength={150} required /></div>
            <div className="space-y-1.5">
              <label htmlFor="org-set-scope" className={labelClass}>What a moderator sees</label>
              <select id="org-set-scope" className="fc-input text-ink" value={draft.scope} onChange={e => setDraft(d => ({ ...d, scope: e.target.value as ModeratorDataScope }))}>
                <option value="own_members">Their own members, and members nobody invited</option>
                <option value="organization">Every member of the organization</option>
              </select>
              <p className="text-[10px] text-ink-faint leading-relaxed">With the first choice a moderator reviews only the photos of the people they invited, plus anyone no moderator invited, so no photo is left without a reviewer. You always see everyone. The change applies at once.</p>
            </div>
            <button type="submit" disabled={savingSettings} className="fc-btn-primary !py-2.5 !px-5 text-xs font-bold disabled:opacity-60"><Save className="w-4 h-4" /> {savingSettings ? 'Saving…' : 'Save settings'}</button>
          </form>
        </ChartCard>

        <ChartCard title="Branding" subtitle="What your members see instead of the plain name">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl border border-line bg-surface-mute flex items-center justify-center overflow-hidden flex-shrink-0">
                {detail?.logo_url
                  ? <AuthedImage load={signal => getOrgLogoBlob(detail.logo_url as string, signal)} cacheKey={`org-logo-${detail.id}-${detail.logo_url}`} alt="Organization logo" box={64} rounded="rounded-2xl" className="object-contain !border-0" />
                  : <ImageIcon className="w-6 h-6 text-ink-faint" />}
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <label className={`fc-btn-secondary !py-1.5 !px-3 text-[11px] font-bold cursor-pointer ${logoBusy ? 'opacity-50 pointer-events-none' : ''}`}>
                    <Upload className="w-3.5 h-3.5" /> {detail?.logo_url ? 'Replace logo' : 'Upload logo'}
                    <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={e => { void chooseLogo(e.target.files?.[0]); e.target.value = '' }} />
                  </label>
                  {detail?.logo_url && <button type="button" disabled={logoBusy} onClick={() => void removeLogo()} className="fc-btn-secondary !py-1.5 !px-3 text-[11px] font-bold !text-red-400 disabled:opacity-50 cursor-pointer">Remove</button>}
                </div>
                <p className="text-[10px] text-ink-faint">PNG or JPEG, up to 1 MB. It is shrunk to at most 512 pixels and shown only to your members.</p>
              </div>
            </div>
            <form onSubmit={saveSettings} className="space-y-4">
              <div className="space-y-1.5"><label htmlFor="org-brand-name" className={labelClass}>Brand name</label><input id="org-brand-name" className="fc-input" value={draft.brandName} onChange={e => setDraft(d => ({ ...d, brandName: e.target.value }))} maxLength={100} placeholder={detail?.name ?? ''} /><p className="text-[10px] text-ink-faint">Leave empty to show &ldquo;{detail?.name}&rdquo;.</p></div>
              <div className="space-y-1.5">
                <label htmlFor="org-brand-accent" className={labelClass}>Accent colour</label>
                <div className="flex items-center gap-3">
                  <input aria-label="Pick a colour" type="color" value={/^#[0-9a-f]{6}$/i.test(draft.accent) ? draft.accent : '#f97316'} onChange={e => setDraft(d => ({ ...d, accent: e.target.value }))} className="w-10 h-10 rounded-lg border border-line bg-transparent cursor-pointer" />
                  <input id="org-brand-accent" className="fc-input !w-36 font-mono" value={draft.accent} onChange={e => setDraft(d => ({ ...d, accent: e.target.value }))} placeholder="#1a73e8" maxLength={7} />
                  {draft.accent && <button type="button" onClick={() => setDraft(d => ({ ...d, accent: '' }))} className="text-[11px] font-semibold text-ink-mute hover:text-ink cursor-pointer">Clear</button>}
                </div>
              </div>
              <button type="submit" disabled={savingSettings} className="fc-btn-primary !py-2.5 !px-5 text-xs font-bold disabled:opacity-60"><Save className="w-4 h-4" /> {savingSettings ? 'Saving…' : 'Save branding'}</button>
            </form>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <ChartCard title="Recent activity" subtitle="What moderators and owners did in this organization">
            {audit.length === 0 ? <p className="text-xs text-ink-faint py-4">Nothing has happened yet.</p> : (
              <ul className="space-y-3">
                {audit.map(e => (
                  <li key={e.id} className="flex gap-3 text-xs"><div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-accent flex-shrink-0" />
                    <div className="min-w-0"><p className="text-ink"><span className="font-semibold">{e.actor_name}</span> {e.message.charAt(0).toLowerCase() + e.message.slice(1)}</p>
                      {e.reason && <p className="text-ink-mute">“{e.reason}”</p>}<p className="text-[10px] font-mono text-ink-faint">{formatDateTime(e.created_at)}</p></div></li>
                ))}
              </ul>
            )}
            {auditMore && <div className="mt-4"><button type="button" onClick={loadOlder} className="fc-btn-secondary !py-2 !px-4 text-xs font-bold">Load older</button></div>}
          </ChartCard>
        </div>
        <div className="lg:col-span-4">
          <ChartCard title="Your data" subtitle="A copy of what this organization owns">
            <p className="text-xs text-ink-mute leading-relaxed mb-4">Downloads a file with the organization's records. It never includes a member's personal account data. The file expires after a day.</p>
            <button type="button" disabled={exporting} onClick={exportData} className="fc-btn-secondary w-full justify-center !py-2.5 text-xs font-bold disabled:opacity-60">
              {exporting ? <><Loader2 className="w-4 h-4 animate-spin" /> Preparing…</> : <><Download className="w-4 h-4" /> Export organization data</>}
            </button>
          </ChartCard>
        </div>
      </div>

      </>}

      {removing && (
        <ConfirmDialog title="Remove from the organization" confirmLabel="Remove" busyLabel="Removing…" danger busy={busy === `m${removing.id}`} onCancel={() => setRemoving(null)}
          onConfirm={async () => { const m = removing; await act(`m${m.id}`, () => removeOrgMember(org.id, m.id), `${m.user.username} was removed.`); setRemoving(null) }}>
          <p>{removing.user.username} ({removing.user.email}) loses access to {org.name}. Their FaceCloud account is not deleted.</p>
        </ConfirmDialog>
      )}
    </div>
  )
}
