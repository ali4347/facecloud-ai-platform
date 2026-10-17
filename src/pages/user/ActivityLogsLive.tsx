import { useState } from 'react'
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { SearchInput } from '../../components/ui/SearchInput'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { listActivity, listActivityWindow, type ActivityPage } from '../../lib/api/activity'
import { useApiResource } from '../../lib/useApiResource'
import { formatDateTime } from '../../lib/utils'

const TYPE_FILTERS = ['All', 'upload', 'enhance', 'validate', 'download', 'group', 'reject', 'login', 'email']

export default function ActivityLogsLive() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')

  /* Browsing is one server page at a time. The moment someone searches or picks a type, the newest events
     (up to the backend's window) are loaded in one go and filtered here, because the backend's own filter
     uses storage categories that do not match the types on the chips. */
  const narrowed = search.trim() !== '' || filter !== 'All'

  const { data, loading, error, reload } = useApiResource<ActivityPage>(
    signal => (narrowed ? listActivityWindow(signal) : listActivity(page, signal)),
    () => ({ page: 1, page_size: 0, has_next: false, results: [] }),
    [page, narrowed],
  )
  const entries = data?.results ?? []

  const visible = entries.filter(entry =>
    (filter === 'All' || entry.type === filter) &&
    entry.message.toLowerCase().includes(search.trim().toLowerCase()),
  )
  const countOf = (type: string) => entries.filter(entry => entry.type === type).length

  return (
    <div className="page-enter">
      <PageHeader
        title="Activity Logs"
        subtitle={
          loading ? 'Loading…'
          : narrowed ? `${visible.length} match in your latest ${entries.length} events${data?.has_next ? '; older events are not searched' : ''}`
          : 'Complete history of your uploads, enhancements, and downloads.'
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <SearchInput placeholder="Search your activity…" value={search} onChange={e => setSearch(e.target.value)} className="w-64" />
        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map(f => {
            const isActive = filter === f
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all capitalize cursor-pointer"
                style={{
                  background: isActive ? 'rgba(249,115,22, 0.14)' : 'rgb(var(--a-surface-mute))',
                  border: isActive ? '1px solid rgba(249,115,22, 0.24)' : '1px solid rgb(var(--a-line))',
                  color: isActive ? '#FB923C' : 'rgb(var(--a-ink-mute))',
                  boxShadow: isActive ? '0 0 15px rgba(249,115,22, 0.1)' : 'none',
                }}
              >
                {f}{narrowed && f !== 'All' && !loading ? <span className="ml-1.5 opacity-60">{countOf(f)}</span> : null}
              </button>
            )
          })}
        </div>
      </div>

      <div className="fc-card overflow-hidden">
        {loading && (
          <div className="py-16 text-center text-ink-faint">
            <Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin" />
            <p className="text-xs font-semibold">Loading your activity…</p>
          </div>
        )}

        {!loading && error && (
          <div className="py-16 text-center">
            <AlertTriangle className="w-7 h-7 mx-auto mb-3 text-[#EF4444]" />
            <p className="text-xs font-semibold text-ink">{error}</p>
            <button type="button" onClick={reload}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#FB923C] hover:underline cursor-pointer">
              <RefreshCw className="w-3.5 h-3.5" />Try again
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="divide-y divide-line">
            {visible.map(entry => (
              <div key={entry.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-mute transition-colors">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{
                  background: entry.status === 'success' ? '#10B981' :
                              entry.status === 'error' ? '#EF4444' :
                              entry.status === 'warning' ? '#FCD34D' : '#FB923C',
                }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink-soft">{entry.message}</p>
                  <p className="text-xs text-ink-faint mt-1 font-mono">{formatDateTime(entry.timestamp)}</p>
                </div>
                <StatusBadge
                  status={entry.status === 'success' ? 'success' : entry.status === 'error' ? 'error' : entry.status === 'warning' ? 'warning' : 'info'}
                  label={entry.type}
                  dot={false}
                />
              </div>
            ))}
            {visible.length === 0 && (
              <div className="py-12 text-center text-sm text-ink-faint">
                {entries.length === 0 ? 'Nothing has happened on your account yet.'
                  : filter !== 'All' && search.trim() === '' ? `No ${filter} activity in your latest ${entries.length} events.`
                  : 'Nothing in your latest activity matches.'}
              </div>
            )}
          </div>
        )}

        {!loading && !error && !narrowed && (page > 1 || data?.has_next) && (
          <div className="flex items-center justify-center gap-3 py-4 border-t border-line text-xs">
            <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-xl font-semibold border border-line text-ink-soft hover:text-ink transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default">Previous</button>
            <span className="text-ink-mute">Page {page}</span>
            <button disabled={!data?.has_next} onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-xl font-semibold border border-line text-ink-soft hover:text-ink transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default">Next</button>
          </div>
        )}
      </div>
    </div>
  )
}
