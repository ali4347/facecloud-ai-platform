import { useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { SearchInput } from '../../components/ui/SearchInput'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { mockAuditLogs } from '../../data/mock'
import { formatDateTime } from '../../lib/utils'

export default function AuditLogs() {
  const [search, setSearch] = useState('')
  const filtered = mockAuditLogs.filter(log =>
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.actor.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page-enter">
      <PageHeader title="Audit Logs" subtitle="Complete record of all admin, moderator, and user actions." />
      <div className="flex items-center gap-3 mb-5">
        <SearchInput placeholder="Search logs…" value={search} onChange={e => setSearch(e.target.value)} className="w-72" />
      </div>
      <div className="fc-card overflow-hidden">
        <div className="divide-y divide-line">
          {filtered.map(log => (
            <div key={log.id} className="flex items-start gap-4 px-5 py-4 hover:bg-surface-mute transition-colors">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-ink text-xs font-bold flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #EA580C, #F97316)',
                  boxShadow: '0 0 15px rgba(234,88,12,0.2)',
                }}
              >
                {log.actor.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-ink">{log.actor}</span>
                  <StatusBadge
                    status={log.role === 'admin' ? 'purple' : log.role === 'moderator' ? 'warning' : 'info'}
                    label={log.role.charAt(0).toUpperCase() + log.role.slice(1)}
                    dot={false}
                  />
                </div>
                <p className="text-sm text-ink-soft mt-0.5">{log.action}</p>
                <p className="text-xs text-ink-faint mt-1 font-mono">{formatDateTime(log.timestamp)}</p>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-ink-faint">No audit logs found.</div>
          )}
        </div>
      </div>
    </div>
  )
}
