import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { AsyncGate } from '../../components/admin/AsyncGate'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { OldBackendNotice } from '../../components/admin/OldBackendNotice'
import { FailedWork } from '../../components/admin/FailedWork'
import { formatUptime, jobLabel, serviceNote, useSystemHealth } from '../../lib/adminHealth'
import { CheckCircle2, AlertTriangle, AlertOctagon, Clock, Users, RefreshCw, RotateCw } from 'lucide-react'

const badge = (status: string) => (status === 'operational' ? 'success' : status === 'down' ? 'error' : 'warning')

export default function SystemMonitoring() {
  const state = useSystemHealth()

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="System Services & Health"
        subtitle="Service checks, background workers and the processing queues."
      />

      <AsyncGate state={state} what="the system status">
        {({ health, queue }) => {
          const celery = health.services.find(s => s.key === 'celery')
          // Only jobs that are waiting, running or have ever failed are worth a row.
          const jobs = queue ? Object.entries(queue.jobs) : []
          const waiting = jobs.reduce((sum, [, j]) => sum + j.queued, 0)
          const running = jobs.reduce((sum, [, j]) => sum + j.processing, 0)
          const stats = [
            { title: 'Server running for', value: health.process ? formatUptime(health.process.uptime_seconds) : '—', detail: health.process ? 'Since the backend process last started' : 'Not reported by this backend', icon: Clock, color: '#10B981' },
            { title: 'Background workers', value: celery?.workers === undefined ? '—' : String(celery.workers), detail: celery?.workers === 0 ? 'No worker is running' : 'Counted by the job runner', icon: Users, color: '#A78BFA' },
            { title: 'Jobs waiting', value: queue ? String(waiting) : '—', detail: queue ? `${running} running now` : 'Queue status unavailable', icon: RefreshCw, color: '#FB923C' },
          ]
          return (
            <>
              {health.legacy && <OldBackendNotice what="the server uptime and some service details are not reported" />}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map(stat => (
                  <div key={stat.title} className="fc-card p-6 flex items-center justify-between">
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider block text-ink-mute">{stat.title}</span>
                      <span className="text-lg font-bold text-ink block">{stat.value}</span>
                      <span className="text-[10px] text-ink-faint block">{stat.detail}</span>
                    </div>
                    <div className="p-3 rounded-2xl flex items-center justify-center" style={{ background: 'rgb(var(--a-surface-mute))', border: '1px solid rgb(var(--a-line))' }}>
                      <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                    </div>
                  </div>
                ))}
              </div>

              <ChartCard title="Services" subtitle="One check per service">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {health.services.map(service => (
                    <div key={service.key} className="p-4 rounded-3xl bg-surface-mute border border-line flex items-start justify-between gap-4">
                      <div className="flex gap-3 text-xs">
                        <div className="mt-0.5">
                          {service.status === 'operational' && <CheckCircle2 className="w-5 h-5 text-[#10B981]" />}
                          {service.status === 'degraded' && <AlertTriangle className="w-5 h-5 text-[#FCD34D]" />}
                          {service.status === 'down' && <AlertOctagon className="w-5 h-5 text-[#EF4444]" />}
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-ink">{service.name}</h4>
                          <div className="flex gap-3 text-[10px] text-ink-faint">
                            {service.latency_ms !== null && <span>Check took {service.latency_ms} ms</span>}
                            {service.queue_size !== undefined && <span>Queue: {service.queue_size === null ? 'unknown' : service.queue_size}</span>}
                          </div>
                          {service.detail && <p className="text-[10px] text-ink-faint">{serviceNote(service.detail)}</p>}
                        </div>
                      </div>
                      <StatusBadge status={badge(service.status)} label={service.status} dot={false} />
                    </div>
                  ))}
                </div>
              </ChartCard>

              {queue && (
                <ChartCard title="Processing queues" subtitle={`A job counts as stuck after ${Math.round(queue.processing_stale_after_seconds / 60)} minutes`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-[10px] uppercase tracking-wider text-ink-faint border-b border-line">
                          <th className="py-2 pr-4">Job</th><th className="py-2 pr-4">Waiting</th><th className="py-2 pr-4">Running</th>
                          <th className="py-2 pr-4">Stuck</th><th className="py-2 pr-4">Oldest active</th><th className="py-2">Failed (all time)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {jobs.map(([key, j]) => (
                          <tr key={key} className="text-ink">
                            <td className="py-2 pr-4 font-semibold">{jobLabel(key)}</td>
                            <td className="py-2 pr-4">{j.queued}</td>
                            <td className="py-2 pr-4">{j.processing}</td>
                            <td className={`py-2 pr-4 ${j.stale > 0 ? 'text-[#EF4444] font-bold' : ''}`}>{j.stale}</td>
                            <td className="py-2 pr-4">{j.oldest_active_age_seconds === null ? '—' : formatUptime(j.oldest_active_age_seconds)}</td>
                            <td className="py-2">{j.failed_total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button type="button" onClick={state.reload} className="mt-4 text-xs font-bold text-[#FB923C] hover:underline inline-flex items-center gap-1.5 cursor-pointer">
                    <RotateCw className="w-3.5 h-3.5" />Refresh
                  </button>
                </ChartCard>
              )}
            </>
          )
        }}
      </AsyncGate>

      <FailedWork />
    </div>
  )
}
