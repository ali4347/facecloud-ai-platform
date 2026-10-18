import { useState } from 'react'
import { Users, Upload, Zap, XCircle, Camera, TrendingUp, HardDrive, Activity } from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { ChartCard } from '../../components/ui/ChartCard'
import { PageHeader } from '../../components/layout/PageHeader'
import { RejectionReasonChart } from '../../components/features/RejectionReasonChart'
import { AsyncGate } from '../../components/admin/AsyncGate'
import { RangeChips } from '../../components/admin/RangeChips'
import { percentOrDash, reasonSlices, trendRows, useAdminAnalytics, type RangeDays } from '../../lib/adminAnalytics'
import { formatBytes } from '../../lib/imageData'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

/** formatBytes writes zero as "--", which reads as unknown; an empty store is a real 0 B. */
const size = (bytes: number) => (bytes ? formatBytes(bytes) : '0 B')

export default function AdminOverview() {
  const [days, setDays] = useState<RangeDays>(30)
  const state = useAdminAnalytics(days)

  return (
    <div>
      <PageHeader title="Admin Overview" subtitle="System-wide statistics and health at a glance." />
      <RangeChips value={days} onChange={setDays} />

      <AsyncGate state={state} what="the overview">
        {a => {
          const overview = a.overview
          const change = overview?.change_vs_previous_period
          const completed = a.totals.enhancements.by_status.completed ?? 0
          const storage = overview?.storage
          const slices = reasonSlices(a)
          return (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard title="Total Users" value={a.totals.users.total.toLocaleString()} icon={Users} gradient="blue" delay={0} />
                <StatCard title={`Uploads (last ${days} days)`} value={(overview?.uploads.total ?? a.totals.images.total).toLocaleString()} icon={Upload}
                  gradient="purple" change={change?.uploads_percent} delay={0.05} />
                <StatCard title="Enhanced Images" value={completed.toLocaleString()} icon={Zap} gradient="teal"
                  change={change?.enhancements_percent} delay={0.1} />
                <StatCard title="Rejected" value={overview ? overview.rejections.total.toLocaleString() : '—'} icon={XCircle} gradient="emerald"
                  change={change?.rejections_percent} delay={0.15} />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard title="Live Sessions" value={overview ? overview.live_sessions.total.toLocaleString() : '—'} icon={Camera}
                  gradient="blue" change={change?.live_sessions_percent} delay={0.2} />
                <StatCard title="Quality pass rate" value={percentOrDash(a.success_rate_percent)} icon={TrendingUp} gradient="purple" delay={0.25} />
                <StatCard title="Rejection Rate" value={percentOrDash(overview?.rejections.rate_percent)} icon={Activity} gradient="teal" delay={0.3} />
                <StatCard title="Storage Used" value={formatBytes(a.storage_bytes.total)} icon={HardDrive} gradient="emerald" delay={0.35} />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">
                <ChartCard title="Upload Trend" subtitle={`Daily, last ${days} days: uploads, enhanced, rejected`} className="xl:col-span-2" delay={0.1}>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={trendRows(a)}>
                      <defs>
                        <linearGradient id="gUploads" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F97316" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gEnhanced" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EA580C" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#EA580C" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--a-line))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgb(var(--a-ink-mute))' }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'rgb(var(--a-ink-mute))' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: 'rgb(var(--a-surface))', border: '1px solid rgb(var(--a-line))', borderRadius: '16px', fontSize: '11px', color: 'rgb(var(--a-ink))' }} />
                      <Area type="monotone" dataKey="uploads" stroke="#F97316" fill="url(#gUploads)" strokeWidth={2} name="Uploads" />
                      <Area type="monotone" dataKey="enhanced" stroke="#EA580C" fill="url(#gEnhanced)" strokeWidth={2} name="Enhanced" />
                      <Area type="monotone" dataKey="rejected" stroke="#EF4444" fill="none" strokeWidth={1.5} strokeDasharray="4 2" name="Rejected" />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Rejection Reasons" subtitle="How often each reason was recorded" delay={0.15}>
                  <RejectionReasonChart data={slices.map(s => ({ name: s.name, value: s.count, color: s.color }))} />
                </ChartCard>
              </div>

              {/* The gauge needs a capacity, which object storage does not have; the breakdown is always real. */}
              <ChartCard
                title="Storage Usage"
                subtitle={storage?.capacity_bytes ? `${formatBytes(a.storage_bytes.total)} used of ${formatBytes(storage.capacity_bytes)} on this disk` : `${formatBytes(a.storage_bytes.total)} used`}
                delay={0.2}
              >
                {storage?.capacity_bytes != null && storage.used_percent != null && (
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1">
                      <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgb(var(--a-line))' }}>
                        <div className="h-full bg-gradient-to-r from-[#F97316] to-[#10B981] rounded-full transition-all"
                          style={{ width: `${Math.max(storage.used_percent, storage.used_percent > 0 ? 1 : 0)}%` }} />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-ink">{storage.used_percent}%</span>
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Original photos', value: size(a.storage_bytes.originals), color: 'bg-[#F97316]' },
                    { label: 'Enhanced photos', value: size(a.storage_bytes.enhanced_outputs), color: 'bg-[#EA580C]' },
                    ...(storage ? [
                      { label: 'ZIP packages', value: size(storage.zip_packages_bytes), color: 'bg-[#FB923C]' },
                      { label: 'Camera snapshots (included above)', value: size(storage.camera_snapshots_bytes), color: 'bg-[#10B981]' },
                    ] : []),
                  ].map(item => (
                    <div key={item.label} className="text-center p-3 rounded-2xl bg-surface-mute border border-line">
                      <div className={`w-3 h-3 ${item.color} rounded-full mx-auto mb-1.5`} />
                      <p className="text-sm font-bold text-ink">{item.value}</p>
                      <p className="text-[10px] text-ink-faint">{item.label}</p>
                    </div>
                  ))}
                </div>
              </ChartCard>
            </>
          )
        }}
      </AsyncGate>
    </div>
  )
}
