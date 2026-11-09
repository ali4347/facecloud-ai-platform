import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { SearchInput } from '../../components/ui/SearchInput'
import { EmptyState } from '../../components/ui/EmptyState'
import { useBatches, formatBytes, statusLabel, statusTone } from '../../lib/imageData'
import { formatDateTime } from '../../lib/utils'
import {
  AlertTriangle, ArrowRight, FolderArchive, FileText, Images, Loader2, Pencil, RefreshCw, Trash2,
} from 'lucide-react'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Modal } from '../../components/ui/Modal'
import { NoticeBar } from '../../components/ui/NoticeBar'
import { useNotice } from '../../lib/useNotice'
import { deleteBatch, renameBatch, type UploadBatch } from '../../lib/api/images'
import { USE_API } from '../../lib/api/config'

const TONE_CLASSES: Record<string, string> = {
  good: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/25',
  bad: 'bg-[#EF4444]/10 text-[#F87171] border-[#EF4444]/25',
  warn: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/25',
  busy: 'bg-[#F97316]/10 text-[#FB923C] border-[#F97316]/25',
  neutral: 'bg-surface-mute text-ink-mute border-line',
}

const STATUS_FILTERS = ['All', 'completed', 'partial', 'processing', 'failed', 'cancelled'] as const

