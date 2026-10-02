import { AuthedImage } from '../ui/AuthedImage'
import { getReviewImage } from '../../lib/api/moderation'

interface ReviewThumbnailProps {
  organizationId: number | null
  reviewId: number
  /** Longest edge to ask the API for; must be one the backend allows. */
  size?: number
  /** Rendered size in pixels. */
  box?: number
  alt: string
}

/** The photo behind a moderator review. See AuthedImage for why it is fetched. */
export function ReviewThumbnail({
  organizationId, reviewId, size = 256, box = 40, alt,
}: ReviewThumbnailProps) {
  return (
    <AuthedImage
      load={organizationId === null
        ? null
        : signal => getReviewImage(organizationId, reviewId, size, signal)}
      cacheKey={`review-${organizationId}-${reviewId}-${size}`}
      box={box}
      alt={alt}
    />
  )
}
