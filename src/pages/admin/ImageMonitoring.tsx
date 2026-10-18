import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Eye, X, Loader2 } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { AuthedImage } from '../../components/ui/AuthedImage'
import { AsyncGate } from '../../components/admin/AsyncGate'
import { mockImages } from '../../data/mock'
import {
  getSystemImage, getSystemImagePreview, listSystemImages,
  type Paged, type SystemImageDetail, type SystemImageRow,
} from '../../lib/api/adminSystem'
import { USE_API } from '../../lib/api/config'
import { formatBytes } from '../../lib/imageData'
import { explainReason } from '../../lib/reasons'
import { messageFor, useApiResource } from '../../lib/useApiResource'
import { formatDateTime } from '../../lib/utils'

const PAGE_SIZE = 20

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

function DetailPanel({ id, onClose }: { id: number; onClose: () => void }) {
  const [detail, setDetail] = useState<SystemImageDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

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
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/60" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <aside role="dialog" aria-modal="true" aria-label="Photo details" className="w-full max-w-md h-full overflow-y-auto bg-surface border-l border-line p-6 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-bold text-ink break-all">{detail?.original_name ?? `Photo ${id}`}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-surface-mute cursor-pointer"><X className="w-4 h-4 text-ink-mute" /></button>
        </div>
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
      </aside>
    </div>
  )
}

export default function ImageMonitoring() {
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<number | null>(null)
  const state = useApiResource(signal => listSystemImages(page, PAGE_SIZE, signal), demoPage, [page])

  return (
    <div className="space-y-6 page-enter">
      <PageHeader title="Image Monitoring" subtitle="Every photo uploaded to the platform, newest first, with its quality result." />

      <AsyncGate state={state} what="the images">
        {data => {
          const lastPage = Math.max(1, Math.ceil(data.count / PAGE_SIZE))
          return (
            <ChartCard title="Uploaded photos" subtitle={`${data.count.toLocaleString()} in total`}>
              {data.results.length === 0 ? (
                <p className="text-xs text-ink-mute py-8 text-center">No photos have been uploaded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full fc-table">
                    <thead>
                      <tr><th>Photo</th><th>Owner</th><th>File</th><th>Quality result</th><th>Scores</th><th>Enhancement</th><th /></tr>
                    </thead>
                    <tbody>
                      {data.results.map(img => {
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
                  <button type="button" disabled={!data.next} onClick={() => setPage(p => p + 1)}
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
