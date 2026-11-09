import { useCallback, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { AuthedImage } from '../../components/ui/AuthedImage'
import { QualityScores } from '../../components/features/QualityScores'
import { EnhancedVersionCard, type EnhancedAfter } from '../../components/features/EnhancedVersionCard'
import { ReportButton } from '../../components/features/ReportButton'
import { DuplicateNotice } from '../../components/features/DuplicateNotice'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { USE_API } from '../../lib/api/config'
import { useImage, formatBytes, statusLabel } from '../../lib/imageData'
import { downloadImage, getImageThumbnail, photoStatus } from '../../lib/api/images'
import { moveToTrash } from '../../lib/api/library'
import { findDuplicates, rerunChecks } from '../../lib/api/tools'
import { AdvisorPanel } from '../../components/features/AdvisorPanel'
import { FavoriteButton } from '../../components/features/FavoriteButton'
import { AddToAlbumDialog } from '../../components/features/AddToAlbumDialog'
import { PhotoLocationCard } from '../../components/features/PhotoLocationCard'
import { formatDateTime } from '../../lib/utils'
import { saveBlob } from '../../lib/saveBlob'
import { FACE_RESTORATION_LIMIT } from '../../lib/enhancementPresets'
import { explainReason, REJECTING_CODES } from '../../lib/reasons'
import {
  AlertTriangle, ArrowLeft, CheckCircle2, Columns3, Download, FolderPlus, Loader2, RefreshCw, Trash2, XCircle,
} from 'lucide-react'

export default function ImageDetail() {
  const { id } = useParams<{ id: string }>()
  const imageId = id && /^\d+$/.test(id) ? Number(id) : null
  const { data: image, loading, error, isDemo, reload } = useImage(imageId)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState('')
  const navigate = useNavigate()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [addingToAlbum, setAddingToAlbum] = useState(false)
  const [albumNote, setAlbumNote] = useState('')
  const [dupRefresh, setDupRefresh] = useState(0)
  const [toolNote, setToolNote] = useState('')
  const [rerunning, setRerunning] = useState(false)
  const [confirmingRerun, setConfirmingRerun] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  /* The picture "Enhanced version" shows as "after" (the current edit, else the enhanced photo): this card shows and downloads the same one.
     Tagged with the photo it belongs to so a stale one is never shown for another photo. `undefined` = not reported yet, `null` = there is none. */
  const [reportedAfter, setReportedAfter] = useState<{ imageId: number | null; value: EnhancedAfter | null } | null>(null)
  const handleAfterChange = useCallback((value: EnhancedAfter | null) => setReportedAfter({ imageId, value }), [imageId])
  const after = reportedAfter?.imageId === imageId ? reportedAfter.value : undefined

  const handleDelete = async () => {
    if (!image) return
    setDeleting(true)
    setDeleteError('')
    try {
      const result = await moveToTrash([image.id])
      const skipped = result.skipped[0]
      if (skipped) {
        setDeleteError(skipped.reason === 'still_processing' ? 'This photo is still being processed. Try again in a moment.' : 'A moderator has not decided this photo yet, so it cannot be moved to the trash.')
        setDeleting(false)
        return
      }
      navigate('/dashboard/images', { replace: true })
    } catch (caught) {
      setDeleteError(caught instanceof Error ? caught.message : 'Could not move this photo to the trash.')
      setDeleting(false)
    }
  }

  /* The photo as it was uploaded. */
  const handleDownloadOriginal = async () => {
    if (!image) return
    setDownloading(true)
    setDownloadError('')
    try {
      const blob = await downloadImage(image.id)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = image.original_name
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (caught) {
      setDownloadError(caught instanceof Error ? caught.message : 'Download failed.')
    } finally {
      setDownloading(false)
    }
  }

  /* What the card shows: the enhanced (or edited) photo when there is one, otherwise the original. */
  const handleDownload = async () => {
    if (after) { saveBlob(after.blob, after.filename); return }
    await handleDownloadOriginal()
  }

  /* The photo has a finished enhancement whose picture the card above is still loading: show a spinner rather than the original for a moment. */
  const waitingForEnhanced = USE_API && image?.latest_enhancement?.status === 'completed' && after === undefined

  const verdict = image ? photoStatus(image) : undefined
  /* Rejected by a stored decision that the server's own status word does not show (see photoStatus). */
  const heldRejection = verdict === 'rejected' && image?.display_status !== 'rejected'
  const accepted = verdict === 'accepted' || verdict === 'completed'
  const rejected = verdict === 'rejected'
  const allReasons = [...new Set([
    ...(image?.quality_decision?.rejection_reasons ?? []),
    ...(image?.face_validation?.rejection_reason ? [image.face_validation.rejection_reason] : []),
  ])]
  /* The backend lists the reasons that rejected a photo together with milder ones that would only have sent it
     to review. A rejected photo's answer to "why" is the rejecting ones; a photo in review, the milder ones. */
  const matching = allReasons.filter(code => (verdict === 'rejected') === REJECTING_CODES.has(code))
  const reasons = heldRejection ? [] : matching.length > 0 ? matching : allReasons

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard/images"
          className="p-2 rounded-xl hover:bg-surface-mute border border-line text-ink-mute hover:text-ink"
          aria-label="Back to my images"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <PageHeader
          title={image?.original_name ?? 'Photo'}
          subtitle={image ? `${image.taken_at ? `Taken ${formatDateTime(image.taken_at)} · ` : ''}Uploaded ${formatDateTime(image.created_at)}` : 'Loading…'}
          action={USE_API && image && image.thumbnail_url ? (
            <>
              <FavoriteButton imageId={image.id} value={Boolean(image.is_favorite)} />
              <button type="button" onClick={() => setAddingToAlbum(true)} className="fc-btn-secondary !py-2 !px-3 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"><FolderPlus className="w-3.5 h-3.5" />Add to album</button>
              <Link to={`/dashboard/images/${image.id}/compare`} className="fc-btn-secondary !py-2 !px-3 text-xs font-bold inline-flex items-center gap-1.5"><Columns3 className="w-3.5 h-3.5" />Compare styles</Link>
            </>
          ) : undefined}
        />
      </div>

      {isDemo && (
        <div className="p-3 rounded-2xl text-xs flex items-center gap-2 bg-surface-mute border border-line text-ink-soft">
          <AlertTriangle className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
          Showing demo data. Set <code className="fc-kbd">VITE_USE_API=true</code> to see a real photo.
        </div>
      )}

      {loading && (
        <div className="fc-card p-12 text-center text-ink-faint">
          <Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin" />
          <p className="text-xs font-semibold">Loading the photo…</p>
        </div>
      )}

      {!loading && error && (
        <div className="fc-card p-12 text-center">
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

      {!loading && !error && image && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            {USE_API && (image.display_status === 'accepted' || image.display_status === 'completed' || image.latest_enhancement) && (
              <EnhancedVersionCard image={image} onChanged={reload} onAfterChange={handleAfterChange} />
            )}
            {USE_API && image.latest_enhancement?.status === 'completed' && <AdvisorPanel resultId={image.latest_enhancement.id} imageId={image.id} />}
            <ChartCard
              title="The photo"
              subtitle={after ? `${image.original_name} · ${after.edited ? 'your edited version' : after.unchanged ? 'nothing needed fixing' : 'enhanced version'}` : image.original_name}
            >
              <div className="aspect-[4/3] rounded-3xl overflow-hidden border border-line bg-surface-mute">
                {after ? (
                  /* The enhanced (or edited) photo, the same picture the slider above shows as "after". */
                  <AuthedImage
                    load={() => Promise.resolve(after.blob)}
                    cacheKey={after.key}
                    alt={image.original_name}
                    className="w-full h-full !border-0 !object-contain"
                    rounded="rounded-none"
                  />
                ) : waitingForEnhanced ? (
                  <div className="w-full h-full flex items-center justify-center text-ink-faint"><Loader2 className="w-5 h-5 animate-spin" /></div>
                ) : (
                  /* 1024 rather than the 256 the gallery uses: this is the
                     lightbox view, and the original could be enormous. */
                  <AuthedImage
                    load={image.thumbnail_url
                      ? signal => getImageThumbnail(image.id, 1024, signal)
                      : null}
                    cacheKey={`detail-${image.id}`}
                    alt={image.original_name}
                    className="w-full h-full !border-0 !object-contain"
                    rounded="rounded-none"
                  />
                )}
              </div>

              {(after || image.download_url) && (
                <div className="mt-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => void handleDownload()}
                      disabled={downloading || waitingForEnhanced}
                      className="fc-btn-primary !py-2 !px-4 text-xs font-bold cursor-pointer flex items-center gap-2 disabled:opacity-60"
                    >
                      {downloading
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Preparing…</>
                        : <><Download className="w-3.5 h-3.5" />{after?.edited ? 'Download the edited photo' : after && !after.unchanged ? 'Download the enhanced photo' : 'Download the full photo'}</>}
                    </button>
                    {after && !after.unchanged && image.download_url && (
                      <button
                        type="button"
                        onClick={() => void handleDownloadOriginal()}
                        disabled={downloading}
                        className="fc-btn-secondary !py-2 !px-4 text-xs font-bold cursor-pointer flex items-center gap-2 disabled:opacity-60"
                      >
                        <Download className="w-3.5 h-3.5" />Download the original
                      </button>
                    )}
                  </div>
                  {downloadError && <p className="text-xs text-error mt-2">{downloadError}</p>}
                </div>
              )}

              {USE_API && (
                <div className="mt-4 pt-4 border-t border-line space-y-3">
                  <ReportButton kind="image" id={image.id} label={image.original_name} />
                  <button type="button" onClick={() => { setDeleteError(''); setConfirmingDelete(true) }}
                    className="text-xs font-bold text-error hover:underline inline-flex items-center gap-1.5 cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />Move to trash
                  </button>
                </div>
              )}
            </ChartCard>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <ChartCard title="Outcome" subtitle="What the checks concluded">
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  {accepted
                    ? <CheckCircle2 className="w-7 h-7 text-[#10B981] flex-shrink-0" />
                    : rejected
                      ? <XCircle className="w-7 h-7 text-[#EF4444] flex-shrink-0" />
                      : <AlertTriangle className="w-7 h-7 text-[#F59E0B] flex-shrink-0" />}
                  <div>
                    <p className="text-sm font-bold text-ink">{statusLabel(verdict ?? image.display_status)}</p>
                    <p className="text-[11px] text-ink-faint mt-0.5">
                      {verdict === 'completed' ? 'This photo passed every check and has been enhanced.' : accepted ? 'This photo passed every check.'
                        : heldRejection ? 'This photo was rejected after it was checked. If a person rejected it, their reason was sent to you as a notification.'
                        : rejected ? 'This photo did not meet the quality bar.'
                        : 'A moderator is taking a look at this one.'}
                    </p>
                  </div>
                </div>

                {(image.rejection_reason || reasons.length > 0) && (
                  <div className="p-4 rounded-3xl bg-[#EF4444]/5 border border-[#EF4444]/20 text-xs text-ink-mute space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#F87171]">
                      Why
                    </p>
                    {image.rejection_reason && <p>{image.rejection_reason}</p>}
                    {reasons.length > 0 && (
                      <ul className="space-y-2">
                        {reasons.map(reason => {
                          const info = explainReason(reason)
                          return (
                            <li key={reason}>
                              <span className="font-semibold text-ink">{info.title}</span>
                              {info.hint && <span className="block text-ink-mute">{info.hint}</span>}
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                )}

                <div className="p-4 rounded-3xl bg-surface-mute border border-line text-xs text-ink-mute space-y-3.5">
                  <div className="flex justify-between gap-3">
                    <span>Size:</span>
                    <span className="font-bold text-ink">{formatBytes(image.file_size)}</span>
                  </div>
                  {image.width && image.height && (
                    <div className="flex justify-between">
                      <span>Dimensions:</span>
                      <span className="font-bold text-ink">{image.width}×{image.height}</span>
                    </div>
                  )}
                  {USE_API && image.face_validation?.face_count != null && (
                    <div className="flex justify-between">
                      <span>Faces found:</span>
                      <span className="font-bold text-ink">{image.face_validation.face_count}</span>
                    </div>
                  )}
                  {USE_API && (image.face_validation?.face_count ?? 0) > FACE_RESTORATION_LIMIT && (
                    <p className="text-[11px] leading-snug text-ink-faint">
                      This photo has more faces than FaceCloud restores one by one. The {FACE_RESTORATION_LIMIT} largest are restored with AI, each kept only if it still matches the person in your photo; the others get only the
                      whole-photo corrections (light, noise, sharpness). A group photo can take a few minutes.
                    </p>
                  )}
                  <div className="flex justify-between">
                    <span>From upload:</span>
                    <span className="font-bold text-ink truncate max-w-[160px]">
                      {image.batch_display_name || `#${image.batch}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uploaded:</span>
                    <span className="font-bold text-ink">{formatDateTime(image.created_at)}</span>
                  </div>
                </div>

                {image.quality_decision && (
                  <div className="p-4 rounded-3xl bg-surface-mute border border-line">
                    <QualityScores quality={image.quality_decision} compact sample={!USE_API} />
                  </div>
                )}

                {USE_API && <DuplicateNotice imageId={image.id} refresh={dupRefresh} />}
                {USE_API && image.has_location && <PhotoLocationCard imageId={image.id} onRemoved={reload} />}
                {albumNote && <p role="status" className="text-xs text-emerald-400">{albumNote}</p>}

                <Link
                  to={`/dashboard/processing/${image.batch}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FB923C] hover:underline"
                >
                  See how this upload was processed
                </Link>
                {USE_API && (
                  <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 border-t border-line">
                    <button type="button" title="Looks again for photos like this one. Pairs you already confirmed or dismissed keep your decision." className="text-[11px] font-semibold text-ink-mute hover:text-ink underline cursor-pointer" onClick={async () => { setToolNote(''); try { await findDuplicates(image.id); setToolNote('Looking for duplicates again… Pairs you already decided keep your decision.'); setTimeout(() => setDupRefresh(n => n + 1), 2500) } catch (caught) { setToolNote(caught instanceof Error ? caught.message : 'Could not start the search.') } }}>Look for duplicates again</button>
                    <button type="button" className="text-[11px] font-semibold text-ink-mute hover:text-ink underline cursor-pointer" onClick={() => { setToolNote(''); setConfirmingRerun(true) }}>Run the checks again</button>
                  </div>
                )}
                {toolNote && <p role="status" className="text-[11px] text-ink-mute">{toolNote}</p>}
              </div>
            </ChartCard>
          </div>
        </div>
      )}
      {confirmingDelete && image && (
        <ConfirmDialog title="Move this photo to the trash?" confirmLabel="Move to trash" busyLabel="Moving…" danger busy={deleting} error={deleteError}
          onConfirm={() => void handleDelete()} onCancel={() => setConfirmingDelete(false)}>
          <p><strong className="text-ink">{image.original_name}</strong> will leave My Images, your albums, person folders and search.</p>
          <p>You can put it back from the Trash for a while; after that it is deleted for good.</p>
        </ConfirmDialog>
      )}
      {confirmingRerun && image && (
        <ConfirmDialog title="Run the checks again?" confirmLabel="Run them again" busyLabel="Starting…" busy={rerunning} onConfirm={async () => { setRerunning(true); try { await rerunChecks(image.id); setConfirmingRerun(false); setToolNote('The checks are running again. This page updates when they finish.'); setTimeout(reload, 4000) } catch (caught) { setConfirmingRerun(false); setToolNote(caught instanceof Error ? caught.message : 'Could not start the checks.') } finally { setRerunning(false) } }} onCancel={() => setConfirmingRerun(false)}>
          <p>The photo is read, checked for faces and judged for quality again, from the start. Your original is not changed. Its verdict can change.</p>
        </ConfirmDialog>
      )}
      {addingToAlbum && image && <AddToAlbumDialog imageIds={[image.id]} onClose={() => setAddingToAlbum(false)} onDone={setAlbumNote} />}
    </div>
  )
}