/** An upload is the unit of work: one photo or a hundred, it is one batch. */
export default function ProcessingJobs() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('All')
  const { data, loading, error, isDemo, reload } = useBatches()
  const batches = useMemo(() => data ?? [], [data])
  const { notice, setNotice, ok } = useNotice()
  const [renaming, setRenaming] = useState<UploadBatch | null>(null)
  const [nameBuffer, setNameBuffer] = useState('')
  const [deleting, setDeleting] = useState<UploadBatch | null>(null)
  const [busy, setBusy] = useState(false)
  const [dialogError, setDialogError] = useState('')
  const startRename = (batch: UploadBatch) => { setNameBuffer(batch.display_name || ''); setDialogError(''); setRenaming(batch) }
  const saveName = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!renaming || !nameBuffer.trim()) return
    setBusy(true); setDialogError('')
    try { await renameBatch(renaming.id, nameBuffer.trim()); setRenaming(null); ok('Renamed.'); reload() }
    catch (caught) { setDialogError(caught instanceof Error ? caught.message : 'Could not rename the upload.') } finally { setBusy(false) }
  }
  const removeBatch = async () => {
    if (!deleting) return
    setBusy(true); setDialogError('')
    try { await deleteBatch(deleting.id); setDeleting(null); ok('Upload deleted, with its photos.'); reload() }
    catch (caught) { setDialogError(caught instanceof Error ? caught.message : 'Could not delete the upload.') } finally { setBusy(false) }
  }

  const visible = batches.filter(batch => {
    const name = batch.display_name || batch.original_archive_name || `Upload ${batch.id}`
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = status === 'All' || batch.processing_status === status
    return matchesSearch && matchesStatus
  })

  const counts = {
    total: batches.length,
    done: batches.filter(b => b.processing_status === 'completed').length,
    partial: batches.filter(b => b.processing_status === 'partial').length,
    failed: batches.filter(b => b.processing_status === 'failed').length,
  }

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="Your uploads"
        subtitle={loading ? 'Loading…' : `${counts.total} upload${counts.total === 1 ? '' : 's'}`}
      />

      {isDemo && (
        <div className="p-3 rounded-2xl text-xs flex items-center gap-2 bg-surface-mute border border-line text-ink-soft">
          <AlertTriangle className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
          Showing demo data. Set <code className="fc-kbd">VITE_USE_API=true</code> to see your real uploads.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Uploads', value: counts.total, tone: 'text-ink' },
          { label: 'Finished', value: counts.done, tone: 'text-emerald-400' },
          { label: 'Partly done', value: counts.partial, tone: 'text-[#F59E0B]' },
          { label: 'Failed', value: counts.failed, tone: counts.failed ? 'text-[#F87171]' : 'text-ink' },
        ].map(card => (
          <div key={card.label} className="fc-card p-5 space-y-1.5">
            <span className="text-[10px] text-ink-mute font-bold uppercase tracking-wider block">
              {card.label}
            </span>
            <span className={`text-lg font-bold block ${card.tone}`}>{card.value}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="Search uploads…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64"
        />
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map(option => {
            const isActive = status === option
            return (
              <button
                key={option}
                onClick={() => setStatus(option)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                style={{
                  background: isActive ? 'rgba(249,115,22, 0.14)' : 'rgb(var(--a-surface-mute))',
                  border: isActive ? '1px solid rgba(249,115,22, 0.24)' : '1px solid rgb(var(--a-line))',
                  color: isActive ? '#FB923C' : 'rgb(var(--a-ink-mute))',
                }}
              >
                {option === 'All' ? 'All' : statusLabel(option)}
              </button>
            )
          })}
        </div>
      </div>

      {loading && (
        <div className="fc-card p-16 text-center text-ink-faint">
          <Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin" />
          <p className="text-xs font-semibold">Loading your uploads…</p>
        </div>
      )}

      {!loading && error && (
        <div className="fc-card p-16 text-center">
          <AlertTriangle className="w-7 h-7 mx-auto mb-3 text-[#EF4444]" />
          <p className="text-xs font-semibold text-ink">{error}</p>
          <button
            type="button"
            onClick={reload}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#FB923C] hover:underline cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />Try again
          </button>
        </div>
      )}

      {!loading && !error && visible.length === 0 && (
        <EmptyState
          icon={Images}
          title={batches.length === 0 ? 'Nothing uploaded yet' : 'No uploads match that'}
          description={
            batches.length === 0
              ? 'Upload a photo and it will show up here while it is processed.'
              : 'Try a different search or filter.'
          }
          action={{
            label: batches.length === 0 ? 'Upload images' : 'Clear filters',
            onClick: () => {
              if (batches.length === 0) window.location.assign('/dashboard/upload')
              else { setSearch(''); setStatus('All') }
            },
          }}
        />
      )}

      {!loading && !error && visible.length > 0 && (
        <ChartCard title="Uploads" subtitle="Open one to follow it stage by stage">
          <div className="overflow-x-auto">
            <table className="w-full fc-table text-left">
              <thead>
                <tr>
                  <th>Upload</th><th>Photos</th><th>Through</th><th>Size</th>
                  <th>Status</th><th>Started</th><th></th>
                </tr>
              </thead>
              <tbody>
                {visible.map(batch => {
                  const Icon = batch.upload_type === 'zip' ? FolderArchive : FileText
                  const tone = TONE_CLASSES[statusTone(batch.processing_status)]
                  return (
                    <tr key={batch.id} className="hover:bg-surface-mute transition-colors">
                      <td>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className="w-4 h-4 text-ink-faint flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-ink truncate max-w-[200px]">
                              {batch.display_name || batch.original_archive_name || `Upload ${batch.id}`}
                            </p>
                            <p className="text-[10px] text-ink-faint">{batch.upload_type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-xs text-ink-soft">{batch.total_files}</td>
                      <td className="text-xs text-ink-soft">
                        {batch.processed_files}
                        {batch.processing_failed_files > 0 && (
                          <span className="text-[#F87171]"> · {batch.processing_failed_files} failed</span>
                        )}
                      </td>
                      <td className="text-xs font-mono text-ink-mute">{formatBytes(batch.total_size)}</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${tone}`}>
                          {statusLabel(batch.processing_status)}
                        </span>
                      </td>
                      <td className="text-[10px] text-ink-mute">
                        {batch.processing_started_at
                          ? formatDateTime(batch.processing_started_at)
                          : formatDateTime(batch.created_at)}
                      </td>
                      <td>
                        <div className="flex items-center gap-3 whitespace-nowrap">
                          <Link
                            to={`/dashboard/processing/${batch.id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#FB923C] hover:underline"
                          >
                            Open <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                          {USE_API && (
                            <>
                              <button type="button" onClick={() => startRename(batch)} aria-label={`Rename upload ${batch.id}`} title="Rename" className="text-ink-mute hover:text-ink cursor-pointer"><Pencil className="w-3.5 h-3.5" /></button>
                              <button type="button" onClick={() => { setDialogError(''); setDeleting(batch) }} aria-label={`Delete upload ${batch.id} and its photos`} title="Delete the upload and its photos" className="text-error hover:opacity-80 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </ChartCard>
      )}
      {notice && <div className="sticky bottom-24 z-30 mt-6"><NoticeBar notice={notice} onDismiss={() => setNotice(null)} /></div>}
      {renaming && (
        <Modal title="Rename this upload" onClose={() => setRenaming(null)} busy={busy}>
          <form onSubmit={saveName} className="space-y-3">
            <label className="block text-[11px] font-semibold text-ink">Name<input autoFocus value={nameBuffer} onChange={event => setNameBuffer(event.target.value)} maxLength={120} className="fc-input mt-1.5" /></label>
            {dialogError && <p role="alert" className="text-xs text-red-500">{dialogError}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setRenaming(null)} disabled={busy} className="fc-btn-secondary text-xs py-2 px-4">Cancel</button>
              <button type="submit" disabled={busy || !nameBuffer.trim()} className="fc-btn-primary !py-2 !px-4 text-xs font-bold inline-flex items-center gap-2 disabled:opacity-60 cursor-pointer">{busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Save</button>
            </div>
          </form>
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog title="Delete this upload and its photos?" confirmLabel="Delete everything" busyLabel="Deleting…" danger busy={busy} error={dialogError || null} onConfirm={() => void removeBatch()} onCancel={() => setDeleting(null)}>
          <p><strong className="text-ink">{deleting.display_name || deleting.original_archive_name || `Upload ${deleting.id}`}</strong> and its {deleting.total_files} photo{deleting.total_files === 1 ? '' : 's'} (and their enhanced versions) will be permanently deleted.</p>
          <p>This does not go to the trash and cannot be undone. To keep the option of putting photos back, move them to the trash from My Images instead.</p>
        </ConfirmDialog>
      )}
    </div>
  )
}
