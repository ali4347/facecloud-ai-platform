import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { SearchInput } from '../../components/ui/SearchInput'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { AsyncGate } from '../../components/admin/AsyncGate'
import { mockAuditLogs } from '../../data/mock'
import { getAudit, type AuditPage, type AuditRow } from '../../lib/api/adminSystem'
import { useApiResource } from '../../lib/useApiResource'
import { formatDateTime } from '../../lib/utils'

const PAGE_SIZE = 25

const roleBadge = (role: string) => (role === 'admin' ? 'purple' : role === 'moderator' ? 'warning' : 'info')

function demoPage(): AuditPage {
  return {
    page: 1, page_size: PAGE_SIZE, has_next: false,
    results: mockAuditLogs.map((log, i): AuditRow => ({
      source: 'demo', id: i + 1, category: 'demo', event: log.action, ip_address: null, created_at: log.timestamp,
      actor: null, actor_name: log.actor, actor_role: log.role, type: 'demo', status: 'info', message: log.action, resource: log.resource,
    })),
  }
}

export default function AuditLogs() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const state = useApiResource(signal => getAudit(page, PAGE_SIZE, signal), demoPage, [page])

  return (
    <div className="page-enter">
      <PageHeader title="Audit Logs" subtitle="Record of sign-ins, account actions and system events, newest first." />

      <AsyncGate state={state} what="the audit log">
        {data => {
          const needle = search.trim().toLowerCase()
          // The API pages the log but does not search it, so this narrows the page on screen only.
          const rows = needle
            ? data.results.filter(r => [r.actor_name, r.message, r.resource, r.type].some(v => v.toLowerCase().includes(needle)))
            : data.results
          return (
            <>
              <div className="flex items-center gap-3 mb-5">
                <SearchInput placeholder="Search this page…" value={search} onChange={e => setSearch(e.target.value)} className="w-72" />
              </div>
              <div className="fc-card overflow-hidden">
                <div className="divide-y divide-line">
                  {rows.map(log => (
                    <div key={`${log.source}-${log.id}`} className="flex items-start gap-4 px-5 py-4 hover:bg-surface-mute transition-colors">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #EA580C, #F97316)', boxShadow: '0 0 15px rgba(234,88,12,0.2)' }}
                      >
                        {(log.actor_name || '?').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-ink">{log.actor_name || 'Unknown'}</span>
                          {log.actor_role
                            ? <StatusBadge status={roleBadge(log.actor_role)} label={log.actor_role.charAt(0).toUpperCase() + log.actor_role.slice(1)} dot={false} />
                            : <StatusBadge status="muted" label="Not signed in" dot={false} />}
                          <StatusBadge status={log.status} label={log.status === 'error' ? 'Failed' : log.status === 'warning' ? 'Warning' : log.status === 'success' ? 'OK' : 'Info'} />
                        </div>
                        <p className="text-sm text-ink-soft mt-0.5">{log.message}</p>
                        <p className="text-xs text-ink-faint mt-1 font-mono">
                          {formatDateTime(log.created_at)}
                          {log.resource && <> · {log.resource}</>}
                          {log.ip_address && <> · {log.ip_address}</>}
                        </p>
                      </div>
                    </div>
                  ))}
                  {rows.length === 0 && (
                    <div className="py-12 text-center text-sm text-ink-faint">{needle ? 'Nothing on this page matches.' : 'No audit entries yet.'}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 text-xs text-ink-mute">
                <span>Page {data.page}</span>
                <div className="flex items-center gap-2">
                  <button type="button" disabled={data.page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-xl border border-line bg-surface disabled:opacity-40 cursor-pointer disabled:cursor-default flex items-center gap-1">
                    <ChevronLeft className="w-3.5 h-3.5" />Newer
                  </button>
                  <button type="button" disabled={!data.has_next} onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 rounded-xl border border-line bg-surface disabled:opacity-40 cursor-pointer disabled:cursor-default flex items-center gap-1">
                    Older<ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          )
        }}
      </AsyncGate>
    </div>
  )
}
