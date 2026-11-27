import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ChevronRight, FileDown, Loader2, RefreshCw } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { EmptyState } from '../../components/ui/EmptyState'
import { NeedsApi } from '../../components/ui/NeedsApi'
import { RequestStatusBadge } from '../../components/downloads/StatusChips'
import { listOrgDownloadRequests } from '../../lib/api/moderatorConsole'
import type { DownloadRequestStatus } from '../../lib/api/downloads'
import { REQUEST_STATUS_LABEL, countsLine } from '../../lib/downloadApproval'
import { useModeratorOrganization, useModeratorResource } from '../../lib/moderationData'
import { formatDateTime } from '../../lib/utils'

const OPEN = 'pending,in_review'
const FILTERS: { value: string; label: string }[] = [
  { value: OPEN, label: 'To decide' },
  { value: '', label: 'All' },
  ...(Object.keys(REQUEST_STATUS_LABEL) as DownloadRequestStatus[]).map(value => ({ value, label: REQUEST_STATUS_LABEL[value] })),
]

/** The organization's download requests that this moderator may see (the owner sees all). */
function DownloadRequestQueueLive() {
  const [status, setStatus] = useState(OPEN)
  const { organizationId } = useModeratorOrganization()
  const { data, loading, error, reload } = useModeratorResource(
    (orgId, signal) => listOrgDownloadRequests(orgId, status ? { status } : {}, signal), () => [], [status],
  )
  const requests = data ?? []

  return (
    <div className="page-enter">
      <PageHeader title="Download requests" subtitle="Members ask to download photos of this organization; you approve or deny each photo." />
      <div className="flex flex-wrap gap-2 mb-5" role="group" aria-label="Filter by status">
        {FILTERS.map(filter => {
          const active = status === filter.value
          return (
            <button key={filter.value || 'all'} type="button" aria-pressed={active} onClick={() => setStatus(filter.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${active ? 'bg-accent/15 border-accent/30 text-accent' : 'bg-surface-mute border-line text-ink-mute hover:text-ink'}`}>
              {filter.label}
            </button>
          )
        })}
        <button type="button" onClick={reload} className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-ink-mute hover:text-ink cursor-pointer"><RefreshCw className="w-3.5 h-3.5" />Refresh</button>
      </div>

      {loading && <p className="py-16 text-center text-xs text-ink-faint"><Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin" />Loading requests…</p>}
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
            title={status === OPEN ? 'Nothing to decide' : 'No requests here'}
            description="Requests appear when this organization requires download approval and a member you look after asks for photos."
          />
        </div>
      )}
      {!loading && !error && requests.length > 0 && (
        <ul className="space-y-3">
          {requests.map(request => (
            <li key={request.id}>
              <Link to={`/moderator/download-requests/${request.id}?organization=${organizationId}`} className="fc-card p-4 flex flex-wrap sm:flex-nowrap items-center gap-3 hover:shadow-card-md transition-shadow">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">#{request.id} · {request.requester.username}</p>
                  <p className="text-xs text-ink-mute mt-0.5 truncate">{countsLine(request)} · {formatDateTime(request.created_at)}{request.requester_message ? ` · “${request.requester_message}”` : ''}</p>
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

export default function DownloadRequestQueue() {
  return <NeedsApi title="Download requests" icon={FileDown}><DownloadRequestQueueLive /></NeedsApi>
}
