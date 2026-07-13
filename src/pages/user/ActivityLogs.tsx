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
                  background: isActive ? 'rgba(0, 132, 255, 0.14)' : 'rgba(255, 255, 255, 0.04)',
                  border: isActive ? '1px solid rgba(96, 177, 255, 0.24)' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: isActive ? '#60B1FF' : 'rgba(255, 255, 255, 0.6)',
                  boxShadow: isActive ? '0 0 15px rgba(0, 132, 255, 0.1)' : 'none',
                }}
              >
                {f}
              </button>
            )
          })}
        </div>
      </div>

      <div className="fc-card overflow-hidden">
        <div className="divide-y divide-white/[0.06]">
          {filtered.map(event => (
            <div key={event.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{
                background: event.status === 'success' ? '#4FFFB0' :
                            event.status === 'error' ? '#F87171' :
                            event.status === 'warning' ? '#FCD34D' : '#60B1FF'
              }} />
              <div className="flex-1">
                <p className="text-sm text-white/90">{event.message}</p>
                <p className="text-xs text-white/40 mt-1 font-mono">{formatDateTime(event.timestamp)}</p>
              </div>
              <StatusBadge
                status={event.status === 'success' ? 'success' : event.status === 'error' ? 'error' : event.status === 'warning' ? 'warning' : 'info'}
                label={event.type}
                dot={false}
              />
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-white/40">No activity logs found.</div>
          )}
        </div>
      </div>
    </div>
  )
}
