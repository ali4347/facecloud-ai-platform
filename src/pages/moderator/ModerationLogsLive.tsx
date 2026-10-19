import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, Layers, Loader2, MoveRight, XCircle } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { ModeratorGate } from '../../components/moderator/ModeratorGate'
import { listOrgAuditPage, type OrgAuditEvent } from '../../lib/api/moderatorConsole'
import { useModeratorResource } from '../../lib/moderationData'
import { formatDateTime } from '../../lib/utils'

/** The kinds of audit event that are a decision about one photo (the rest of the trail is on the Audit Entries screen). */
const DECISION_ACTIONS = ['moderator_review_decided', 'moderator_review_escalated'] as const
const LATEST = 50
const TODAY_LIMIT = 100

type Outcome = 'approved' | 'rejected' | 'corrected' | 'escalated' | 'other'

/* A bulk decision also leaves one event per review it decided (and one summary event), so the summary is left out here:
   counting it as well would count those photos twice. */
const outcomeOf = (e: OrgAuditEvent): Outcome => {
  if (e.action === 'moderator_review_escalated') return 'escalated'
  const to = e.to_status
  return to === 'approved' || to === 'rejected' || to === 'corrected' || to === 'escalated' ? to : 'other'
}
const BADGE: Record<Outcome, { tone: 'success' | 'error' | 'purple' | 'warning' | 'muted'; label: string }> = {
  approved: { tone: 'success', label: 'Approved' }, rejected: { tone: 'error', label: 'Rejected' }, corrected: { tone: 'purple', label: 'Corrected' },
  escalated: { tone: 'warning', label: 'Escalated' }, other: { tone: 'muted', label: 'Decision' },
}
const CHIPS: (Outcome | 'all')[] = ['all', 'approved', 'rejected', 'corrected', 'escalated']
const localDay = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }

interface Log { latest: OrgAuditEvent[]; today: OrgAuditEvent[]; todayCapped: boolean }

export function LiveModerationLogs() {
  const [chip, setChip] = useState<Outcome | 'all'>('all')
  const state = useModeratorResource<Log>(
    async (org, signal) => {
      const day = localDay()
      const [latest, today] = await Promise.all([
        Promise.all(DECISION_ACTIONS.map(action => listOrgAuditPage(org, { action }, 1, signal, LATEST))),
        Promise.all(DECISION_ACTIONS.map(action => listOrgAuditPage(org, { action, date_from: day }, 1, signal, TODAY_LIMIT))),
      ])
      const byTime = (a: OrgAuditEvent, b: OrgAuditEvent) => b.created_at.localeCompare(a.created_at)
      return {
        latest: latest.flatMap(p => p.results).sort(byTime).slice(0, LATEST),
        today: today.flatMap(p => p.results),
        todayCapped: today.some(p => p.count > TODAY_LIMIT),
      }
    },
    () => ({ latest: [], today: [], todayCapped: false }),
    [],
  )

  const tally = useMemo(() => {
    const events = state.data?.today ?? []
    const count = (o: Outcome) => events.filter(e => outcomeOf(e) === o).length
    return { approved: count('approved'), rejected: count('rejected'), escalated: count('escalated'), all: events.length }
  }, [state.data])

  return (
    <div>
      <PageHeader title="Moderation Logs" subtitle="What was decided about photos, newest first. The full trail of everything else is in Audit Entries." />
      <ModeratorGate state={state} what="the decisions">
        {data => {
          const rows = chip === 'all' ? data.latest : data.latest.filter(e => outcomeOf(e) === chip)
          const cap = data.todayCapped ? '+' : ''
          return (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                {[
                  { label: 'Approved today', value: tally.approved, icon: CheckCircle, color: 'text-success', bg: 'bg-[#10B981]/15' },
                  { label: 'Rejected today', value: tally.rejected, icon: XCircle, color: 'text-error', bg: 'bg-[#EF4444]/15' },
                  { label: 'Escalated today', value: tally.escalated, icon: MoveRight, color: 'text-accent', bg: 'bg-[#F97316]/15' },
                  { label: 'Photos decided today', value: tally.all, icon: Layers, color: 'text-ink-mute', bg: 'bg-surface-mute' },
                ].map(stat => (
                  <div key={stat.label} className="fc-card p-4 text-center">
                    <div className={`w-10 h-10 ${stat.bg} rounded-2xl flex items-center justify-center mx-auto mb-2`}><stat.icon className={`w-5 h-5 ${stat.color}`} /></div>
                    <p className="text-2xl font-bold text-ink">{stat.value}{stat.value > 0 ? cap : ''}</p>
                    <p className="text-xs text-ink-mute">{stat.label}</p>
                  </div>
                ))}
              </div>

              <ChartCard title="Review decisions" subtitle={`The latest ${data.latest.length} decision${data.latest.length === 1 ? '' : 's'} by everyone in your organization`}>
                <div className="flex flex-wrap gap-2 mb-4">
                  {CHIPS.map(c => (
                    <button key={c} type="button" onClick={() => setChip(c)} aria-pressed={chip === c}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer capitalize ${chip === c ? 'bg-accent-tint text-accent border-accent/30' : 'bg-surface-mute text-ink-mute border-line'}`}>{c}</button>
                  ))}
                </div>
                <div className="divide-y divide-line">
                  {rows.map(e => {
                    const badge = BADGE[outcomeOf(e)]
                    return (
                      <div key={e.id} className="flex items-center gap-4 py-3 hover:bg-surface-mute -mx-6 px-6 transition-colors">
                        <div className="w-8 h-8 rounded-xl bg-[#F59E0B]/15 flex items-center justify-center text-warning text-xs font-bold flex-shrink-0">{(e.actor_name || '?').slice(0, 2).toUpperCase()}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-ink">{e.message}</p>
                          <p className="text-xs text-ink-mute mt-0.5">
                            {e.actor_name} · {formatDateTime(e.created_at)}{e.reason ? ` · “${e.reason}”` : ''}
                            {e.target_type === 'ModeratorReview' && e.target_id !== null && <> · <Link to={`/moderator/images/${e.target_id}`} className="text-[#FB923C] hover:underline">Open the review</Link></>}
                          </p>
                        </div>
                        <StatusBadge status={badge.tone} label={badge.label} dot={false} />
                      </div>
                    )
                  })}
                  {rows.length === 0 && <p className="py-8 text-center text-sm text-ink-mute">{chip === 'all' ? 'No decision has been made yet.' : 'No decision of that kind in the latest ones.'}</p>}
                </div>
                {state.loading && <div className="pt-3 text-center"><Loader2 className="w-4 h-4 mx-auto animate-spin text-ink-faint" /></div>}
              </ChartCard>
            </>
          )
        }}
      </ModeratorGate>
    </div>
  )
}
