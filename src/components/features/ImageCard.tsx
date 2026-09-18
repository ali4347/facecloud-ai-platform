import { Eye, Download, ZapIcon } from 'lucide-react'
import type { ImageRecord } from '../../data/mock'
import { formatDateTime } from '../../lib/utils'
import { uploadStatusBadge } from '../ui/StatusBadge'

interface ImageCardProps {
  image: ImageRecord
  onView?: () => void
}

export function ImageCard({ image, onView }: ImageCardProps) {
  return (
    <div className="fc-card overflow-hidden group hover:shadow-card-md transition-all duration-200">
      {/* Thumbnail */}
      <div
        className="h-44 relative flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${image.thumbnail} 0%, ${image.thumbnail}99 100%)` }}
      >
        {/* Mock face SVG */}
        <svg width="60" height="80" viewBox="0 0 60 80" fill="none">
          <ellipse cx="30" cy="40" rx="22" ry="28" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.36)" strokeWidth="1.5" />
          <circle cx="22" cy="34" r="4" fill="rgba(255,255,255,0.36)" />
          <circle cx="38" cy="34" r="4" fill="rgba(255,255,255,0.36)" />
          <path d="M22 50 Q30 56 38 50" stroke="rgba(255,255,255,0.36)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>

        {/* Overlay actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button onClick={onView} className="p-2 bg-surface rounded-xl hover:bg-white shadow-sm">
            <Eye className="w-4 h-4 text-ink" />
          </button>
          <button className="p-2 bg-surface rounded-xl hover:bg-white shadow-sm">
            <Download className="w-4 h-4 text-ink" />
          </button>
        </div>

        {/* Enhanced badge */}
        {image.enhanced && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-accent/90 rounded-full">
            <ZapIcon className="w-3 h-3 text-ink" />
            <span className="text-[10px] text-ink font-semibold">Enhanced</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-semibold text-ink truncate mb-1">{image.filename}</p>
        <div className="flex items-center justify-between">
          {uploadStatusBadge(image.status)}
          <span className="text-xs text-ink-mute">{image.size}</span>
        </div>
        {image.rejectionReason && (
          <p className="text-xs text-error mt-1.5 truncate">⚠ {image.rejectionReason}</p>
        )}
        <p className="text-xs text-ink-mute mt-1">{formatDateTime(image.uploadedAt)}</p>
      </div>
    </div>
  )
}
