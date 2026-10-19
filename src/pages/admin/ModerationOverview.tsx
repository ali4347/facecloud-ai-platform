import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Clock, Hourglass, ShieldAlert, UserX, Users } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { AsyncGate } from '../../components/admin/AsyncGate'
import { getModerationOverview, type ModerationOverview } from '../../lib/api/adminOperations'
import { useApiResource } from '../../lib/useApiResource'
import { formatDateTime } from '../../lib/utils'

const STALE_CHOICES = [24, 48, 72, 168] as const
const staleLabel = (hours: number) => (hours % 24 === 0 ? `${hours / 24} day${hours === 24 ? '' : 's'}` : `${hours} hours`)

/** A sample for the demo build only; the numbers are not real. */
const demoOverview = (staleHours: number): ModerationOverview => ({
  stale_hours: staleHours,
  totals: { pending: 12, in_review: 4, escalated: 2, completed_today: 9, approved_total: 140, rejected_total: 38, corrected_total: 6, stale_open: 3, overdue: 2, due_soon: 4, unassigned: 7, claimed_now: 1, sla_hours: 24 },
  organizations_needing_attention: [{ organization_id: 1, organization_name: 'Acme Team', pending: 8, in_review: 2, escalated: 2, stale_open: 3, overdue: 2, oldest_open_at: new Date(Date.now() - 4 * 86_400_000).toISOString() }],
  moderator_workload: [{ moderator_id: 1, username: 'demo-moderator', assigned_open: 5, decided_total: 120 }],
})

export default function ModerationOverviewPage() {
  const [stale, setStale] = useState<number>(48)
  const state = useApiResource(signal => getModerationOverview(stale, signal), () => demoOverview(stale), [stale])

  return (
    <div className="space-y-6 page-enter">
      <PageHeader title="Moderation Overview" subtitle="Reviews waiting across every organization, and who is carrying them." />

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="When an open review counts as stale">
        <span className="text-xs text-ink-mute mr-1">A review nobody has decided for</span>
        {STALE_CHOICES.map(hours => (
          <button key={hours} type="button" onClick={() => setStale(hours)} aria-pressed={stale === hours}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${stale === hours ? 'bg-accent-tint text-accent-soft border-accent/30' : 'border-line text-ink-mute hover:text-ink'}`}>
            {staleLabel(hours)}
          </button>
        ))}
        <span className="text-xs text-ink-mute">is stale</span>
      </div>

      <AsyncGate state={state} what="the moderation overview">
        {data => {
          const t = data.totals
          const tiles = [
            { title: 'Waiting', value: t.pending, detail: `${t.in_review} being reviewed`, icon: Hourglass, color: '#FB923C' },
            { title: 'Escalated', value: t.escalated, detail: 'Sent to an administrator', icon: ShieldAlert, color: '#8B5CF6' },
            { title: 'Overdue', value: t.overdue, detail: `Past the ${t.sla_hours} h deadline · ${t.due_soon} due soon`, icon: AlertTriangle, color: t.overdue > 0 ? '#EF4444' : '#10B981' },
            { title: `Stale (${staleLabel(data.stale_hours)}+)`, value: t.stale_open, detail: 'Open and untouched', icon: Clock, color: t.stale_open > 0 ? '#F59E0B' : '#10B981' },
            { title: 'Nobody assigned', value: t.unassigned, detail: `${t.claimed_now} held by a moderator now`, icon: UserX, color: '#FB923C' },
            { title: 'Decided today', value: t.completed_today, detail: `${t.approved_total} approved · ${t.rejected_total} rejected · ${t.corrected_total} corrected, all time`, icon: CheckCircle2, color: '#10B981' },
          ]
          return (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {tiles.map(tile => (
                  <div key={tile.title} className="fc-card p-6 flex items-center justify-between">
                    <div className="space-y-2 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider block text-ink-mute">{tile.title}</span>
                      <span className="text-2xl font-bold text-ink block">{tile.value}</span>
                      <span className="text-[10px] text-ink-faint block">{tile.detail}</span>
                    </div>
                    <div className="p-3 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgb(var(--a-surface-mute))', border: '1px solid rgb(var(--a-line))' }}>
                      <tile.icon className="w-5 h-5" style={{ color: tile.color }} />
                    </div>
                  </div>
                ))}
              </div>

              <ChartCard title="Organizations that need attention" subtitle="Escalated first, then overdue, then stale">
                {data.organizations_needing_attention.length === 0 ? (
                  <p className="text-xs text-ink-mute py-4">Every organization has an empty queue.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-[10px] uppercase tracking-wider text-ink-faint border-b border-line">
                          <th className="py-2 pr-4">Organization</th><th className="py-2 pr-4">Waiting</th><th className="py-2 pr-4">Being reviewed</th>
                          <th className="py-2 pr-4">Escalated</th><th className="py-2 pr-4">Overdue</th><th className="py-2 pr-4">Stale</th><th className="py-2">Oldest open</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {data.organizations_needing_attention.map(org => (
                          <tr key={org.organization_id} className="text-ink">
                            <td className="py-2 pr-4 font-semibold"><Link to="/admin/organizations" className="hover:underline">{org.organization_name}</Link></td>
                            <td className="py-2 pr-4">{org.pending}</td>
                            <td className="py-2 pr-4">{org.in_review}</td>
                            <td className={`py-2 pr-4 ${org.escalated > 0 ? 'text-[#8B5CF6] font-bold' : ''}`}>{org.escalated}</td>
                            <td className={`py-2 pr-4 ${org.overdue > 0 ? 'text-[#EF4444] font-bold' : ''}`}>{org.overdue}</td>
                            <td className={`py-2 pr-4 ${org.stale_open > 0 ? 'text-[#F59E0B] font-bold' : ''}`}>{org.stale_open}</td>
                            <td className="py-2 text-ink-mute whitespace-nowrap">{org.oldest_open_at ? formatDateTime(org.oldest_open_at) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </ChartCard>

              <ChartCard title="Moderator workload" subtitle="Reviews each moderator holds open, and how many they have decided in all">
                {data.moderator_workload.length === 0 ? (
                  <p className="text-xs text-ink-mute py-4">No review has been assigned or decided yet.</p>
                ) : (
                  <ul className="divide-y divide-line">
                    {data.moderator_workload.map(person => (
                      <li key={person.moderator_id} className="py-3 flex items-center justify-between gap-4 text-xs">
                        <span className="flex items-center gap-2 font-semibold text-ink"><Users className="w-4 h-4 text-ink-faint" />{person.username || `Moderator #${person.moderator_id}`}</span>
                        <span className="text-ink-mute">{person.assigned_open} open · {person.decided_total} decided</span>
                      </li>
                    ))}
                  </ul>
                )}
              </ChartCard>
            </>
          )
        }}
      </AsyncGate>
    </div>
  )
}
