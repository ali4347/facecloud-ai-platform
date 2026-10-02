import { useEffect, useState } from 'react'
import { ImageOff, Loader2 } from 'lucide-react'
import { getReviewImage } from '../../lib/api/moderation'
import { USE_API } from '../../lib/api/config'

interface ReviewThumbnailProps {
  organizationId: number | null
  reviewId: number
  /** Longest edge to ask the API for; must be one the backend allows. */
  size?: number
  /** Rendered size in pixels. */
  box?: number
  alt: string
}

/**
 * The photo behind a review.
 *
 * The API authenticates with a bearer header, which `<img src>` cannot send, so
 * the bytes are fetched and handed to the browser as an object URL — and
 * revoked again when this unmounts or the review changes, or the page would
 * hold on to every thumbnail it has ever shown.
 *
 * A review whose file is missing answers 404, which is a photo that cannot be
 * previewed rather than an error worth shouting about: it falls back to the
 * same placeholder as the demo data.
 */
export function ReviewThumbnail({
  organizationId, reviewId, size = 256, box = 40, alt,
}: ReviewThumbnailProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [loading, setLoading] = useState(USE_API && organizationId !== null)

  useEffect(() => {
    if (!USE_API || organizationId === null) {
      setLoading(false)
      return
    }
    const controller = new AbortController()
    let objectUrl: string | null = null
    setLoading(true)
    setFailed(false)
    getReviewImage(organizationId, reviewId, size, controller.signal)
      .then(blob => {
        if (controller.signal.aborted) return
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => {
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      setUrl(null)
    }
  }, [organizationId, reviewId, size])

  const style = { width: box, height: box }

  if (url) {
    return (
      <img
        src={url}
        alt={alt}
        style={style}
        className="rounded-xl border border-line object-cover flex-shrink-0"
      />
    )
  }

  if (loading) {
    return (
      <div
        style={style}
        className="rounded-xl border border-line bg-surface-mute flex items-center justify-center flex-shrink-0"
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin text-ink-faint" />
      </div>
    )
  }

  /* No preview: either the demo has no real files, or the photo is gone. The
     tint is derived from the review id so a row keeps the same colour between
     renders instead of flickering. */
  const hue = (reviewId * 47) % 360
  return (
    <div
      style={{ ...style, background: `hsl(${hue} 55% 42% / 0.35)` }}
      className="rounded-xl border border-line flex items-center justify-center flex-shrink-0"
      title={failed ? 'This photo is no longer available' : 'No preview in demo data'}
    >
      <ImageOff className="w-3.5 h-3.5 text-ink-faint" />
    </div>
  )
}
