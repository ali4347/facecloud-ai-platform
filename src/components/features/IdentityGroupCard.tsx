import { Users, ChevronRight, UserCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { IdentityGroup } from '../../data/mock'
import { mockImages } from '../../data/mock'
import { formatDate } from '../../lib/utils'

interface IdentityGroupCardProps {
  group: IdentityGroup
}

export function IdentityGroupCard({ group }: IdentityGroupCardProps) {
  // Resolve representative image:
  // 1. Use representative_image_id if set
  // 2. Fallback: most recently added accepted image in group
  // 3. Fallback: legacy color swatch
  const repImage = (() => {
    if (group.representative_image_id) {
      return mockImages.find(img => img.id === group.representative_image_id) ?? null
    }
    const groupImgs = mockImages
      .filter(img => img.personFolderId === group.id && img.qualityStatus === 'passed')
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    return groupImgs[0] ?? null
  })()

  const fallbackColor = group.coverImages[0] ?? '#6366F1'

  return (
    <div className="fc-card p-5 hover:shadow-card-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col">
      {/* Representative thumbnail */}
      <div className="relative mb-4 h-36 rounded-2xl overflow-hidden flex-shrink-0">
        {repImage ? (
          /* Color swatch styled as a realistic portrait card */
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${repImage.thumbnail} 0%, ${repImage.thumbnail}99 100%)` }}
          >
            {/* Stylised face silhouette to indicate it's a face photo */}
            <svg width="56" height="72" viewBox="0 0 56 72" fill="none" className="opacity-60">
              <ellipse cx="28" cy="28" rx="20" ry="24" fill="#94A3B8" stroke="#64748B" strokeWidth="1.5" />
              <circle cx="21" cy="24" r="4" fill="#64748B" />
              <circle cx="35" cy="24" r="4" fill="#64748B" />
              <path d="M18 36 Q28 42 38 36" stroke="#64748B" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M8 72 C8 56 48 56 48 72" fill="#E6E9EF" />
            </svg>
            {/* Dimension badge */}
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/40 text-[9px] text-white font-mono font-bold tracking-wider">
              {repImage.dimensions}
            </span>
          </div>
        ) : (
          /* No image: gradient fallback with icon */
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${fallbackColor} 0%, ${fallbackColor}66 100%)` }}
          >
            <UserCircle className="w-12 h-12 opacity-30 text-ink" />
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/30 text-[9px] text-white font-mono">No image</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-lg bg-soft-blue flex items-center justify-center flex-shrink-0">
          <Users className="w-3.5 h-3.5 text-accent" />
        </div>
        <span className="text-base font-bold text-ink truncate">{group.label}</span>
      </div>

      <div className="flex items-center justify-between mt-2">
        <div>
          <span className="text-2xl font-bold text-ink">{group.imageCount}</span>
          <span className="text-sm text-ink-mute ml-1.5">images</span>
        </div>
        <Link
          to={`/dashboard/groups/${group.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent-deep transition-colors px-3 py-1.5 rounded-lg bg-accent/10 hover:bg-accent/20 border border-accent/20"
        >
          View
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <p className="text-xs text-ink-mute mt-2">Updated {formatDate(group.lastUpdated)}</p>
    </div>
  )
}
