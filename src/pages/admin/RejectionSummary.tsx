import { useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { AsyncGate } from '../../components/admin/AsyncGate'
import { RangeChips } from '../../components/admin/RangeChips'
import { percentOrDash, reasonSlices, shortDate, useAdminAnalytics, type RangeDays } from '../../lib/adminAnalytics'

export default function RejectionSummary() {
  const [days, setDays] = useState<RangeDays>(30)
  const state = useAdminAnalytics(days)

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="Rejection Summary Analytics"
        subtitle="Rejection rates, the reasons behind them, and daily reject counts."
      />
      <RangeChips value={days} onChange={setDays} />

      <AsyncGate state={state} what="the rejection summary">
        {a => {
          const rej = a.overview?.rejections
          if (!rej) return <p className="text-xs text-ink-mute">This backend does not report rejection statistics yet.</p>
          const slices = reasonSlices(a)
          const reasonTotal = slices.reduce((sum, s) => sum + s.count, 0)
          const daily = rej.per_day.slice(-7)
          const busiest = Math.max(1, ...daily.map(d => d.count))
          return (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: `Rejected photos (last ${days} days)`, value: rej.total.toLocaleString(), color: 'text-[#EF4444]' },
                  { label: 'Overall rejection rate', value: percentOrDash(rej.rate_percent), color: 'text-[#FCD34D]' },
                  { label: 'Most common reason', value: slices[0]?.name ?? '—', color: 'text-[#FB923C]' },
                ].map(item => (
                  <div key={item.label} className="fc-card p-6 space-y-2">
                    <span className="text-[10px] text-ink-mute font-bold uppercase tracking-wider block">{item.label}</span>
                    <span className={`text-lg font-bold block ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 space-y-6">
                  <ChartCard title="Rejection Reason Breakdown" subtitle="How often each reason was recorded">
                    {slices.length === 0 ? (
                      <p className="text-xs text-ink-mute py-6 text-center">No rejection reasons recorded in this period.</p>
                    ) : (
                      <div className="space-y-4">
                        {slices.map(reason => {
                          const percent = reasonTotal ? Math.round((reason.count / reasonTotal) * 100) : 0
                          return (
                            <div key={reason.code} className="p-4 rounded-3xl bg-surface-mute border border-line space-y-3">
                              <div className="flex justify-between items-center text-xs gap-2">
                                <span className="font-bold text-ink">{reason.name}</span>
                                <span className="font-bold text-ink-mute flex-shrink-0">{reason.count.toLocaleString()} ({percent}%)</span>
                              </div>
                              <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                                <div className="h-full" style={{ width: `${percent}%`, backgroundColor: reason.color }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </ChartCard>
                </div>

                <div className="lg:col-span-7 space-y-6">
                  <ChartCard title="Daily Rejections (last 7 days)" subtitle="Photos turned away by the quality checks">
                    <div className="space-y-3.5 pt-2">
                      {daily.map(day => (
                        <div key={day.date} className="grid grid-cols-12 items-center gap-3 text-xs">
                          <span className="col-span-2 font-bold text-ink-soft">{shortDate(day.date)}</span>
                          <div className="col-span-8 flex h-4 bg-surface-mute rounded overflow-hidden">
                            <div className="bg-[#EF4444]" style={{ width: `${(day.count / busiest) * 100}%` }} />
                          </div>
                          <span className="col-span-2 text-right font-bold text-ink">{day.count} {day.count === 1 ? 'photo' : 'photos'}</span>
                        </div>
                      ))}
                    </div>
                  </ChartCard>
                </div>
              </div>
            </>
          )
        }}
      </AsyncGate>
    </div>
  )
}
