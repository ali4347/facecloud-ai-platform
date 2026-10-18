import { useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { RejectionReasonChart } from '../../components/features/RejectionReasonChart'
import { AsyncGate } from '../../components/admin/AsyncGate'
import { RangeChips } from '../../components/admin/RangeChips'
import { reasonSlices, useAdminAnalytics, type RangeDays } from '../../lib/adminAnalytics'

export default function Rejections() {
  const [days, setDays] = useState<RangeDays>(30)
  const state = useAdminAnalytics(days)

  return (
    <div>
      <PageHeader title="Rejection Summary" subtitle="Analysis of image rejections by reason." />
      <RangeChips value={days} onChange={setDays} />

      <AsyncGate state={state} what="the rejection reasons">
        {a => {
          const slices = reasonSlices(a)
          const total = slices.reduce((sum, s) => sum + s.count, 0)
          return (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <ChartCard title="Rejection Reasons" subtitle={`How often each reason was recorded, last ${days} days`} delay={0.05}>
                <RejectionReasonChart data={slices.map(s => ({ name: s.name, value: s.count, color: s.color }))} />
              </ChartCard>

              <ChartCard title="Breakdown by Reason" subtitle="A photo can carry more than one reason" delay={0.1}>
                {slices.length === 0 ? (
                  <p className="text-xs text-ink-mute py-6 text-center">No rejection reasons recorded in this period.</p>
                ) : (
                  <div className="space-y-3 mt-2">
                    {slices.map(item => {
                      const percent = total ? Math.round((item.count / total) * 100) : 0
                      return (
                        <div key={item.code}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: item.color }} />
                              <span className="text-sm text-ink truncate">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <span className="text-xs text-ink-mute">{item.count.toLocaleString()} {item.count === 1 ? 'time' : 'times'}</span>
                              <span className="text-sm font-bold text-ink">{percent}%</span>
                            </div>
                          </div>
                          <div className="h-2 bg-border rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${percent}%`, background: item.color }} />
                          </div>
                          {item.hint && <p className="text-[11px] text-ink-faint mt-1">{item.hint}</p>}
                        </div>
                      )
                    })}
                    <p className="text-[11px] text-ink-faint pt-2">
                      Percentages are each reason's share of all reasons recorded, not of rejected photos.
                    </p>
                  </div>
                )}
              </ChartCard>
            </div>
          )
        }}
      </AsyncGate>
    </div>
  )
}
