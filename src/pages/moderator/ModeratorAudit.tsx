import { useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { mockModeratorAudit } from '../../data/mock'
import { formatDateTime } from '../../lib/utils'
import { FileCheck } from 'lucide-react'

export default function ModeratorAudit() {
  const [logs] = useState(mockModeratorAudit)

  return (
    <div className="space-y-6 page-enter">
      <PageHeader 
        title="Moderator Action Audit"
        subtitle="Review logs of manual image approvals, cluster modifications and rejections overrides."
      />

      <ChartCard title="Action Audit Feed" subtitle="Continuous records log">
        <div className="overflow-x-auto">
          <table className="w-full fc-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Moderator</th>
                <th>File Asset</th>
                <th>Action details</th>
                <th>Override Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td>
                    <span className="text-xs text-white/40 font-mono">{formatDateTime(log.timestamp)}</span>
                  </td>
                  <td>
                    <span className="text-xs font-bold text-white">{log.moderatorName}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2 text-xs text-white font-bold">
                      <FileCheck className="w-4 h-4 text-[#60B1FF]" />
                      <span>{log.filename}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge text-[9px] ${
                      log.action.includes('Approve') ? 'badge-success' : 'badge-error'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <p className="text-xs text-white/70 leading-relaxed max-w-xs">{log.reason}</p>
                  </td>
                  <td>
                    <span className="text-[10px] text-[#4FFFB0] font-bold uppercase tracking-wider">User Notified</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  )
}
