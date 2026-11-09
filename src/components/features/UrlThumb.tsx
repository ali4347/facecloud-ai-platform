import { AuthedImage } from '../ui/AuthedImage'
import { apiFetchBlob } from '../../lib/api/client'
import { pathOf } from '../../lib/api/library'

/** A picture the API gave an address for (a cover, a trash thumbnail): fetched with the sign-in token, like every protected image. */
export function UrlThumb({ url, alt, className = 'w-full h-full !border-0', rounded = 'rounded-none' }: { url: string | null | undefined; alt: string; className?: string; rounded?: string }) {
  return <AuthedImage load={url ? signal => apiFetchBlob(pathOf(url), { signal }) : null} cacheKey={url ?? 'none'} alt={alt} className={className} rounded={rounded} />
}
