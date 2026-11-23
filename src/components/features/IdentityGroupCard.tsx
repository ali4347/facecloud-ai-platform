import { Users, ChevronRight, UserCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AuthedImage } from '../ui/AuthedImage'
import { getPhotoPicture } from '../../lib/api/images'
import type { FolderView } from '../../lib/personFolders'
import { formatDate } from '../../lib/utils'

interface IdentityGroupCardProps {
  folder: FolderView
}

/** The folder's photos as a small mosaic: one full tile, two halves, or a 2 × 2 grid. */
function CoverMosaic({ folder }: { folder: FolderView }) {
  const ids = folder.coverImageIds.slice(0, 4)
  return (
    <div className={`absolute inset-0 grid gap-0.5 ${ids.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {ids.map((imageId, index) => (
        <div key={imageId} className={ids.length === 3 && index === 0 ? 'row-span-2' : ''}>
          <AuthedImage
            load={signal => getPhotoPicture(imageId, 256, signal)}          // the enhanced picture when there is one
            cacheKey={`cover-enhanced-${imageId}`}
            alt=""
            className="w-full h-full !border-0"
            rounded="rounded-none"
          />
        </div>
      ))}
    </div>
  )
}

export function IdentityGroupCard({ folder }: IdentityGroupCardProps) {
  return (
    <div className="fc-card p-5 hover:shadow-card-md transition-all duration-200 hover:-translate-y-0.5 flex flex-col">
      <div className="relative mb-4 h-36 rounded-2xl overflow-hidden flex-shrink-0 bg-surface-mute">
        {folder.coverImageIds.length > 0 ? (
          <CoverMosaic folder={folder} />
        ) : folder.demoCover ? (
          /* Demo data: a colour block styled as a portrait card. */
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${folder.demoCover.color} 0%, ${folder.demoCover.color}99 100%)` }}
          >
            <svg width="56" height="72" viewBox="0 0 56 72" fill="none" className="opacity-60">
              <ellipse cx="28" cy="28" rx="20" ry="24" fill="rgb(var(--a-ink-faint))" stroke="rgb(var(--a-ink-mute))" strokeWidth="1.5" />
              <circle cx="21" cy="24" r="4" fill="rgb(var(--a-ink-mute))" />
              <circle cx="35" cy="24" r="4" fill="rgb(var(--a-ink-mute))" />
              <path d="M18 36 Q28 42 38 36" stroke="rgb(var(--a-ink-mute))" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M8 72 C8 56 48 56 48 72" fill="rgb(var(--a-line))" />
            </svg>
            {folder.demoCover.dimensions && (
              <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/40 text-[9px] text-white font-mono font-bold tracking-wider">
                {folder.demoCover.dimensions}
              </span>
            )}
          </div>
        ) : (
          /* A live folder none of whose photos can be previewed. */
          <div className="absolute inset-0 flex items-center justify-center">
            <UserCircle className="w-12 h-12 opacity-30 text-ink" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-lg bg-soft-blue flex items-center justify-center flex-shrink-0">
          <Users className="w-3.5 h-3.5 text-accent" />
        </div>
        <span className="text-base font-bold text-ink truncate" title={folder.label}>{folder.label}</span>
      </div>

      <div className="flex items-center justify-between mt-2">
        <div>
          <span className="text-2xl font-bold text-ink">{folder.imageCount}</span>
          <span className="text-sm text-ink-mute ml-1.5">image{folder.imageCount === 1 ? '' : 's'}</span>
        </div>
        <Link
          to={`/dashboard/groups/${folder.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent-deep transition-colors px-3 py-1.5 rounded-lg bg-accent/10 hover:bg-accent/20 border border-accent/20"
        >
          View
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <p className="text-xs text-ink-mute mt-2">Updated {formatDate(folder.updatedAt)}</p>
    </div>
  )
}
