import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Check, ChevronLeft, ChevronRight, Clock, Eye, X, XCircle, Loader2 } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { AuthedImage } from '../../components/ui/AuthedImage'
import { AsyncGate } from '../../components/admin/AsyncGate'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { mockImages } from '../../data/mock'
import {
  DECISION_OF_ACTION, decideSystemImage, getSystemImage, getSystemImagePreview, listSystemImages, systemDecisionsAvailable,
  type Paged, type SystemImageAction, type SystemImageDetail, type SystemImageRow,
} from '../../lib/api/adminSystem'
import { USE_API } from '../../lib/api/config'
import { formatBytes } from '../../lib/imageData'
import { explainReason } from '../../lib/reasons'
import { messageFor, useApiResource } from '../../lib/useApiResource'
import { formatDateTime } from '../../lib/utils'

const PAGE_SIZE = 20
/** The most photos one request can return. Any order other than "newest first" is worked out here, over this many. */
const SORT_WINDOW = 200

type SortKey = 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'size_desc' | 'size_asc' | 'owner' | 'attention' | 'sharp_desc' | 'sharp_asc'
const SORTS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'Newest first' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'attention', label: 'Needs review first' },
  { key: 'name_asc', label: 'Name A to Z' },
  { key: 'name_desc', label: 'Name Z to A' },
  { key: 'owner', label: 'Owner A to Z' },
  { key: 'size_desc', label: 'Largest file first' },
  { key: 'size_asc', label: 'Smallest file first' },
  { key: 'sharp_desc', label: 'Sharpest first' },
  { key: 'sharp_asc', label: 'Blurriest first' },
]

function demoPage(): Paged<SystemImageRow> {
  const results = mockImages.map((m, i): SystemImageRow => ({
    id: i + 1, original_name: m.filename, owner: { id: 0, username: 'demo', email: '' }, batch: 0, status: 'uploaded',
    rejection_reason: m.rejectionReason ?? '', file_extension: '', mime_type: '', file_size: 0,
    width: parseInt(m.dimensions, 10) || null, height: parseInt(m.dimensions.split('x').pop() ?? '', 10) || null, created_at: m.uploadedAt,
    quality: { status: 'done', decision: m.qualityStatus === 'passed' ? 'accepted' : 'rejected', overall_score: null, sharpness_score: m.blurScore, brightness_score: m.brightnessScore },
    latest_enhancement: null,
  }))
  return { count: results.length, next: null, previous: null, results }
}

/** The verdict lives on `quality.decision`; `status` only says the file arrived. */
function verdict(img: SystemImageRow): { tone: 'success' | 'warning' | 'error' | 'muted'; label: string } {
  if (img.rejection_reason) return { tone: 'error', label: 'Refused at upload' }
  const d = img.quality?.decision
  if (d === 'accepted') return { tone: 'success', label: 'Accepted' }
  if (d === 'rejected') return { tone: 'error', label: 'Rejected' }
  if (d === 'needs_review') return { tone: 'warning', label: 'Needs review' }
  // No decision yet: the check is still queued or running.
  return { tone: 'muted', label: img.quality ? 'Checking…' : 'Not checked' }
}

const score = (n: number | null | undefined) => (n === null || n === undefined ? '—' : String(Math.round(n)))

/** What needs a person's eye first: unsure photos, then refused ones, then the ones still being checked, then the good ones. */
function attentionRank(img: SystemImageRow): number {
  if (img.rejection_reason) return 2
  switch (img.quality?.decision) {
    case 'needs_review': return 0
    case 'rejected': return 1
    case 'accepted': return 4
    default: return 3
  }
}
const time = (img: SystemImageRow) => Date.parse(img.created_at) || 0
/** A missing number sorts last in either direction, so "—" never ends up on top. */
const numbers = (a: number | null | undefined, b: number | null | undefined, direction: 1 | -1) =>
  a == null && b == null ? 0 : a == null ? 1 : b == null ? -1 : (a - b) * direction
const text = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })

