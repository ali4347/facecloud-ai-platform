import { Users, ChevronRight } from 'lucide-react'
import type { IdentityGroup } from '../../data/mock'
import { formatDate } from '../../lib/utils'
import { GradientButton } from '../ui/GradientButton'

interface IdentityGroupCardProps {
  group: IdentityGroup
}

export function IdentityGroupCard({ group }: IdentityGroupCardProps) {
  return (
    <div className="fc-card p-5 hover:shadow-card-md transition-shadow duration-200">
      {/* Cover thumbnails */}
      <div className="flex gap-1.5 mb-4 h-20">
        {group.coverImages.slice(0, 3).map((color: string, i: number) => (
          <div
            key={i}
            className="flex-1 rounded-2xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}99 100%)` }}
          >
            <svg width="24" height="32" viewBox="0 0 24 32" fill="none">
              <ellipse cx="12" cy="16" rx="8" ry="10" fill="rgba(255,255,255,0.3)" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
              <circle cx="9" cy="13" r="2" fill="rgba(255,255,255,0.5)" />
              <circle cx="15" cy="13" r="2" fill="rgba(255,255,255,0.5)" />
              <path d="M8 19.5 Q12 22 16 19.5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            </svg>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-lg bg-soft-blue flex items-center justify-center">
          <Users className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-base font-bold text-dark">{group.label}</span>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div>
          <span className="text-2xl font-bold text-dark">{group.imageCount}</span>
          <span className="text-sm text-muted ml-1.5">images</span>
        </div>
        <GradientButton variant="ghost" size="sm" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
          View
        </GradientButton>
      </div>
      <p className="text-xs text-muted mt-2">Updated {formatDate(group.lastUpdated)}</p>
    </div>
  )
}
