import { Download, Eye, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { AuthedImage } from '../ui/AuthedImage'
import { uploadStatusBadge } from '../ui/StatusBadge'
import { downloadImage, getImageThumbnail, type ImageListItem } from '../../lib/api/images'
import { formatBytes } from '../../lib/imageData'
import { formatDateTime } from '../../lib/utils'

interface ImageCardProps {
  image: ImageListItem
}

export function ImageCard({ image }: ImageCardProps) {
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState('')

  /* A rejected photo has no thumbnail to serve, so there is nothing to ask for
     — the card shows the placeholder instead of a request that will 404. */
  const canPreview = image.thumbnail_url !== null

  /* The file is behind the bearer token, so it cannot be a plain <a download>:
     the bytes are fetched, handed to the browser, and the object URL revoked
     once the click has been taken. */
  const handleDownload = async () => {
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

  return (
    <div className="fc-card overflow-hidden group hover:shadow-card-md transition-all duration-200">
      <div className="h-44 relative bg-surface-mute">
        <AuthedImage
          load={canPreview ? signal => getImageThumbnail(image.id, 256, signal) : null}
          cacheKey={`image-${image.id}`}
          alt={image.original_name}
          className="w-full h-full !border-0"
          rounded="rounded-none"
        />

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <Link
            to={`/dashboard/images/${image.id}`}
            className="p-2 bg-surface rounded-xl hover:bg-surface-mute shadow-sm"
            aria-label={`Open ${image.original_name}`}
          >
            <Eye className="w-4 h-4 text-ink" />
          </Link>
          {image.download_url && (
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="p-2 bg-surface rounded-xl hover:bg-surface-mute shadow-sm cursor-pointer disabled:opacity-60"
              aria-label={`Download ${image.original_name}`}
            >
              {downloading
                ? <Loader2 className="w-4 h-4 text-ink animate-spin" />
                : <Download className="w-4 h-4 text-ink" />}
            </button>
          )}
        </div>
      </div>

      <div className="p-3">
        <p className="text-sm font-semibold text-ink truncate mb-1" title={image.original_name}>
          {image.original_name}
        </p>
        <div className="flex items-center justify-between gap-2">
          {uploadStatusBadge(image.display_status)}
          <span className="text-xs text-ink-mute flex-shrink-0">{formatBytes(image.file_size)}</span>
        </div>
        {image.rejection_reason && (
          <p className="text-xs text-error mt-1.5 truncate" title={image.rejection_reason}>
            ⚠ {image.rejection_reason}
          </p>
        )}
        {downloadError && <p className="text-xs text-error mt-1.5">{downloadError}</p>}
        <p className="text-xs text-ink-mute mt-1">{formatDateTime(image.created_at)}</p>
      </div>
    </div>
  )
}
