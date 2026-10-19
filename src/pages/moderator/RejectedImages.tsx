import { PageHeader } from '../../components/layout/PageHeader'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { GradientButton } from '../../components/ui/GradientButton'
import { mockReviewItems } from '../../data/mock'
import { formatDateTime } from '../../lib/utils'
import { Eye } from 'lucide-react'
import { USE_API } from '../../lib/api/config'
import { LiveRejectedImages } from './RejectedImagesLive'

/** The demo build's version: sample rejected photos. */
function DemoRejectedImages() {
  const rejected = mockReviewItems

  return (
    <div>
      <PageHeader title="Rejected Images" subtitle={`${rejected.length} images requiring review`} />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
        {rejected.map(item => (
          <div key={item.id} className="fc-card overflow-hidden group hover:shadow-card-md transition-all duration-200">
            <div className="h-36 relative flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${item.thumbnail} 0%, ${item.thumbnail}99 100%)` }}>
              <svg width="40" height="52" viewBox="0 0 40 52" fill="none">
                <ellipse cx="20" cy="26" rx="14" ry="18" fill="rgb(var(--a-line))" stroke="rgb(var(--a-ink-faint))" strokeWidth="1.5" />
                <circle cx="14" cy="21" r="3.5" fill="rgb(var(--a-ink-faint))" />
                <circle cx="26" cy="21" r="3.5" fill="rgb(var(--a-ink-faint))" />
                <path d="M13 32 Q20 37 27 32" stroke="rgb(var(--a-ink-faint))" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-surface-mute transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button className="p-2 bg-surface rounded-xl">
                  <Eye className="w-4 h-4 text-ink" />
                </button>
              </div>
            </div>
            <div className="p-3">
              <p className="text-xs font-semibold text-ink truncate mb-1">{item.filename}</p>
              <StatusBadge status="error" label={item.rejectionReason} dot={false} className="text-[10px] mb-2 w-full justify-center" />
              <p className="text-[10px] text-ink-mute">{formatDateTime(item.uploadedAt)}</p>
              <GradientButton variant="secondary" size="sm" className="w-full justify-center mt-2 text-[11px]">
                Manual Review
              </GradientButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Live backend: the organization's real rejected photos. Demo build: the sample screen above. */
export default function RejectedImages() {
  return USE_API ? <LiveRejectedImages /> : <DemoRejectedImages />
}
