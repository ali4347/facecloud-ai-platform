import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { CheckCircle, XCircle, MoveRight } from 'lucide-react'
import { mockAuditLogs } from '../../data/mock'
import { formatDateTime } from '../../lib/utils'

const modLogs = mockAuditLogs.filter(l => l.role === 'moderator')

export default function ModerationLogs() {
  return (
    <div>
      <PageHeader title="Moderation Logs" subtitle="History of all moderation actions — approvals, rejections, and moves." />

      {/* Today stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Approved Today', value: 4, icon: CheckCircle, color: 'text-success', bg: 'bg-[#059669]/15' },
          { label: 'Rejected Today', value: 2, icon: XCircle, color: 'text-error', bg: 'bg-[#DC2626]/15' },
          { label: 'Moved Today', value: 1, icon: MoveRight, color: 'text-accent', bg: 'bg-[#4F46E5]/15' },
        ].map(stat => (
          <div key={stat.label} className="fc-card p-4 text-center">
            <div className={`w-10 h-10 ${stat.bg} rounded-2xl flex items-center justify-center mx-auto mb-2`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-ink">{stat.value}</p>
            <p className="text-xs text-ink-mute">{stat.label}</p>
          </div>
        ))}
      </div>

      <ChartCard title="Review History" subtitle="All moderation actions" delay={0.1}>
        <div className="divide-y divide-border">
          {modLogs.map(log => (
            <div key={log.id} className="flex items-center gap-4 py-3 hover:bg-background -mx-6 px-6 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-[#D97706]/15 flex items-center justify-center text-warning text-xs font-bold flex-shrink-0">
                {log.actor.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1">
                <p className="text-sm text-ink">{log.action}</p>
                <p className="text-xs text-ink-mute mt-0.5">{log.actor} · {formatDateTime(log.timestamp)}</p>
              </div>
              <StatusBadge
                status={log.action.includes('Approved') ? 'success' : log.action.includes('Rejected') ? 'error' : 'purple'}
                label={log.action.includes('Approved') ? 'Approved' : log.action.includes('Rejected') ? 'Rejected' : 'Moved'}
                dot={false}
              />
            </div>
          ))}
          {modLogs.length === 0 && (
            <p className="py-8 text-center text-sm text-ink-mute">No moderation logs yet.</p>
          )}
        </div>
      </ChartCard>
    </div>
  )
}
