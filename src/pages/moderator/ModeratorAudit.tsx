import { useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { mockModeratorAudit } from '../../data/mock'
import { formatDateTime } from '../../lib/utils'
import { ShieldCheck } from 'lucide-react'

function getCategory(action: string): 'member' | 'review' | 'batch' | 'report' | 'system' {
  const act = action.toLowerCase()
  if (act.includes('member') || act.includes('invite') || act.includes('deactivate') || act.includes('reactivate') || act.includes('remove')) return 'member'
  if (act.includes('approve') || act.includes('reject') || act.includes('duplicate') || act.includes('correct') || act.includes('escalate')) return 'review'
  if (act.includes('batch') || act.includes('ingest') || act.includes('reprocess') || act.includes('retry') || act.includes('cancel')) return 'batch'
  if (act.includes('report') || act.includes('export') || act.includes('download')) return 'report'
  return 'system'
}

const CATEGORY_COLORS = {
  member: 'bg-violet-500/10 text-violet-700 border-violet-300/20',
  review: 'bg-[#4F46E5]/10 text-[#6366F1] border-[#4F46E5]/20',
  batch: 'bg-[#059669]/10 text-[#059669] border-[#059669]/20',
  report: 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/20',
  system: 'bg-surface-mute text-ink-mute border-line'
}

export default function ModeratorAudit() {
  const [logs] = useState(mockModeratorAudit)

  return (
    <div className="space-y-6 page-enter">
      <PageHeader 
        title="Moderator Action Audit"
        subtitle="Immutable audit log trail of manual queue overrides, batch controls, and user adjustments."
      />

      <ChartCard title="Action Audit Feed" subtitle="Continuous records log (Read-Only)">
        <div className="overflow-x-auto">
          <table className="w-full fc-table text-left">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor (Moderator)</th>
                <th>Category</th>
                <th>Action</th>
                <th>Target</th>
                <th>Override Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => {
                const category = getCategory(log.action)
                const badgeColor = CATEGORY_COLORS[category]

                return (
                  <tr key={log.id} className="hover:bg-surface-mute transition-colors">
                    <td>
                      <span className="text-xs text-ink-faint font-mono">{formatDateTime(log.timestamp)}</span>
                    </td>
                    <td>
                      <span className="text-xs font-bold text-ink">{log.moderatorName}</span>
                    </td>
                    <td>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${badgeColor}`}>
                        {category}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-semibold text-ink-soft">{log.action}</span>
                    </td>
                    <td>
                      <span className="text-xs font-mono text-ink-mute">{log.filename || '—'}</span>
                    </td>
                    <td>
                      <p className="text-xs text-ink-mute leading-relaxed max-w-xs">{log.reason}</p>
                    </td>
                  </tr>
                )}
              )}
            </tbody>
          </table>
        </div>

        {logs.length === 0 && (
          <div className="text-center py-16 text-ink-faint">
            <ShieldCheck className="w-8 h-8 mx-auto mb-3 opacity-30 animate-pulse" />
            <p className="text-xs font-semibold">Audit trail is empty.</p>
          </div>
        )}
      </ChartCard>
    </div>
  )
}
