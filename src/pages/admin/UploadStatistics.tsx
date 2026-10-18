import { useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { AsyncGate } from '../../components/admin/AsyncGate'
import { RangeChips } from '../../components/admin/RangeChips'
import { shortDate, useAdminAnalytics, type RangeDays } from '../../lib/adminAnalytics'
import { formatBytes } from '../../lib/imageData'
import { FileImage, Files, FolderArchive, ArrowDownRight, ArrowUpRight } from 'lucide-react'

export default function UploadStatistics() {
  const [days, setDays] = useState<RangeDays>(30)
  const state = useAdminAnalytics(days)

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="Upload Statistics"
        subtitle="How many photos came in, by which route, and how big they are."
      />
      <RangeChips value={days} onChange={setDays} />

      <AsyncGate state={state} what="the upload statistics">
        {a => {
          const up = a.overview?.uploads
          if (!up) return <p className="text-xs text-ink-mute">This backend does not report upload statistics yet.</p>
          const change = a.overview?.change_vs_previous_period.uploads_percent
          const types = [
            { label: 'Single Uploads', count: up.by_type.single, icon: FileImage, color: '#FB923C' },
            { label: 'Multiple-photo Uploads', count: up.by_type.multiple, icon: Files, color: '#10B981' },
            { label: 'ZIP Archives', count: up.by_type.zip, icon: FolderArchive, color: '#A78BFA' },
          ]
          const typeTotal = types.reduce((sum, t) => sum + t.count, 0)
          // The last seven days of the window, as the card says.
          const lastDays = up.per_day_by_type.slice(-7)
          return (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: `Photos received (last ${days} days)`, value: up.total.toLocaleString(), sub: change === null || change === undefined ? null : `${change > 0 ? '+' : ''}${change}% vs the period before`, up: (change ?? 0) >= 0 },
                  { label: 'Received today', value: up.recent.today.toLocaleString(), sub: `${up.recent.this_week.toLocaleString()} this week · ${up.recent.this_month.toLocaleString()} this month`, up: true, plain: true },
                  { label: 'Average file size', value: up.average_file_size_bytes === null ? '—' : formatBytes(up.average_file_size_bytes), sub: null, up: true },
                  { label: 'ZIP archives', value: up.by_type.zip.toLocaleString(), sub: `Photos that came inside a ZIP, last ${days} days`, up: true, plain: true },
                ].map(item => (
                  <div key={item.label} className="fc-card p-6 space-y-2">
                    <span className="text-[10px] text-ink-mute font-bold uppercase tracking-wider block">{item.label}</span>
                    <span className="text-xl font-bold text-ink block">{item.value}</span>
                    {item.sub && (
                      <span className={`text-[10px] font-semibold flex items-center gap-1 ${item.plain ? 'text-ink-mute' : item.up ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                        {!item.plain && (item.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />)}{item.sub}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 space-y-6">
                  <ChartCard title="How photos arrive" subtitle="Share of photos by upload route">
                    <div className="space-y-4">
                      {types.map(item => {
                        const percent = typeTotal ? Math.round((item.count / typeTotal) * 100) : 0
                        return (
                          <div key={item.label} className="p-4 rounded-3xl bg-surface-mute border border-line space-y-3">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <item.icon className="w-4 h-4" style={{ color: item.color }} />
                                <span className="font-bold text-ink">{item.label}</span>
                              </div>
                              <span className="font-bold text-ink">{item.count.toLocaleString()} photos ({percent}%)</span>
                            </div>
                            <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                              <div className="h-full" style={{ width: `${percent}%`, background: item.color }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </ChartCard>
                </div>

                <div className="lg:col-span-7 space-y-6">
                  <ChartCard title="Daily intake (last 7 days)" subtitle="Photos received each day, by route">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 text-[10px] font-bold text-ink-faint pb-2 border-b border-line">
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#F97316] rounded" /> Single</div>
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#10B981] rounded" /> Multiple</div>
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#EA580C] rounded" /> ZIP</div>
                      </div>
                      <div className="space-y-3.5 pt-2">
                        {lastDays.map(day => {
                          const dayTotal = day.single + day.multiple + day.zip
                          const share = (n: number) => (dayTotal ? (n / dayTotal) * 100 : 0)
                          return (
                            <div key={day.date} className="grid grid-cols-12 items-center gap-3 text-xs">
                              <span className="col-span-2 font-bold text-ink-soft">{shortDate(day.date)}</span>
                              <div className="col-span-8 flex h-4 rounded overflow-hidden bg-surface-mute">
                                <div className="bg-[#F97316]" style={{ width: `${share(day.single)}%` }} />
                                <div className="bg-[#10B981]" style={{ width: `${share(day.multiple)}%` }} />
                                <div className="bg-[#EA580C]" style={{ width: `${share(day.zip)}%` }} />
                              </div>
                              <span className="col-span-2 text-right font-bold text-ink">{dayTotal} {dayTotal === 1 ? 'photo' : 'photos'}</span>
                            </div>
                          )
                        })}
                      </div>
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
