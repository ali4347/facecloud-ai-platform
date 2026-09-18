import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { mockRejectionStats } from '../../data/mock'
import { AlertTriangle } from 'lucide-react'

export default function RejectionSummary() {
  const stats = mockRejectionStats

  return (
    <div className="space-y-6 page-enter">
      <PageHeader 
        title="Rejection Summary Analytics"
        subtitle="Analyze biometric rejection rates, failure reasons, and daily reject counts."
      />

      {/* Cards row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Rejected Images', value: stats.totalRejected.toLocaleString(), color: 'text-[#EF4444]' },
          { label: 'Overall Rejection Rate', value: `${stats.rejectionRate}%`, color: 'text-[#FCD34D]' },
          { label: 'Most Common Failure Node', value: stats.reasons[0].name, color: 'text-[#FB923C]' }
        ].map(item => (
          <div key={item.label} className="fc-card p-6 space-y-2">
            <span className="text-[10px] text-ink-mute font-bold uppercase tracking-wider block">{item.label}</span>
            <span className={`text-lg font-bold block ${item.color}`}>{item.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Rejection Reasons Distribution */}
        <div className="lg:col-span-5 space-y-6">
          <ChartCard title="Rejection Reason Breakdown" subtitle="Distribution of failure types">
            <div className="space-y-4">
              {stats.reasons.map(reason => {
                const total = stats.reasons.reduce((acc, r) => acc + r.value, 0)
                const percent = Math.round((reason.value / total) * 100)
                return (
                  <div key={reason.name} className="p-4 rounded-3xl bg-surface-mute border border-line space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-ink">{reason.name}</span>
                      <span className="font-bold text-ink-mute">{reason.value.toLocaleString()} files ({percent}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-mute rounded-full overflow-hidden">
                      <div 
                        className="h-full" 
                        style={{ width: `${percent}%`, backgroundColor: reason.color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </ChartCard>
        </div>

        {/* Right Column: Rejections Over Time */}
        <div className="lg:col-span-7 space-y-6">
          <ChartCard title="Daily Rejections (Past 7 Days)" subtitle="Total files rejected by quality checks">
            <div className="space-y-4">
              <div className="space-y-3.5 pt-2">
                {stats.rejectionsPerDay.map(day => {
                  return (
                    <div key={day.date} className="grid grid-cols-12 items-center gap-3 text-xs">
                      <span className="col-span-2 font-bold text-ink-soft">{day.date}</span>
                      <div className="col-span-8 flex h-4 bg-surface-mute rounded overflow-hidden">
                        <div 
                          className="bg-[#EF4444]" 
                          style={{ width: `${(day.count / 40) * 100}%` }} // Scale relative to 40 max
                        />
                      </div>
                      <span className="col-span-2 text-right font-bold text-ink">{day.count} files</span>
                    </div>
                  )
                })}
              </div>

              <div
                className="p-4 rounded-3xl border flex gap-3 text-xs"
                style={{
                  background: 'rgba(239,68,68,0.06)',
                  borderColor: 'rgba(239,68,68,0.20)',
                  color: 'rgb(var(--a-ink-mute))'
                }}
              >
                <AlertTriangle className="w-5 h-5 text-[#EF4444] flex-shrink-0" />
                <p className="leading-relaxed">
                  Rejection summaries indicate that 35% of failure events occur due to face sizes failing to meet the minimum threshold of 64×64 pixels.
                </p>
              </div>

            </div>
          </ChartCard>
        </div>

      </div>
    </div>
  )
}
