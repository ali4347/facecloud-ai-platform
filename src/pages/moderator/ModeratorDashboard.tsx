import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { useModeratorDashboard, useModeratorPerformance } from '../../lib/moderationData'
import { AlertTriangle, ArrowRight, Loader2, RefreshCw } from 'lucide-react'

const WINDOWS = [7, 30, 90] as const

function Figure({ label, value, tone = 'text-ink', hint }: {
  label: string
  value: string
  tone?: string
  hint?: string
}) {
  return (
    <div className="fc-card p-6 space-y-2">
      <span className="text-[10px] text-ink-mute font-bold uppercase tracking-wider block">{label}</span>
      <span className={`text-lg font-bold block ${tone}`}>{value}</span>
      {hint && <span className="text-[10px] text-ink-faint block">{hint}</span>}
    </div>
  )
}

function hours(value: number | null) {
  return value === null ? '--' : `${value.toFixed(1)}h`
}

function percent(rate: number | null) {
  return rate === null ? '--' : `${Math.round(rate * 100)}%`
}

export default function ModeratorDashboard() {
  const [days, setDays] = useState<number>(30)
  const summary = useModeratorDashboard()
  const performance = useModeratorPerformance(days)

  const counts = summary.data
  const metrics = performance.data

  return (
    <div className="space-y-6">
      <PageHeader
        title="Moderator Dashboard"
        subtitle="Work the queue to its deadlines, and see how the team is keeping up."
      />

      {summary.isDemo && (
        <div className="p-3 rounded-2xl text-xs flex items-center gap-2 bg-surface-mute border border-line text-ink-soft">
          <AlertTriangle className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
          Showing demo data. Set <code className="fc-kbd">VITE_USE_API=true</code> for live figures.
        </div>
      )}

      {summary.loading && (
        <div className="fc-card p-10 text-center text-ink-faint">
          <Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin" />
          <p className="text-xs font-semibold">Loading the overview...</p>
        </div>
      )}

      {!summary.loading && summary.error && (
        <div className="fc-card p-10 text-center">
          <AlertTriangle className="w-7 h-7 mx-auto mb-3 text-[#EF4444]" />
          <p className="text-xs font-semibold text-ink">{summary.error}</p>
          <button
            type="button" onClick={summary.reload}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#FB923C] hover:underline cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />Try again
          </button>
        </div>
      )}

      {!summary.loading && !summary.error && counts === null && (
        <div className="fc-card p-10 text-center text-ink-faint">
          <p className="text-xs font-semibold text-ink">No organization to moderate.</p>
          <p className="text-[10px] mt-1">
            Moderation is organization-scoped; ask an owner to invite you as a moderator.
          </p>
        </div>
      )}

      {counts && (
        <>
          {/* Service level first: these are the numbers that need acting on today. */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Figure
              label="Overdue"
              value={counts.overdue.toLocaleString()}
              tone={counts.overdue > 0 ? 'text-[#EF4444]' : 'text-[#10B981]'}
              hint={`Past the ${counts.sla_hours}h review deadline`}
            />
            <Figure
              label="Due soon"
              value={counts.due_soon.toLocaleString()}
              tone={counts.due_soon > 0 ? 'text-[#F59E0B]' : 'text-ink'}
              hint="Deadline approaching"
            />
            <Figure
              label="Unassigned"
              value={counts.unassigned.toLocaleString()}
              tone="text-accent"
              hint="Nobody has picked these up"
            />
            <Figure
              label="Oldest waiting"
              value={counts.oldest_open_age_hours === null ? '--' : `${counts.oldest_open_age_hours.toFixed(1)}h`}
              hint="Longest a review has been open"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Figure label="Pending" value={counts.pending.toLocaleString()} tone="text-accent" />
            <Figure label="In review" value={counts.in_review.toLocaleString()} hint={`${counts.claimed_now} held right now`} />
            <Figure label="Escalated" value={counts.escalated.toLocaleString()} tone="text-[#F59E0B]" />
            <Figure label="Decided today" value={counts.completed_today.toLocaleString()} tone="text-emerald-400" />
          </div>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <ChartCard
            title="Team performance"
            subtitle="Decision time is measured from when a review arrived, not from when it was picked up"
          >
            <div className="flex gap-2 mb-4">
              {WINDOWS.map(window => (
                <button
                  key={window}
                  type="button"
                  onClick={() => setDays(window)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    days === window
                      ? 'bg-accent-tint text-accent-soft border border-accent/25'
                      : 'text-ink-mute hover:text-ink border border-line'
                  }`}
                >
                  {window} days
                </button>
              ))}
            </div>

            {performance.loading && (
              <div className="text-center py-10 text-ink-faint">
                <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin" />
                <p className="text-xs">Loading performance...</p>
              </div>
            )}

            {!performance.loading && performance.error && (
              <p className="text-xs text-[#F87171] py-6 text-center">{performance.error}</p>
            )}

            {!performance.loading && !performance.error && metrics && metrics.moderators.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full fc-table text-left">
                  <thead>
                    <tr>
                      <th>Moderator</th>
                      <th>Decided</th>
                      <th>Approved</th>
                      <th>Rejected</th>
                      <th>On time</th>
                      <th>Average</th>
                      <th>Slowest</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.moderators.map(row => (
                      <tr key={row.moderator_id} className="hover:bg-surface-mute transition-colors">
                        <td className="font-bold text-ink text-xs">{row.username}</td>
                        <td className="text-xs text-ink-soft">{row.decided_count}</td>
                        <td className="text-xs text-emerald-400">{row.approved}</td>
                        <td className="text-xs text-accent-soft">{row.rejected}</td>
                        <td className="text-xs">
                          <span className={
                            row.on_time_rate === null ? 'text-ink-faint'
                              : row.on_time_rate >= 0.9 ? 'text-[#10B981]'
                              : row.on_time_rate >= 0.6 ? 'text-[#F59E0B]' : 'text-[#EF4444]'
                          }>
                            {percent(row.on_time_rate)}
                          </span>
                          {row.late > 0 && (
                            <span className="text-[10px] text-ink-faint ml-1">({row.late} late)</span>
                          )}
                        </td>
                        <td className="text-xs font-mono text-ink-soft">{hours(row.average_decision_hours)}</td>
                        <td className="text-xs font-mono text-ink-faint">{hours(row.slowest_decision_hours)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!performance.loading && !performance.error
              && metrics && metrics.moderators.length === 0 && (
              <p className="text-xs text-ink-faint py-10 text-center">
                No decisions in the last {days} days.
              </p>
            )}
          </ChartCard>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <ChartCard title="Totals" subtitle={`Across the last ${days} days`}>
            <div className="p-4 rounded-3xl bg-surface-mute border border-line space-y-3.5 text-xs text-ink-mute">
              <div className="flex justify-between">
                <span>Decisions recorded:</span>
                <span className="font-bold text-ink">{metrics?.totals.decided_count ?? '--'}</span>
              </div>
              <div className="flex justify-between">
                <span>Met the deadline:</span>
                <span className="font-bold text-emerald-400">{percent(metrics?.totals.on_time_rate ?? null)}</span>
              </div>
              <div className="flex justify-between">
                <span>Average decision time:</span>
                <span className="font-bold text-ink">{hours(metrics?.totals.average_decision_hours ?? null)}</span>
              </div>
              <div className="flex justify-between">
                <span>Open right now:</span>
                <span className="font-bold text-accent">{metrics?.totals.open_now ?? '--'}</span>
              </div>
              <div className="flex justify-between">
                <span>Overdue right now:</span>
                <span className={`font-bold ${(metrics?.totals.overdue_now ?? 0) > 0 ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
                  {metrics?.totals.overdue_now ?? '--'}
                </span>
              </div>
            </div>

            <Link
              to="/moderator/queue"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#FB923C] hover:underline"
            >
              Open the queue <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </ChartCard>
        </div>
      </div>
    </div>
  )
}
