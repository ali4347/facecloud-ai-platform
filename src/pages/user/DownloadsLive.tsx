import { useState } from 'react'
import {
  AlertTriangle, Check, Clock, Copy, Download, FileImage, FileText, FolderArchive, Link2, Loader2, RefreshCw, X,
} from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { GradientButton } from '../../components/ui/GradientButton'
import { StatusBadge } from '../../components/ui/StatusBadge'
import {
  canMakeLink, downloadHistoryFile, listDownloads, makeLinkFor, regenerateDownloadPackage,
  waitForPackage, type DownloadItem, type DownloadKind, type PublicLink,
} from '../../lib/api/downloads'
import { ApiError } from '../../lib/api/client'
import { formatBytes } from '../../lib/imageData'
import { saveBlob } from '../../lib/saveBlob'
import { useApiResource } from '../../lib/useApiResource'
import { formatDate, formatDateTime } from '../../lib/utils'

const typeConfig: Record<DownloadKind, { icon: typeof FileImage; label: string; badge: 'info' | 'purple' | 'success' }> = {
  single: { icon: FileImage,     label: 'Photo',  badge: 'info' },
  batch:  { icon: FolderArchive, label: 'ZIP',    badge: 'purple' },
  report: { icon: FileText,      label: 'Report', badge: 'success' },
}

function expiryDisplay(expiresAt: string): { label: string; urgent: boolean } {
  const diff = new Date(expiresAt).getTime() - Date.now()
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(hours / 24)
  if (diff < 0) return { label: 'Expired', urgent: true }
  if (hours < 2) return { label: `Ends in ${Math.max(hours, 1)} hr`, urgent: true }
  if (hours < 24) return { label: `Ends in ${hours} hrs`, urgent: true }
  return { label: `Valid for ${days} day${days !== 1 ? 's' : ''}`, urgent: false }
}

interface RowState {
  busy?: 'download' | 'link' | 'regenerate'
  error?: string
  /** Offer "Prepare again" for a ZIP that has expired. */
  expiredZip?: boolean
  link?: PublicLink
  copied?: boolean
}

