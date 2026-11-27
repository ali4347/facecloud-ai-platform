import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ChevronRight, FileDown, Loader2, RefreshCw } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { EmptyState } from '../../components/ui/EmptyState'
import { NeedsApi } from '../../components/ui/NeedsApi'
import { RequestStatusBadge } from '../../components/downloads/StatusChips'
import { listMyDownloadRequests, type DownloadRequestStatus } from '../../lib/api/downloads'
import { REQUEST_STATUS_LABEL, STATUS_FILTERS, countsLine } from '../../lib/downloadApproval'
import { useApiResource } from '../../lib/useApiResource'
import { formatDateTime } from '../../lib/utils'

export function StatusFilter({ value, onChange }: { value: string; onChange: (next: '' | DownloadRequestStatus) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mb-5" role="group" aria-label="Filter by status">
      {STATUS_FILTERS.map(filter => {
        const active = value === filter.value
        return (
          <button
            key={filter.value || 'all'}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(filter.value)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${active ? 'bg-accent/15 border-accent/30 text-accent' : 'bg-surface-mute border-line text-ink-mute hover:text-ink'}`}
          >
            {filter.label}
          </button>
        )
      })}
    </div>
  )
}

/** The member's own download requests, newest first. */
function DownloadRequestsLive() {
  const [status, setStatus] = useState<'' | DownloadRequestStatus>('')
  const { data, loading, error, reload } = useApiResource(
    signal => listMyDownloadRequests(status ? { status } : {}, signal), () => [], [status],
  )
  const requests = data ?? []

  return (
    <div className="page-enter">
      <PageHeader
        title="Download requests"
        subtitle="Photos of an organization that requires approval are downloaded here once a moderator approves them."
        action={<Link to="/dashboard/images" className="text-xs font-bold text-accent hover:underline">Request from My Images</Link>}
      />
      <StatusFilter value={status} onChange={setStatus} />

      {loading && <p className="py-16 text-center text-xs text-ink-faint"><Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin" />Loading your requests…</p>}
      {!loading && error && (
        <div className="py-16 text-center" role="alert">
          <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-error" />
          <p className="text-xs font-semibold text-ink">{error}</p>
          <button type="button" onClick={reload} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline cursor-pointer"><RefreshCw className="w-3.5 h-3.5" />Try again</button>
        </div>
      )}
      {!loading && !error && requests.length === 0 && (
        <div className="fc-card">
          <EmptyState
            icon={FileDown}
            title={status ? `No ${REQUEST_STATUS_LABEL[status].toLowerCase()} requests` : 'No download requests yet'}
            description="When your organization requires approval, select photos in My Images and press “Request download access”."
          />
        </div>
      )}
      {!loading && !error && requests.length > 0 && (
        <ul className="space-y-3">
          {requests.map(request => (
            <li key={request.id}>
              <Link to={`/dashboard/download-requests/${request.id}`} className="fc-card p-4 flex flex-wrap sm:flex-nowrap items-center gap-3 hover:shadow-card-md transition-shadow">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">Request #{request.id} <span className="font-normal text-ink-mute">· {request.organization_name}</span></p>
                  <p className="text-xs text-ink-mute mt-0.5">{countsLine(request)} · sent {formatDateTime(request.created_at)}</p>
                </div>
                <RequestStatusBadge status={request.status} />
                <ChevronRight className="w-4 h-4 text-ink-faint hidden sm:block" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function DownloadRequests() {
  return <NeedsApi title="Download requests" icon={FileDown}><DownloadRequestsLive /></NeedsApi>
}
