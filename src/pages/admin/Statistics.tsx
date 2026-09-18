import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { uploadTrendData, liveSessionData, storageData, enhancementSuccessData } from '../../data/mock'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

export default function Statistics() {
  return (
    <div>
      <PageHeader title="Statistics" subtitle="Detailed analytics for uploads, enhancement, live sessions, and storage." />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ChartCard title="Upload Trend" subtitle="Daily uploads, enhanced, and rejected" delay={0.05}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={uploadTrendData}>
              <defs>
                <linearGradient id="gu2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.52)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.52)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '12px', fontSize: '12px' }} />
              <Legend iconType="circle" iconSize={8} />
              <Area type="monotone" dataKey="uploads" stroke="#2563EB" fill="url(#gu2)" strokeWidth={2} name="Uploads" />
              <Area type="monotone" dataKey="enhanced" stroke="#8B5CF6" fill="none" strokeWidth={2} name="Enhanced" />
              <Area type="monotone" dataKey="rejected" stroke="#EF4444" fill="none" strokeWidth={1.5} strokeDasharray="4 2" name="Rejected" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Enhancement Success Rate" subtitle="Weekly success vs failure" delay={0.1}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={enhancementSuccessData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.52)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.52)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '12px', fontSize: '12px' }} />
              <Legend iconType="circle" iconSize={8} />
              <Bar dataKey="success" fill="#16A34A" radius={[6, 6, 0, 0]} name="Success %" />
              <Bar dataKey="failed" fill="#EF4444" radius={[6, 6, 0, 0]} name="Failed %" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Live Enhancement Sessions" subtitle="Daily session count" delay={0.15}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={liveSessionData} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.52)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.52)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '12px', fontSize: '12px' }} />
              <Bar dataKey="sessions" fill="#38BDF8" radius={[6, 6, 0, 0]} name="Sessions" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Storage Growth" subtitle="GB used over last 7 months" delay={0.2}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={storageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.52)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.52)' }} axisLine={false} tickLine={false} unit=" GB" />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '12px', fontSize: '12px' }} />
              <Line type="monotone" dataKey="gb" stroke="#8B5CF6" strokeWidth={2.5} dot={{ fill: '#8B5CF6', r: 4 }} name="Storage (GB)" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}