export default function DownloadsLive() {
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<Record<number, RowState>>({})
  const { data, loading, error, reload } = useApiResource(
    signal => listDownloads(page, signal),
    () => ({ count: 0, next: null, previous: null, results: [] as DownloadItem[] }),
    [page],
  )
  const items = data?.results ?? []

  const patch = (id: number, next: RowState | ((current: RowState) => RowState)) =>
    setRows(current => ({ ...current, [id]: typeof next === 'function' ? next(current[id] ?? {}) : next }))

  const download = async (item: DownloadItem) => {
    patch(item.id, { busy: 'download' })
    try {
      saveBlob(await downloadHistoryFile(item), item.filename)
      patch(item.id, {})
      reload() // the download itself is a new line in the history
    } catch (caught) {
      const gone = caught instanceof ApiError && caught.status === 410
      patch(item.id, {
        error: gone ? 'This file has expired.' : caught instanceof Error ? caught.message : 'Could not download this file.',
        expiredZip: gone && item.resource_type === 'batch_package',
      })
    }
  }

  const prepareAgain = async (item: DownloadItem) => {
    patch(item.id, { busy: 'regenerate' })
    try {
      await waitForPackage(await regenerateDownloadPackage(item.resource_id))
      patch(item.id, { error: 'The ZIP is ready again. Press Download.' })
    } catch (caught) {
      patch(item.id, { error: caught instanceof Error ? caught.message : 'Could not prepare the ZIP again.', expiredZip: true })
    }
  }

  /* A link's token is returned once, so it is shown here and kept only for this visit. */
  const makeLink = async (item: DownloadItem) => {
    patch(item.id, { busy: 'link' })
    try {
      patch(item.id, { link: await makeLinkFor(item) })
    } catch (caught) {
      patch(item.id, { error: caught instanceof Error ? caught.message : 'Could not make a secure link.' })
    }
  }

  const copy = async (item: DownloadItem, url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      patch(item.id, current => ({ ...current, copied: true }))
      setTimeout(() => patch(item.id, current => ({ ...current, copied: false })), 2000)
    } catch {
      // The link is on screen and selectable.
    }
  }

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        title="Downloads"
        subtitle="Everything you have downloaded, with a secure link where one can be made."
      />

      <div className="flex items-center gap-4 px-5 py-3.5 rounded-2xl text-xs font-medium text-ink-mute"
        style={{ background: 'rgb(var(--a-surface-mute))', border: '1px solid rgb(var(--a-line))' }}>
        <Clock className="w-4 h-4 text-[#FB923C] shrink-0" />
        <span>A secure link is a time-limited public address you can share. It is shown once, when you make it.</span>
      </div>

      <div className="fc-card overflow-hidden">
        <div className="px-5 py-4 border-b border-line flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">Download History</h3>
          {!loading && !error && (
            <span className="text-[10px] text-ink-faint font-medium">{data?.count ?? 0} item{(data?.count ?? 0) !== 1 ? 's' : ''}</span>
          )}
        </div>

        {loading && (
          <div className="px-5 py-16 text-center text-ink-faint">
            <Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin" />
            <p className="text-xs font-semibold">Loading your downloads…</p>
          </div>
        )}

        {!loading && error && (
          <div className="px-5 py-16 text-center">
            <AlertTriangle className="w-7 h-7 mx-auto mb-3 text-[#EF4444]" />
            <p className="text-xs font-semibold text-ink">{error}</p>
            <button type="button" onClick={reload}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#FB923C] hover:underline cursor-pointer">
              <RefreshCw className="w-3.5 h-3.5" />Try again
            </button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="px-5 py-16 text-center text-ink-faint">
            <Download className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">No downloads yet.</p>
            <p className="text-xs mt-1">When you download a photo, a ZIP or a report, it appears here.</p>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="divide-y divide-line">
            {items.map(item => {
              const cfg = typeConfig[item.kind]
              const state = rows[item.id] ?? {}
              const expiry = item.expires_at ? expiryDisplay(item.expires_at) : null
              return (
                <div key={item.id} className="px-5 py-4 hover:bg-surface-mute transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(249,115,22,0.10)', border: '1px solid rgba(249,115,22,0.20)' }}>
                      <cfg.icon className="w-4 h-4 text-[#FB923C]" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate" title={item.filename}>{item.filename}</p>
                      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1">
                        {item.file_size > 0 && <span className="text-xs text-ink-faint">{formatBytes(item.file_size)}</span>}
                        {item.image_count !== null && <span className="text-xs text-ink-faint">{item.image_count} photo{item.image_count === 1 ? '' : 's'}</span>}
                        <span className="text-xs text-ink-faint font-mono">{formatDateTime(item.downloaded_at)}</span>
                        {expiry && (
                          <span className="text-[10px] font-bold flex items-center gap-1" style={{ color: expiry.urgent ? '#F59E0B' : '#10B981' }}>
                            <Clock className="w-3 h-3" />{expiry.label}
                          </span>
                        )}
                        {item.has_active_link && <span className="text-[10px] font-bold flex items-center gap-1 text-[#10B981]"><Link2 className="w-3 h-3" />Link active</span>}
                      </div>
                    </div>

                    <StatusBadge status={cfg.badge} label={cfg.label} dot={false} />

                    {canMakeLink(item) && (
                      <button
                        onClick={() => void makeLink(item)} disabled={state.busy !== undefined}
                        aria-label={`Make a secure link for ${item.filename}`} title="Make a secure link"
                        className="w-8 h-8 rounded-xl border flex items-center justify-center transition-all shrink-0 disabled:opacity-50"
                        style={{ borderColor: 'rgb(var(--a-line))', background: 'rgb(var(--a-surface-mute))', color: 'rgb(var(--a-ink-faint))' }}
                      >
                        {state.busy === 'link' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                      </button>
                    )}

                    <GradientButton
                      variant="secondary" size="sm" disabled={state.busy !== undefined}
                      leftIcon={state.busy === 'download' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      onClick={() => void download(item)}
                    >
                      Download
                    </GradientButton>
                  </div>

                  {state.error && (
                    <div role="alert" className="mt-3 ml-[52px] flex flex-wrap items-center gap-3 text-xs text-[#F87171]">
                      <span>{state.error}</span>
                      {state.expiredZip && (
                        <button onClick={() => void prepareAgain(item)} disabled={state.busy !== undefined}
                          className="font-semibold text-[#FB923C] hover:underline cursor-pointer disabled:opacity-50">
                          {state.busy === 'regenerate' ? 'Preparing…' : 'Prepare it again'}
                        </button>
                      )}
                    </div>
                  )}

                  {state.link && (
                    <div className="mt-3 ml-[52px] p-3 rounded-xl border border-[#10B981]/25 bg-[#10B981]/10 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[11px] font-semibold text-[#10B981]">Secure link ready</p>
                        <button onClick={() => patch(item.id, current => ({ ...current, link: undefined }))} aria-label="Dismiss"
                          className="text-ink-mute hover:text-ink cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                      </div>
                      <div className="flex gap-2">
                        <input readOnly value={state.link.public_url} aria-label="Secure link" onFocus={e => e.currentTarget.select()}
                          className="fc-input flex-1 !py-1.5 text-[11px] font-mono" />
                        <button onClick={() => void copy(item, state.link!.public_url)} className="fc-btn-secondary text-xs px-3 flex items-center gap-1.5">
                          {state.copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          {state.copied ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <p className="text-[10px] text-ink-mute">Works until {formatDate(state.link.expires_at)}. It is shown only now; make a new one if you lose it.</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {!loading && !error && (data?.next || data?.previous) && (
          <div className="flex items-center justify-center gap-3 py-4 border-t border-line text-xs">
            <button disabled={!data?.previous} onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-xl font-semibold border border-line text-ink-soft hover:text-ink transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default">Previous</button>
            <span className="text-ink-mute">Page {page}</span>
            <button disabled={!data?.next} onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-xl font-semibold border border-line text-ink-soft hover:text-ink transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default">Next</button>
          </div>
        )}
      </div>
    </div>
  )
}
