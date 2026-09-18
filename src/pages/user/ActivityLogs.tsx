import { useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { SearchInput } from '../../components/ui/SearchInput'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { mockActivity } from '../../data/mock'
import { formatDateTime } from '../../lib/utils'

const TYPE_FILTERS = ['All', 'upload', 'enhance', 'validate', 'download', 'live', 'group', 'reject']

export default function ActivityLogs() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')

  const filtered = mockActivity.filter(event => {
    const matchSearch = event.message.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'All' || event.type === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="page-enter">
      <PageHeader title="Activity Logs" subtitle="Complete history of your uploads, enhancements, and downloads." />

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <SearchInput placeholder="Search logs…" value={search} onChange={e => setSearch(e.target.value)} className="w-64" />
        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map(f => {
            const isActive = filter === f
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all capitalize cursor-pointer"
                style={{
                  background: isActive ? 'rgba(79,70,229, 0.14)' : '#F1F3F7',
                  border: isActive ? '1px solid rgba(79,70,229, 0.24)' : '1px solid #E6E9EF',
                  color: isActive ? '#6366F1' : '#64748B',
                  boxShadow: isActive ? '0 0 15px rgba(79,70,229, 0.1)' : 'none',
                }}
              >
                {f}
              </button>
            )
          })}
        </div>
      </div>

      <div className="fc-card overflow-hidden">
        <div className="divide-y divide-line">
          {filtered.map(event => (
            <div key={event.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-mute transition-colors">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{
                background: event.status === 'success' ? '#059669' :
                            event.status === 'error' ? '#DC2626' :
                            event.status === 'warning' ? '#B45309' : '#6366F1'
              }} />
              <div className="flex-1">
                <p className="text-sm text-ink-soft">{event.message}</p>
                <p className="text-xs text-ink-faint mt-1 font-mono">{formatDateTime(event.timestamp)}</p>
              </div>
              <StatusBadge
                status={event.status === 'success' ? 'success' : event.status === 'error' ? 'error' : event.status === 'warning' ? 'warning' : 'info'}
                label={event.type}
                dot={false}
              />
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-ink-faint">No activity logs found.</div>
          )}
        </div>
      </div>
    </div>
  )
}
