import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Eye, FileImage, Loader2, ShieldCheck, X } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { AsyncGate } from '../../components/admin/AsyncGate'
import { mockImages } from '../../data/mock'
import { getSystemImage, listSystemImages, type Paged, type SystemImageDetail, type SystemImageRow } from '../../lib/api/adminSystem'
import { USE_API } from '../../lib/api/config'
import { formatBytes } from '../../lib/imageData'
import { explainReason } from '../../lib/reasons'
import { messageFor, useApiResource } from '../../lib/useApiResource'
import { formatDateTime } from '../../lib/utils'

const PAGE_SIZE = 20
type SortKey = 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'size_desc' | 'size_asc' | 'owner' | 'attention' | 'sharp_desc' | 'sharp_asc'
/**
 * The server sorts every sort here (`ordering` on `GET /api/system/images/`), across all photos, and pages the result. "Needs review first" has no
 * server field: it only puts the unsure photos at the top of the page that is loaded, and says so. The demo build has no server, so it sorts its sample here.
 */
const SORTS: { key: SortKey; label: string; ordering?: string }[] = [
  { key: 'newest', label: 'Newest first' },
  { key: 'oldest', label: 'Oldest first', ordering: 'created_at' },
  { key: 'attention', label: 'Needs review first (this page)' },
  { key: 'name_asc', label: 'Name A to Z', ordering: 'original_name' },
  { key: 'name_desc', label: 'Name Z to A', ordering: '-original_name' },
  { key: 'owner', label: 'Owner A to Z', ordering: 'owner__username' },
  { key: 'size_desc', label: 'Largest file first', ordering: '-file_size' },
  { key: 'size_asc', label: 'Smallest file first', ordering: 'file_size' },
  { key: 'sharp_desc', label: 'Sharpest first', ordering: '-quality_decision__sharpness_score' },
  { key: 'sharp_asc', label: 'Blurriest first', ordering: 'quality_decision__sharpness_score' },
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

/** What is worth knowing first: unsure photos, then refused ones, then the ones still being checked, then the good ones. */
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

/**
 * A user's photograph is private: this console never asks the server for the picture, only for facts about the file. Accepting and rejecting is
 * the automatic check's job (and, inside a team, its moderator's); the administrator reads the result here and decides nothing.
 */
function DetailPanel({ id, onClose }: { id: number; onClose: () => void }) {
  const [detail, setDetail] = useState<SystemImageDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
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
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

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
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-surface-mute border border-line text-xs">
                <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#10B981]" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-ink">The photo itself is private</p>
                  <p className="text-ink-mute mt-1">Only its owner can see it. This page shows the facts about the file, and the result of the automatic quality check.</p>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                <div><dt className="text-ink-faint">Owner</dt><dd className="font-semibold text-ink">{detail.owner.username}</dd></div>
                <div><dt className="text-ink-faint">Uploaded</dt><dd className="font-semibold text-ink">{formatDateTime(detail.created_at)}</dd></div>
                <div><dt className="text-ink-faint">Size</dt><dd className="font-semibold text-ink">{formatBytes(detail.file_size)}</dd></div>
                <div><dt className="text-ink-faint">Dimensions</dt><dd className="font-semibold text-ink">{detail.width && detail.height ? `${detail.width} × ${detail.height}` : '—'}</dd></div>
                <div><dt className="text-ink-faint">Quality result (automatic)</dt><dd className="font-semibold text-ink">{verdict(detail).label}</dd></div>
                <div><dt className="text-ink-faint">Faces found</dt><dd className="font-semibold text-ink">{detail.face_validation?.face_count ?? '—'}</dd></div>
                <div><dt className="text-ink-faint">Sharpness</dt><dd className="font-semibold text-ink">{score(detail.quality?.sharpness_score)}</dd></div>
                <div><dt className="text-ink-faint">Brightness</dt><dd className="font-semibold text-ink">{score(detail.quality?.brightness_score)}</dd></div>
                <div><dt className="text-ink-faint">Duplicate matches</dt><dd className="font-semibold text-ink">{detail.duplicate_matches}</dd></div>
              </dl>
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
    </div>
  )
}

export default function ImageMonitoring() {
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<SortKey>('newest')
  const [selected, setSelected] = useState<number | null>(null)
  const ordering = SORTS.find(option => option.key === sort)?.ordering
  const state = useApiResource(signal => listSystemImages(page, PAGE_SIZE, signal, ordering), demoPage, [page, ordering])
  const changeSort = (next: SortKey) => { setSort(next); setPage(1) }

  return (
    <div className="space-y-6 page-enter">
      <PageHeader title="Image Monitoring" subtitle="Every upload on the platform, with the result of the automatic quality check. The photos themselves are private: only the file's details are shown here." />

      <AsyncGate state={state} what="the images">
        {data => {
          // The server has already ordered and paged the list. Only the demo build's sample, and "needs review first" (no server field), are ordered here.
          const clientOrder = state.isDemo || sort === 'attention'
          const rows = (clientOrder ? sortRows(data.results, state.isDemo ? sort : 'attention') : data.results).slice(0, PAGE_SIZE)
          const lastPage = Math.max(1, Math.ceil(data.count / PAGE_SIZE))
          const hasNext = Boolean(data.next)
          return (
            <ChartCard
              title="Uploaded photos"
              subtitle={`${data.count.toLocaleString()} in total`}
              action={
                <label className="flex items-center gap-2 text-xs text-ink-mute">
                  <span>Sort by</span>
                  <select className="fc-input !w-auto !py-1.5 text-xs" value={sort} onChange={e => changeSort(e.target.value as SortKey)}>
                    {SORTS.map(option => <option key={option.key} value={option.key}>{option.label}</option>)}
                  </select>
                </label>
              }
            >
              {data.results.length === 0 ? (
                <p className="text-xs text-ink-mute py-8 text-center">No photos have been uploaded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full fc-table">
                    <thead>
                      <tr><th>File</th><th>Owner</th><th>Size</th><th>Quality result</th><th>Scores</th><th>Enhancement</th><th /></tr>
                    </thead>
                    <tbody>
                      {rows.map(img => {
                        const v = verdict(img)
                        return (
                          <tr key={img.id}>
                            <td>
                              <div className="flex items-center gap-3">
                                <span className="w-9 h-9 flex-shrink-0 rounded-lg bg-surface-mute border border-line flex items-center justify-center" aria-hidden="true">
                                  <FileImage className="w-4 h-4 text-ink-faint" />
                                </span>
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

      {selected !== null && <DetailPanel id={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
