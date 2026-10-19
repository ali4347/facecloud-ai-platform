import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ImageOff, X } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { SearchInput } from '../../components/ui/SearchInput'
import { AuthedImage } from '../../components/ui/AuthedImage'
import { ModeratorGate } from '../../components/moderator/ModeratorGate'
import { getPreview, listOrgImages, type OrgImageRow } from '../../lib/api/moderatorConsole'
import { useModeratorResource } from '../../lib/moderationData'
import { formatBytes } from '../../lib/imageData'
import { explainReason } from '../../lib/reasons'
import { formatDateTime } from '../../lib/utils'

type Decision = 'rejected' | 'needs_review'


/** One photo, large, with everything the quality check said about it. Escape or a click outside closes it. */
function PhotoViewer({ item, onClose }: { item: OrgImageRow; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/75 backdrop-blur-[2px]" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div role="dialog" aria-modal="true" aria-label={item.original_name} className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl bg-surface border border-line shadow-soft-lg">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-line">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-ink truncate">{item.original_name}</h2>
            <p className="text-xs text-ink-mute">Uploaded by {item.uploader.username} · {formatDateTime(item.created_at)}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-surface-mute cursor-pointer"><X className="w-4 h-4 text-ink-mute" /></button>
        </div>
        <div className="grid md:grid-cols-[1fr_17rem] gap-5 p-5">
          <div className="rounded-2xl bg-surface-mute border border-line flex items-center justify-center min-h-[16rem]">
            {item.preview_url
              ? <AuthedImage load={signal => getPreview(item.preview_url as string, signal, 1024)} cacheKey={`rej-big-${item.id}`} alt={item.original_name}
                  className="max-h-[68vh] w-auto max-w-full object-contain !border-0" rounded="rounded-2xl" />
              : <div className="text-center text-ink-faint p-6"><ImageOff className="w-8 h-8 mx-auto mb-2" /><p className="text-xs">This file was refused when it arrived, so there is no picture to show.</p></div>}
          </div>
          <div className="space-y-4 text-xs">
            <StatusBadge status={item.decision === 'rejected' ? 'error' : 'warning'} label={item.decision === 'rejected' ? 'Rejected' : 'Needs review'} dot={false} />
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5">
              <div><dt className="text-ink-faint">Size</dt><dd className="font-semibold text-ink">{formatBytes(item.file_size)}</dd></div>
              <div><dt className="text-ink-faint">Dimensions</dt><dd className="font-semibold text-ink">{item.width && item.height ? `${item.width} × ${item.height}` : '—'}</dd></div>
              <div><dt className="text-ink-faint">Quality score</dt><dd className="font-semibold text-ink">{item.overall_score === null ? '—' : Math.round(item.overall_score)}</dd></div>
            </dl>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint mb-2">Why</p>
              {item.rejection_reasons.length === 0 ? <p className="text-ink-faint">No reason was recorded.</p> : (
                <ul className="space-y-1.5">
                  {item.rejection_reasons.map(code => {
                    const info = explainReason(code)
                    return <li key={code} className="p-2 rounded-xl bg-surface-mute border border-line"><span className="font-semibold text-ink">{info.title}</span>{info.hint && <span className="text-ink-mute"> — {info.hint}</span>}</li>
                  })}
                </ul>
              )}
            </div>
            {item.review_id !== null
              ? <Link to={`/moderator/images/${item.review_id}`} className="fc-btn-primary w-full justify-center py-2.5 text-xs font-bold">Open the review</Link>
              : <p className="text-[11px] text-ink-faint">No review was raised for this photo, so there is nothing to decide here.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

export function LiveRejectedImages() {
  const [viewing, setViewing] = useState<OrgImageRow | null>(null)
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
                  <button type="button" onClick={() => setViewing(item)} aria-label={`View ${item.original_name}`} title="Click to view the photo"
                    className="h-36 w-full relative flex items-center justify-center bg-surface-mute cursor-zoom-in">
                    {item.preview_url
                      ? <AuthedImage load={signal => getPreview(item.preview_url as string, signal)} cacheKey={`rej-${item.id}`} alt={item.original_name} className="w-full h-36 !border-0 object-cover" rounded="rounded-none" />
                      : <div className="text-center text-ink-faint"><ImageOff className="w-6 h-6 mx-auto mb-1" /><p className="text-[10px]">Refused at upload</p></div>}
                  </button>
                  <div className="p-3">
                    <button type="button" onClick={() => setViewing(item)} className="block w-full text-left text-xs font-semibold text-ink truncate mb-1 hover:underline cursor-pointer" title={item.original_name}>{item.original_name}</button>
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
      {viewing && <PhotoViewer item={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}