function sortRows(rows: SystemImageRow[], key: SortKey): SystemImageRow[] {
  const newest = (a: SystemImageRow, b: SystemImageRow) => time(b) - time(a) || b.id - a.id
  const compare: Record<SortKey, (a: SystemImageRow, b: SystemImageRow) => number> = {
    newest,
    oldest: (a, b) => -newest(a, b),
    name_asc: (a, b) => text(a.original_name, b.original_name),
    name_desc: (a, b) => text(b.original_name, a.original_name),
    owner: (a, b) => text(a.owner.username, b.owner.username),
    size_desc: (a, b) => numbers(a.file_size || null, b.file_size || null, -1),
    size_asc: (a, b) => numbers(a.file_size || null, b.file_size || null, 1),
    sharp_desc: (a, b) => numbers(a.quality?.sharpness_score, b.quality?.sharpness_score, -1),
    sharp_asc: (a, b) => numbers(a.quality?.sharpness_score, b.quality?.sharpness_score, 1),
    attention: (a, b) => attentionRank(a) - attentionRank(b),
  }
  // Ties keep the newest photo on top, so the same sort always gives the same order.
  return [...rows].sort((a, b) => compare[key](a, b) || newest(a, b))
}

/** The three things an administrator can do with a photo, in the order they are shown. */
const ACTIONS: { action: SystemImageAction; label: string; past: string; icon: typeof Check; tone: string }[] = [
  { action: 'approve', label: 'Accept', past: 'accepted', icon: Check, tone: 'border-[#10B981]/35 text-[#10B981] [html[data-theme=light]_&]:text-[#047857] hover:bg-[#10B981]/10 data-[current=true]:bg-[#10B981]/15' },
  { action: 'keep_in_review', label: 'Under review', past: 'under review', icon: Clock, tone: 'border-[#F59E0B]/35 text-[#D97706] [html[data-theme=light]_&]:text-[#B45309] hover:bg-[#F59E0B]/10 data-[current=true]:bg-[#F59E0B]/15' },
  { action: 'reject', label: 'Reject', past: 'rejected', icon: XCircle, tone: 'border-[#EF4444]/35 text-[#F87171] [html[data-theme=light]_&]:text-[#B91C1C] hover:bg-[#EF4444]/10 data-[current=true]:bg-[#EF4444]/15' },
]

