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
                  <stop offset="5%" stopColor="#F97316" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gEnhanced" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EA580C" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#EA580C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.55)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.55)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'rgba(5,7,10,0.95)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px', fontSize: '11px', color: '#fff' }} />
              <Area type="monotone" dataKey="uploads" stroke="#F97316" fill="url(#gUploads)" strokeWidth={2} name="Uploads" />
              <Area type="monotone" dataKey="enhanced" stroke="#EA580C" fill="url(#gEnhanced)" strokeWidth={2} name="Enhanced" />
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
            <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-full bg-gradient-to-r from-[#F97316] to-[#4FFFB0] rounded-full transition-all"
                style={{ width: `${storagePercent}%` }}
              />
            </div>
          </div>
          <span className="text-sm font-bold text-white">{storagePercent}%</span>
        </div>
        <div className="grid grid-cols-4 gap-3 mt-4">
          {[
            { label: 'Original', value: '6.2 GB', color: 'bg-[#F97316]' },
            { label: 'Enhanced', value: '5.8 GB', color: 'bg-[#EA580C]' },
            { label: 'ZIP Archives', value: '2.1 GB', color: 'bg-[#FB923C]' },
            { label: 'Snapshots', value: '1.2 GB', color: 'bg-[#4FFFB0]' },
          ].map(item => (
            <div key={item.label} className="text-center p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08]">
              <div className={`w-3 h-3 ${item.color} rounded-full mx-auto mb-1.5`} />
              <p className="text-sm font-bold text-white">{item.value}</p>
              <p className="text-[10px] text-white/40">{item.label}</p>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  )
}
