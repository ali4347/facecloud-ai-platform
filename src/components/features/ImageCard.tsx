import { Download, Eye, Loader2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useState, type MouseEvent } from 'react'
import { AuthedImage } from '../ui/AuthedImage'
import { uploadStatusBadge } from '../ui/StatusBadge'
import { downloadImage, getPhotoPicture, photoStatus, type ImageListItem } from '../../lib/api/images'
import { formatBytes } from '../../lib/imageData'
import { formatDateTime } from '../../lib/utils'
import { photoTitle } from '../../lib/photoTitle'
import { USE_API } from '../../lib/api/config'
import { FavoriteButton } from './FavoriteButton'
import { AccessChip } from '../downloads/StatusChips'
import type { EligibilityItem } from '../../lib/api/downloads'

interface ImageCardProps {
  image: ImageListItem
  /** Show a checkbox so the photo can be picked along with others. */
  selectable?: boolean
  selected?: boolean
  onToggleSelect?: () => void
  /** Told when the heart is pressed, so a list that shows only favourites can drop the photo. */
  onFavoriteChange?: (next: boolean) => void
  /** For a photo whose organization requires download approval: what requests/check/ said about it. */
  access?: EligibilityItem
}

export function ImageCard({ image, selectable = false, selected = false, onToggleSelect, onFavoriteChange, access }: ImageCardProps) {
  /* Its organization requires approval: the preview is the server's reduced, watermarked copy until an approval is held. */
  const needsApproval = Boolean(image.download_approval_required)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState('')
  const navigate = useNavigate()

  /* A click anywhere on the card opens the photo, except on the card's own controls (checkbox, heart, eye, download), which do their own job. */
  const openPhoto = (event: MouseEvent) => {
    if ((event.target as HTMLElement).closest('a, button, label, input')) return
    navigate(`/dashboard/images/${image.id}`)
  }

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
    <div onClick={openPhoto} className={`fc-card overflow-hidden group hover:shadow-card-md transition-all duration-200 cursor-pointer ${
      selected ? 'ring-2 ring-accent' : ''
    }`}>
      <div className="h-44 relative bg-surface-mute">
        {selectable && (
          <label
            className="absolute top-2 left-2 z-10 w-6 h-6 rounded-lg bg-surface/90 border border-line shadow-sm flex items-center justify-center cursor-pointer"
            title={`Select ${image.original_name}`}
          >
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggleSelect}
              className="w-4 h-4 accent-[#F97316] cursor-pointer"
              aria-label={`Select ${image.original_name}`}
            />
          </label>
        )}

        {USE_API && canPreview && (
          <FavoriteButton imageId={image.id} value={Boolean(image.is_favorite)} onChange={onFavoriteChange} className="absolute top-2 right-2 z-10" />
        )}

        <AuthedImage
          load={canPreview ? signal => getPhotoPicture(image.id, 256, signal) : null}
          cacheKey={`image-${image.id}-${image.latest_enhancement?.id ?? 'none'}`}
          alt={image.original_name}
          className="w-full h-full !border-0"
          rounded="rounded-none"
          restricted={needsApproval && access?.access_state !== 'granted'}
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
              title={needsApproval ? 'Needs a moderator’s approval in this organization' : undefined}
            >
              {downloading
                ? <Loader2 className="w-4 h-4 text-ink animate-spin" />
                : <Download className="w-4 h-4 text-ink" />}
            </button>
          )}
        </div>
      </div>

      <div className="p-3">
        <p className="text-sm font-semibold text-ink truncate mb-1" title={`${photoTitle(image)} (${image.original_name})`}>
          {photoTitle(image)}
        </p>
        <div className="flex items-center justify-between gap-2">
          {uploadStatusBadge(photoStatus(image))}
          <span className="text-xs text-ink-mute flex-shrink-0">{formatBytes(image.file_size)}</span>
        </div>
        {image.rejection_reason && (
          <p className="text-xs text-error mt-1.5 truncate" title={image.rejection_reason}>
            ⚠ {image.rejection_reason}
          </p>
        )}
        {needsApproval && access && (
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <AccessChip state={access.access_state} title={access.detail || undefined} />
            {!access.eligible && access.access_state === 'not_requested' && (
              <span className="text-[10px] text-ink-faint truncate" title={access.detail}>{access.detail || 'Cannot be requested yet'}</span>
            )}
          </div>
        )}
        {downloadError && <p className="text-xs text-error mt-1.5">{downloadError}</p>}
        <p className="text-xs text-ink-mute mt-1">{formatDateTime(image.taken_at ?? image.created_at)}</p>
      </div>
    </div>
  )
}