function DetailPanel({ id, onClose, onChanged }: { id: number; onClose: () => void; onChanged: () => void }) {
  const [detail, setDetail] = useState<SystemImageDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Deciding: is the backend able to record it, which action is being confirmed, and how it went.
  const [canDecide, setCanDecide] = useState<boolean | null>(null)
  const [pending, setPending] = useState<SystemImageAction | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [decideError, setDecideError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (!USE_API) return
    const controller = new AbortController()
    setDetail(null)
    setError(null)
    getSystemImage(id, controller.signal)
      .then(d => { if (!controller.signal.aborted) setDetail(d) })
      .catch(e => { if (!controller.signal.aborted) setError(messageFor(e)) })
    return () => controller.abort()
  }, [id])

  useEffect(() => {
    if (!USE_API) return
    let current = true
    setCanDecide(null)
    systemDecisionsAvailable(id).then(ok => { if (current) setCanDecide(ok) })
    return () => { current = false }
  }, [id])

  // While a decision is being confirmed, Escape belongs to that dialog, not to this panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !pending) onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, pending])

  const submit = async () => {
    const chosen = ACTIONS.find(a => a.action === pending)
    if (!chosen || !detail) return
    setBusy(true)
    setDecideError(null)
    try {
      setDetail(await decideSystemImage(detail.id, chosen.action, reason.trim()))
      setDone(`Marked as ${chosen.past}.`)
      setPending(null)
      setReason('')
      onChanged()
    } catch (caught) {
      setDecideError(messageFor(caught))
    } finally {
      setBusy(false)
    }
  }

  const reasons = detail?.rejection_reason ? [detail.rejection_reason] : []
  return (
    <div className="fixed inset-0 z-[70] bg-black/50" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      {/* A floating card like the rail, set between the top bar (56 px, 12 px from the top) and the bottom pill (about 52 px, 14 px
          from the foot) with a gap each side, so it never runs under either. The header stays; the photo's details scroll. */}
      <motion.aside
        role="dialog" aria-modal="true" aria-label="Photo details"
        initial={reduced ? { opacity: 0 } : { opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }}
        transition={reduced ? { duration: 0.12 } : { type: 'spring', bounce: 0.12, duration: 0.45 }}
        className="fc-popover fixed right-3 left-3 sm:left-auto sm:right-5 sm:w-[28rem] top-[5.25rem] bottom-[5.5rem] flex flex-col overflow-hidden rounded-[28px] border"
      >
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4 border-b border-line">
          <h2 className="text-base font-bold text-ink break-all">{detail?.original_name ?? `Photo ${id}`}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-surface-mute cursor-pointer"><X className="w-4 h-4 text-ink-mute" /></button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5">
          {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
          {!detail && !error && USE_API && <div className="py-10 text-center"><Loader2 className="w-5 h-5 mx-auto animate-spin text-ink-faint" /></div>}
          {detail && (
            <>
              <AuthedImage load={signal => getSystemImagePreview(detail.id, signal)} cacheKey={`sys-${detail.id}`} alt={detail.original_name}
                className="w-full h-64 object-contain bg-surface-mute" rounded="rounded-2xl" />
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                <div><dt className="text-ink-faint">Owner</dt><dd className="font-semibold text-ink">{detail.owner.username}</dd><dd className="text-ink-mute break-all">{detail.owner.email}</dd></div>
                <div><dt className="text-ink-faint">Uploaded</dt><dd className="font-semibold text-ink">{formatDateTime(detail.created_at)}</dd></div>
                <div><dt className="text-ink-faint">Size</dt><dd className="font-semibold text-ink">{formatBytes(detail.file_size)}</dd></div>
                <div><dt className="text-ink-faint">Dimensions</dt><dd className="font-semibold text-ink">{detail.width && detail.height ? `${detail.width} × ${detail.height}` : '—'}</dd></div>
                <div><dt className="text-ink-faint">Quality verdict</dt><dd className="font-semibold text-ink">{verdict(detail).label}</dd></div>
                <div><dt className="text-ink-faint">Faces found</dt><dd className="font-semibold text-ink">{detail.face_validation?.face_count ?? '—'}</dd></div>
                <div><dt className="text-ink-faint">Sharpness</dt><dd className="font-semibold text-ink">{score(detail.quality?.sharpness_score)}</dd></div>
                <div><dt className="text-ink-faint">Brightness</dt><dd className="font-semibold text-ink">{score(detail.quality?.brightness_score)}</dd></div>
                <div><dt className="text-ink-faint">Duplicate matches</dt><dd className="font-semibold text-ink">{detail.duplicate_matches}</dd></div>
              </dl>
              {!detail.rejection_reason && (
                <section aria-label="Decide on this photo" className="space-y-2">
                  <h3 className="text-xs font-bold text-ink">Decide on this photo</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {ACTIONS.map(a => {
                      const current = detail.quality?.decision === DECISION_OF_ACTION[a.action]
                      const settled = Boolean(detail.quality?.decision)
                      return (
                        <button
                          key={a.action}
                          type="button"
                          data-current={current}
                          aria-pressed={current}
                          disabled={!canDecide || !settled || current || busy}
                          title={current ? `Already ${a.past}` : undefined}
                          onClick={() => { setPending(a.action); setDecideError(null); setReason('') }}
                          className={`inline-flex items-center justify-center gap-1.5 px-1.5 py-2 rounded-xl border text-xs font-bold whitespace-nowrap bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed disabled:hover:bg-transparent ${current ? '' : 'disabled:opacity-40'} ${a.tone}`}
                        >
                          <a.icon className="w-3.5 h-3.5" aria-hidden="true" />{a.label}
                        </button>
                      )
                    })}
                  </div>
                  {canDecide === false && (
                    <p className="text-[11px] text-ink-faint">
                      The backend cannot record an administrator's decision yet, so these stay off. They switch on by themselves once it can.
                    </p>
                  )}
                  {canDecide && !detail.quality?.decision && (
                    <p className="text-[11px] text-ink-faint">You can decide once the quality check has finished.</p>
                  )}
                  {done && <p role="status" className="text-[11px] font-semibold text-[#10B981]">{done}</p>}
                </section>
              )}
              {reasons.length > 0 && (
                <div className="p-3 rounded-2xl bg-surface-mute border border-line text-xs">
                  <p className="font-semibold text-ink">{explainReason(reasons[0]).title}</p>
                  {explainReason(reasons[0]).hint && <p className="text-ink-mute mt-1">{explainReason(reasons[0]).hint}</p>}
                </div>
              )}
              {detail.face_validation?.message && <p className="text-xs text-ink-mute">{detail.face_validation.message}</p>}
              <div>
                <h3 className="text-xs font-bold text-ink mb-2">Enhancements ({detail.enhancements.length})</h3>
                {detail.enhancements.length === 0 ? <p className="text-xs text-ink-faint">None yet.</p> : (
                  <ul className="space-y-1.5 text-xs">
                    {detail.enhancements.map(e => (
                      <li key={e.id} className="flex justify-between gap-3 p-2 rounded-xl bg-surface-mute border border-line">
                        <span className="text-ink">{e.applied_level || '—'}{e.algorithm ? ` · ${e.algorithm}` : ''}</span>
                        <span className="text-ink-mute">{e.status} · {formatDateTime(e.created_at)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </motion.aside>

      {pending && detail && (
        <ConfirmDialog
          title={pending === 'approve' ? 'Accept this photo?' : pending === 'reject' ? 'Reject this photo?' : 'Put this photo under review?'}
          confirmLabel={pending === 'approve' ? 'Accept' : pending === 'reject' ? 'Reject' : 'Put under review'}
          busyLabel="Saving…"
          danger={pending === 'reject'}
          busy={busy}
          error={decideError}
          confirmDisabled={pending === 'reject' && !reason.trim()}
          onConfirm={() => void submit()}
          onCancel={() => setPending(null)}
        >
          <p>
            {pending === 'approve' && <>This sets <span className="font-semibold text-ink">{detail.original_name}</span> to accepted. {detail.owner.username} is told.</>}
            {pending === 'keep_in_review' && <>This puts <span className="font-semibold text-ink">{detail.original_name}</span> back under review. {detail.owner.username} is not told.</>}
            {pending === 'reject' && <>This rejects <span className="font-semibold text-ink">{detail.original_name}</span>. {detail.owner.username} is told, with your reason.</>}
          </p>
          {pending === 'reject' && (
            <label className="block">
              <span className="text-xs font-semibold text-ink">Reason, shown to the owner</span>
              <textarea className="fc-input mt-1 w-full text-xs" rows={3} maxLength={500} value={reason} onChange={e => setReason(e.target.value)} />
            </label>
          )}
        </ConfirmDialog>
      )}
    </div>
  )
}

export default function ImageMonitoring() {
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<SortKey>('newest')
  const [selected, setSelected] = useState<number | null>(null)
  /* "Newest first" is the server's own order, so it pages on the server and is right for any number of photos. Any other
     order needs the photos together: one request for up to 200 of the newest, sorted and paged here. The result says which
     way it was loaded, so a list loaded the other way is never drawn under the wrong order for a moment. */
  const local = sort !== 'newest'
  const state = useApiResource(
    async signal => ({ paged: await listSystemImages(local ? 1 : page, local ? SORT_WINDOW : PAGE_SIZE, signal), local }),
    () => ({ paged: demoPage(), local }),
    [local, local ? 0 : page],
  )
  const changeSort = (next: SortKey) => { setSort(next); setPage(1) }

  return (
    <div className="space-y-6 page-enter">
      <PageHeader title="Image Monitoring" subtitle="Every photo uploaded to the platform, with its quality result. Sort it, and open a photo to accept, reject or put it under review." />

      <AsyncGate state={state} what="the images">
        {({ paged: data, local: loadedLocal }) => {
          const ready = loadedLocal === local
          const sorted = local && ready ? sortRows(data.results, sort) : data.results
          const rows = local && ready ? sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : data.results
          const lastPage = Math.max(1, Math.ceil((local && ready ? data.results.length : data.count) / PAGE_SIZE))
          const hasNext = local && ready ? page < lastPage : Boolean(data.next)
          const clipped = local && ready && data.count > data.results.length
          return (
            <ChartCard
              title="Uploaded photos"
              subtitle={`${data.count.toLocaleString()} in total${clipped ? ` · ordered within the newest ${data.results.length.toLocaleString()}` : ''}`}
              action={
                <label className="flex items-center gap-2 text-xs text-ink-mute">
                  <span>Sort by</span>
                  <select className="fc-input !w-auto !py-1.5 text-xs" value={sort} onChange={e => changeSort(e.target.value as SortKey)}>
                    {SORTS.map(option => <option key={option.key} value={option.key}>{option.label}</option>)}
                  </select>
                </label>
              }
            >
              {!ready ? (
                <div className="text-center py-16 text-ink-faint"><Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin" /><p className="text-xs font-semibold">Ordering the photos…</p></div>
              ) : data.results.length === 0 ? (
                <p className="text-xs text-ink-mute py-8 text-center">No photos have been uploaded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full fc-table">
                    <thead>
                      <tr><th>Photo</th><th>Owner</th><th>File</th><th>Quality result</th><th>Scores</th><th>Enhancement</th><th /></tr>
                    </thead>
                    <tbody>
                      {rows.map(img => {
                        const v = verdict(img)
                        return (
                          <tr key={img.id}>
                            <td>
                              <div className="flex items-center gap-3">
                                <AuthedImage load={signal => getSystemImagePreview(img.id, signal)} cacheKey={`sys-${img.id}`} alt={img.original_name} box={36} rounded="rounded-lg" />
                                <div className="min-w-0">
                                  <p className="font-bold text-ink truncate max-w-[180px]">{img.original_name}</p>
                                  <p className="text-[10px] text-ink-faint">{formatDateTime(img.created_at)}</p>
                                </div>
                              </div>
                            </td>
                            <td className="text-xs text-ink-soft">{img.owner.username}</td>
                            <td>
                              <div className="text-xs text-ink-soft space-y-0.5">
                                <p>{img.file_size ? formatBytes(img.file_size) : '—'}</p>
                                <p className="text-[10px] text-ink-faint font-mono">{img.width && img.height ? `${img.width}×${img.height}` : '—'}</p>
                              </div>
                            </td>
                            <td>
                              <StatusBadge status={v.tone} label={v.label} dot={false} />
                              {img.rejection_reason && <p className="text-[10px] text-ink-faint mt-1">{explainReason(img.rejection_reason).title}</p>}
                            </td>
                            <td className="text-xs text-ink-soft">
                              <p>Sharpness {score(img.quality?.sharpness_score)}</p>
                              <p className="text-[10px] text-ink-faint">Brightness {score(img.quality?.brightness_score)}</p>
                            </td>
                            <td className="text-xs text-ink-soft">{img.latest_enhancement ? img.latest_enhancement.status : '—'}</td>
                            <td>
                              <button type="button" onClick={() => setSelected(img.id)} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FB923C] hover:underline cursor-pointer">
                                <Eye className="w-3.5 h-3.5" />Details
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex items-center justify-between mt-4 text-xs text-ink-mute">
                <span>Page {page} of {lastPage}</span>
                <div className="flex items-center gap-2">
                  <button type="button" disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 rounded-xl border border-line bg-surface disabled:opacity-40 cursor-pointer disabled:cursor-default flex items-center gap-1"><ChevronLeft className="w-3.5 h-3.5" />Previous</button>
                  <button type="button" disabled={!hasNext} onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 rounded-xl border border-line bg-surface disabled:opacity-40 cursor-pointer disabled:cursor-default flex items-center gap-1">Next<ChevronRight className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </ChartCard>
          )
        }}
      </AsyncGate>

      {selected !== null && <DetailPanel id={selected} onClose={() => setSelected(null)} onChanged={state.reload} />}
    </div>
  )
}
