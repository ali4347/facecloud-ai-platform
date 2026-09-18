import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { mockServices } from '../../data/mock'
import { CheckCircle2, AlertTriangle, AlertOctagon, Cpu, HardDrive, RefreshCw } from 'lucide-react'

export default function SystemMonitoring() {
  return (
    <div className="space-y-6 page-enter">
      <PageHeader 
        title="System Services & Health"
        subtitle="Monitor cluster usage logs, processing queues, and active GPU enhancement node latencies."
      />

      {/* General Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: 'Global CPU Load', value: '42.8%', detail: '8 Core Thread allocation', icon: Cpu, color: '#FB923C' },
          { title: 'Memory Allocated', value: '11.8 GB / 16 GB', detail: 'RAM buffer allocation', icon: HardDrive, color: '#A78BFA' },
          { title: 'Global Uptime', value: '99.94%', detail: 'Calculated over 30 days', icon: CheckCircle2, color: '#10B981' },
          { title: 'Active Processing Queue', value: '14 files', detail: 'Queue buffer queue count', icon: RefreshCw, color: '#FB923C' }
        ].map(stat => (
          <div key={stat.title} className="fc-card p-6 flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider block text-ink-mute">{stat.title}</span>
              <span className="text-lg font-bold text-ink block">{stat.value}</span>
              <span className="text-[10px] text-ink-faint block">{stat.detail}</span>
            </div>
            <div
              className="p-3 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgb(var(--a-surface-mute))', border: '1px solid rgb(var(--a-line))' }}
            >
              <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* System Services Cards */}
      <ChartCard title="Active Cluster Micro-Services" subtitle="Individual service endpoint checks">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockServices.map(service => (
            <div 
              key={service.name} 
              className="p-4 rounded-3xl bg-surface-mute border border-line flex items-start justify-between gap-4"
            >
              <div className="flex gap-3 text-xs">
                <div className="mt-0.5">
                  {service.status === 'operational' && <CheckCircle2 className="w-5 h-5 text-[#10B981]" />}
                  {service.status === 'degraded' && <AlertTriangle className="w-5 h-5 text-[#FCD34D]" />}
                  {service.status === 'outage' && <AlertOctagon className="w-5 h-5 text-[#EF4444]" />}
                </div>
                
                <div className="space-y-1">
                  <h4 className="font-bold text-ink">{service.name}</h4>
                  <div className="flex gap-3 text-[10px] text-ink-faint">
                    <span>Latency: {service.latency || 'N/A'}</span>
                    <span>CPU: {service.cpuUsage || 'N/A'}</span>
                    <span>RAM: {service.memUsage || 'N/A'}</span>
                  </div>
                  <p className="text-[9px] text-ink-faint">Uptime: {service.uptime} &bull; Queue Size: {service.queueSize || 0}</p>
                </div>
              </div>

              <span className={`badge text-[9px] ${
                service.status === 'operational' ? 'badge-success' : service.status === 'degraded' ? 'badge-warning' : 'badge-error'
              }`}>
                {service.status}
              </span>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  )
}
