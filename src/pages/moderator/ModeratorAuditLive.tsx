import { useEffect, useState } from 'react'
import { Loader2, ShieldCheck } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { SearchInput } from '../../components/ui/SearchInput'
import { ModeratorGate } from '../../components/moderator/ModeratorGate'
import { listOrgAuditPage, type OrgAuditEvent } from '../../lib/api/moderatorConsole'
import { useModeratorOrganization, useModeratorResource } from '../../lib/moderationData'
import { messageFor } from '../../lib/useApiResource'
import { formatDateTime } from '../../lib/utils'

type Kind = 'member' | 'review' | 'batch' | 'report' | 'folder' | 'other'

/** The kind of thing an event was about, from what the backend says it targeted. */
function kindOf(event: OrgAuditEvent): Kind {
  const t = event.target_type.toLowerCase()
  if (event.action.includes('report') || event.action.includes('export')) return 'report'
  if (t === 'organizationmembership' || t === 'organizationinvitation' || t === 'membership' || t === 'invitation' || t === 'organization') return 'member'
  if (t === 'moderatorreview') return 'review'
  if (t === 'uploadbatch' || t === 'batch') return 'batch'
  if (t === 'identitygroup') return 'folder'
  return 'other'
}

const COLORS: Record<Kind, string> = {
  member: 'bg-violet-500/10 text-violet-400 border-violet-500/20', review: 'bg-[#F97316]/10 text-[#FB923C] border-[#F97316]/20',
  batch: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20', report: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20',
  folder: 'bg-sky-500/10 text-sky-400 border-sky-500/20', other: 'bg-surface-mute text-ink-mute border-line',
}
const KINDS: Kind[] = ['review', 'batch', 'member', 'folder', 'report', 'other']

export function LiveModeratorAudit() {
  const { organizationId } = useModeratorOrganization()
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [actor, setActor] = useState<number | undefined>(undefined)
  const [kind, setKind] = useState<Kind | 'all'>('all')
  const [extra, setExtra] = useState<OrgAuditEvent[]>([])
  const [page, setPage] = useState(1)
  const [more, setMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [moreError, setMoreError] = useState<string | null>(null)
  const [actors, setActors] = useState<Record<number, string>>({})

  // The search box asks the server once typing pauses.
  useEffect(() => {
    const timer = setTimeout(() => setQ(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  const state = useModeratorResource(
    async (org, signal) => {
      const first = await listOrgAuditPage(org, { q, actor }, 1, signal)
      return first
    },
    () => ({ count: 0, next: null, results: [] as OrgAuditEvent[] }),
    [q, actor],
  )
  // A new search or filter starts again from the first page.
  const firstPage = state.data
  useEffect(() => {
    if (!firstPage) return
    setExtra([]); setPage(1); setMore(Boolean(firstPage.next)); setMoreError(null)
    setActors(known => {
      const next = { ...known }
      for (const e of firstPage.results) if (e.actor) next[e.actor.id] = e.actor.username
      return next
    })
  }, [firstPage])

  const loadMore = async () => {
    if (organizationId === null) return
    setLoadingMore(true); setMoreError(null)
    try {
      const next = await listOrgAuditPage(organizationId, { q, actor }, page + 1)
      setExtra(current => [...current, ...next.results]); setPage(page + 1); setMore(Boolean(next.next))
    } catch (caught) { setMoreError(messageFor(caught)) } finally { setLoadingMore(false) }
  }

  return (
    <div className="space-y-6 page-enter">
      <PageHeader title="Moderator Action Audit" subtitle="Every review decision, batch control, member change and merge in your organization. Read only." />
      <ModeratorGate state={state} what="the audit trail">
        {data => {
          const all = [...data.results, ...extra]
          const rows = kind === 'all' ? all : all.filter(e => kindOf(e) === kind)
          return (
            <ChartCard title="Action Audit Feed" subtitle={`${data.count} event${data.count === 1 ? '' : 's'}${q ? ` matching “${q}”` : ''}, newest first`}>
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <SearchInput placeholder="Search who, what or which photo…" value={search} onChange={e => setSearch(e.target.value)} className="w-72" />
                <select aria-label="Filter by moderator" value={actor ?? ''} onChange={e => setActor(e.target.value ? Number(e.target.value) : undefined)}
                  className="fc-input !w-auto text-ink" style={{ background: 'rgb(var(--a-surface-mute))', border: '1px solid rgb(var(--a-line))' }}>
                  <option value="">Everyone</option>
                  {Object.entries(actors).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                </select>
                {(['all', ...KINDS] as const).map(k => (
                  <button key={k} type="button" onClick={() => setKind(k)} aria-pressed={kind === k}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer capitalize ${kind === k ? 'bg-accent-tint text-accent border-accent/30' : 'bg-surface-mute text-ink-mute border-line'}`}>{k}</button>
                ))}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full fc-table text-left">
                  <thead><tr><th>When</th><th>Who</th><th>Kind</th><th>What happened</th><th>Status</th><th>Reason</th></tr></thead>
                  <tbody>
                    {rows.map(e => (
                      <tr key={e.id} className="hover:bg-surface-mute transition-colors">
                        <td><span className="text-xs text-ink-faint font-mono">{formatDateTime(e.created_at)}</span></td>
                        <td><span className="text-xs font-bold text-ink">{e.actor_name}</span></td>
                        <td><span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${COLORS[kindOf(e)]}`}>{kindOf(e)}</span></td>
                        <td>
                          <p className="text-xs font-semibold text-ink-soft">{e.message}</p>
                          {e.target_label && <p className="text-[10px] font-mono text-ink-faint">{e.target_label}</p>}
                        </td>
                        <td className="text-xs text-ink-mute whitespace-nowrap">{e.from_status || e.to_status ? `${e.from_status ?? '—'} → ${e.to_status ?? '—'}` : '—'}</td>
                        <td><p className="text-xs text-ink-mute leading-relaxed max-w-xs">{e.reason || '—'}</p></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length === 0 && (
                <div className="text-center py-16 text-ink-faint"><ShieldCheck className="w-8 h-8 mx-auto mb-3 opacity-30" /><p className="text-xs font-semibold">{q || actor || kind !== 'all' ? 'Nothing matches those filters.' : 'The audit trail is empty.'}</p></div>
              )}
              {moreError && <p role="alert" className="mt-3 text-xs text-[#F87171]">{moreError}</p>}
              {more && (
                <div className="mt-4 text-center">
                  <button type="button" disabled={loadingMore} onClick={loadMore} className="fc-btn-secondary !py-2 !px-4 text-xs font-bold disabled:opacity-50">
                    {loadingMore ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…</> : 'Load older'}
                  </button>
                </div>
              )}
            </ChartCard>
          )
        }}
      </ModeratorGate>
    </div>
  )
}
