import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { AuthedImage } from '../../components/ui/AuthedImage'
import { QualityScores } from '../../components/features/QualityScores'
import { USE_API } from '../../lib/api/config'
import { useImage, formatBytes, statusLabel } from '../../lib/imageData'
import { downloadImage, getImageThumbnail } from '../../lib/api/images'
import { formatDateTime } from '../../lib/utils'
import {
  AlertTriangle, ArrowLeft, CheckCircle2, Download, Loader2, RefreshCw, XCircle,
} from 'lucide-react'

export default function ImageDetail() {
  const { id } = useParams<{ id: string }>()
  const imageId = id && /^\d+$/.test(id) ? Number(id) : null
  const { data: image, loading, error, isDemo, reload } = useImage(imageId)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState('')

  const handleDownload = async () => {
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

  const verdict = image?.display_status
  const accepted = verdict === 'accepted'
  const rejected = verdict === 'rejected'
  const reasons = image?.quality_decision?.rejection_reasons ?? []

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
          subtitle={image ? `Uploaded ${formatDateTime(image.created_at)}` : 'Loading…'}
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
            <ChartCard title="The photo" subtitle={image.original_name}>
              <div className="aspect-[4/3] rounded-3xl overflow-hidden border border-line bg-surface-mute">
                {/* 1024 rather than the 256 the gallery uses: this is the
                    lightbox view, and the original could be enormous. */}
                <AuthedImage
                  load={image.thumbnail_url
                    ? signal => getImageThumbnail(image.id, 1024, signal)
                    : null}
                  cacheKey={`detail-${image.id}`}
                  alt={image.original_name}
                  className="w-full h-full !border-0 !object-contain"
                  rounded="rounded-none"
                />
              </div>

              {image.download_url && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={downloading}
                    className="fc-btn-primary !py-2 !px-4 text-xs font-bold cursor-pointer flex items-center gap-2 disabled:opacity-60"
                  >
                    {downloading
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Preparing…</>
                      : <><Download className="w-3.5 h-3.5" />Download the full photo</>}
                  </button>
                  {downloadError && <p className="text-xs text-error mt-2">{downloadError}</p>}
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
                    <p className="text-sm font-bold text-ink">{statusLabel(image.display_status)}</p>
                    <p className="text-[11px] text-ink-faint mt-0.5">
                      {accepted ? 'This photo passed every check.'
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
                      <ul className="list-disc list-inside space-y-0.5">
                        {reasons.map(reason => <li key={reason}>{reason}</li>)}
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
                  {image.face_validation?.face_count != null && (
                    <div className="flex justify-between">
                      <span>Faces found:</span>
                      <span className="font-bold text-ink">{image.face_validation.face_count}</span>
                    </div>
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

                <Link
                  to={`/dashboard/processing/${image.batch}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FB923C] hover:underline"
                >
                  See how this upload was processed
                </Link>
              </div>
            </ChartCard>
          </div>
        </div>
      )}
    </div>
  )
}
