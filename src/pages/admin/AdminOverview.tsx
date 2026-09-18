import { Users, Upload, Zap, XCircle, Camera, TrendingUp, HardDrive, Activity } from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { ChartCard } from '../../components/ui/ChartCard'
import { PageHeader } from '../../components/layout/PageHeader'
import { RejectionReasonChart } from '../../components/features/RejectionReasonChart'
import { adminStats, uploadTrendData } from '../../data/mock'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

export default function AdminOverview() {
  const storagePercent = Math.round((adminStats.storageUsedGB / adminStats.storageTotalGB) * 100)

  return (
    <div>
      <PageHeader title="Admin Overview" subtitle="System-wide statistics and health at a glance." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Users" value={adminStats.totalUsers.toLocaleString()} icon={Users} gradient="blue" change={8} delay={0} />
        <StatCard title="Total Uploads" value={adminStats.totalUploads.toLocaleString()} icon={Upload} gradient="purple" change={15} delay={0.05} />
        <StatCard title="Enhanced Images" value={adminStats.enhancedImages.toLocaleString()} icon={Zap} gradient="teal" change={12} delay={0.1} />
        <StatCard title="Rejected" value={adminStats.rejectedImages.toLocaleString()} icon={XCircle} gradient="emerald" change={-5} delay={0.15} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Live Sessions" value={adminStats.liveSessions} icon={Camera} gradient="blue" delay={0.2} />
        <StatCard title="Success Rate" value={`${adminStats.successRate}%`} icon={TrendingUp} gradient="purple" delay={0.25} />
        <StatCard title="Rejection Rate" value={`${adminStats.rejectionRate}%`} icon={Activity} gradient="teal" delay={0.3} />
        <StatCard title="Storage Used" value={`${adminStats.storageUsedGB} GB`} icon={HardDrive} gradient="emerald" delay={0.35} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">
        <ChartCard title="Upload Trend" subtitle="Last 8 weeks — uploads, enhanced, rejected" className="xl:col-span-2" delay={0.1}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={uploadTrendData}>
              <defs>
                <linearGradient id="gUploads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gEnhanced" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4338CA" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4338CA" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E6E9EF" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E6E9EF', borderRadius: '16px', fontSize: '11px', color: '#0F172A' }} />
              <Area type="monotone" dataKey="uploads" stroke="#4F46E5" fill="url(#gUploads)" strokeWidth={2} name="Uploads" />
              <Area type="monotone" dataKey="enhanced" stroke="#4338CA" fill="url(#gEnhanced)" strokeWidth={2} name="Enhanced" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Rejection Reasons" subtitle="Distribution of rejection types" delay={0.15}>
          <RejectionReasonChart />
        </ChartCard>
      </div>

      {/* Storage gauge */}
      <ChartCard title="Storage Usage" subtitle={`${adminStats.storageUsedGB} GB used of ${adminStats.storageTotalGB} GB`} delay={0.2}>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-3 rounded-full overflow-hidden" style={{ background: '#E6E9EF' }}>
              <div
                className="h-full bg-gradient-to-r from-[#4F46E5] to-[#059669] rounded-full transition-all"
                style={{ width: `${storagePercent}%` }}
              />
            </div>
          </div>
          <span className="text-sm font-bold text-ink">{storagePercent}%</span>
        </div>
        <div className="grid grid-cols-4 gap-3 mt-4">
          {[
            { label: 'Original', value: '6.2 GB', color: 'bg-[#4F46E5]' },
            { label: 'Enhanced', value: '5.8 GB', color: 'bg-[#4338CA]' },
            { label: 'ZIP Archives', value: '2.1 GB', color: 'bg-[#6366F1]' },
            { label: 'Snapshots', value: '1.2 GB', color: 'bg-[#059669]' },
          ].map(item => (
            <div key={item.label} className="text-center p-3 rounded-2xl bg-surface-mute border border-line">
              <div className={`w-3 h-3 ${item.color} rounded-full mx-auto mb-1.5`} />
              <p className="text-sm font-bold text-ink">{item.value}</p>
              <p className="text-[10px] text-ink-faint">{item.label}</p>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  )
}
