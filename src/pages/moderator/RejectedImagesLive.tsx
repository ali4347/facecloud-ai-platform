import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ImageOff } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { SearchInput } from '../../components/ui/SearchInput'
import { AuthedImage } from '../../components/ui/AuthedImage'
import { ModeratorGate } from '../../components/moderator/ModeratorGate'
import { getPreview, listOrgImages, type OrgImageRow } from '../../lib/api/moderatorConsole'
import { useModeratorResource } from '../../lib/moderationData'
import { explainReason } from '../../lib/reasons'
import { formatDateTime } from '../../lib/utils'

type Decision = 'rejected' | 'needs_review'

export function LiveRejectedImages() {
  const [decision, setDecision] = useState<Decision>('rejected')
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  useEffect(() => { const t = setTimeout(() => setQ(search.trim()), 300); return () => clearTimeout(t) }, [search])
  const state = useModeratorResource((org, signal) => listOrgImages(org, decision, q, signal), () => [] as OrgImageRow[], [decision, q])
  const total = state.data?.length ?? 0

  return (
    <div>
      <PageHeader title={decision === 'rejected' ? 'Rejected Images' : 'Photos Needing Review'} subtitle={`${total} photo${total === 1 ? '' : 's'} submitted to your organization`} />
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {([['rejected', 'Rejected'], ['needs_review', 'Needs review']] as const).map(([value, label]) => (
          <button key={value} type="button" onClick={() => setDecision(value)} aria-pressed={decision === value}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer ${decision === value ? 'bg-accent-tint text-accent border-accent/30' : 'bg-surface-mute text-ink-mute border-line'}`}>{label}</button>
        ))}
        <SearchInput placeholder="Search by photo or uploader…" value={search} onChange={e => setSearch(e.target.value)} className="w-72" />
      </div>

      <ModeratorGate state={state} what="the photos">
        {rows => rows.length === 0 ? (
          <p className="text-xs text-ink-faint py-10 text-center">{q ? 'Nothing matches that search.' : decision === 'rejected' ? 'No photo submitted to your organization has been rejected.' : 'No photo is waiting for a review decision.'}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {rows.map(item => {
              const reasons = item.rejection_reasons.map(code => explainReason(code).title)
              return (
                <div key={item.id} className="fc-card overflow-hidden">
                  <div className="h-36 relative flex items-center justify-center bg-surface-mute">
                    {item.preview_url
                      ? <AuthedImage load={signal => getPreview(item.preview_url as string, signal)} cacheKey={`rej-${item.id}`} alt={item.original_name} className="w-full h-36 !border-0 object-cover" rounded="rounded-none" />
                      : <div className="text-center text-ink-faint"><ImageOff className="w-6 h-6 mx-auto mb-1" /><p className="text-[10px]">Refused at upload</p></div>}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold text-ink truncate mb-1" title={item.original_name}>{item.original_name}</p>
                    <StatusBadge status={item.decision === 'rejected' ? 'error' : 'warning'} label={reasons[0] ?? (item.decision === 'rejected' ? 'Rejected' : 'Needs review')} dot={false} className="text-[10px] mb-2 w-full justify-center" />
                    {reasons.length > 1 && <p className="text-[10px] text-ink-faint mb-1">+ {reasons.slice(1).join(', ')}</p>}
                    <p className="text-[10px] text-ink-mute">{item.uploader.username} · {formatDateTime(item.created_at)}</p>
                    {item.review_id !== null
                      ? <Link to={`/moderator/images/${item.review_id}`} className="fc-btn-secondary !py-1.5 w-full justify-center mt-2 text-[11px] font-bold">Open review</Link>
                      : <p className="text-[10px] text-ink-faint mt-2 text-center">No review was raised</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ModeratorGate>
    </div>
  )
}
