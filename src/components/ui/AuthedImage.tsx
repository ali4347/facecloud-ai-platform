import { useEffect, useState } from 'react'
import { ImageOff, Loader2 } from 'lucide-react'
import { USE_API } from '../../lib/api/config'

interface AuthedImageProps {
  /** Fetches the bytes. Given an abort signal; must honour it. */
  load: ((signal: AbortSignal) => Promise<Blob>) | null
  /** Changes to this re-fetch; use the image or review id. */
  cacheKey: string | number
  alt: string
  /** Rendered box in pixels, or a className for a non-square layout. */
  box?: number
  className?: string
  rounded?: string
}

/**
 * An image from a protected endpoint.
 *
 * Every image the API serves — a photo, its thumbnail, a review's preview — is
 * behind the bearer token, which `<img src>` cannot send. So the bytes are
 * fetched here and handed to the browser as an object URL, and **revoked**
 * when this unmounts or the key changes; without that the page holds on to
 * every image it has ever shown.
 *
 * A missing file answers 404, which is an image that cannot be previewed
 * rather than an error worth shouting about: it falls back to a placeholder,
 * tinted from the key so a tile keeps its colour between renders instead of
 * flickering.
 */
export function AuthedImage({
  load, cacheKey, alt, box, className, rounded = 'rounded-xl',
}: AuthedImageProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [loading, setLoading] = useState(USE_API && load !== null)

  useEffect(() => {
    if (!USE_API || load === null) {
      setLoading(false)
      return
    }
    const controller = new AbortController()
    let objectUrl: string | null = null
    setLoading(true)
    setFailed(false)
    load(controller.signal)
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
    // `load` is a new closure every render, so the key is what says "re-fetch".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey])

  const sizing = box ? { width: box, height: box } : undefined
  const shared = `${rounded} border border-line flex-shrink-0 ${className ?? ''}`

  if (url) {
    return <img src={url} alt={alt} style={sizing} className={`${shared} object-cover`} />
  }

  if (loading) {
    return (
      <div style={sizing} className={`${shared} bg-surface-mute flex items-center justify-center`}>
        <Loader2 className="w-3.5 h-3.5 animate-spin text-ink-faint" />
      </div>
    )
  }

  const hue = (String(cacheKey).split('').reduce((sum, c) => sum + c.charCodeAt(0), 0) * 47) % 360
  return (
    <div
      style={{ ...sizing, background: `hsl(${hue} 55% 42% / 0.35)` }}
      className={`${shared} flex items-center justify-center`}
      title={failed ? 'This photo is no longer available' : 'No preview in demo data'}
    >
      <ImageOff className="w-3.5 h-3.5 text-ink-faint" />
    </div>
  )
}
