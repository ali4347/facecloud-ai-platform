import { PageHeader } from '../../components/layout/PageHeader'
import { GradientButton } from '../../components/ui/GradientButton'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { mockGroups } from '../../data/mock'
import { GitMerge, MoveRight } from 'lucide-react'

export default function IdentityReview() {
  return (
    <div>
      <PageHeader title="Identity Review" subtitle="Review and correct identity groups — merge duplicates, move images." />

      {/* Suggested merges */}
      <div className="fc-card p-5 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <GitMerge className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-semibold text-ink">Suggested Group Merges</h2>
          <StatusBadge status="warning" label="2 suggestions" dot={false} />
        </div>
        <div className="space-y-3">
          {[
            { g1: 'Person 1', g2: 'Person 7', similarity: 94 },
            { g1: 'Person 3', g2: 'Person 9', similarity: 87 },
          ].map((merge, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-background rounded-2xl border border-line">
              <span className="text-sm font-semibold text-ink">{merge.g1}</span>
              <div className="flex items-center gap-2">
                <MoveRight className="w-4 h-4 text-ink-mute" />
                <span className="px-2 py-0.5 bg-amber-100 text-warning text-xs font-bold rounded-full">
                  {merge.similarity}% similar
                </span>
                <MoveRight className="w-4 h-4 text-ink-mute" />
              </div>
              <span className="text-sm font-semibold text-ink">{merge.g2}</span>
              <div className="flex-1" />
              <GradientButton size="sm">Merge Groups</GradientButton>
              <GradientButton variant="secondary" size="sm">Dismiss</GradientButton>
            </div>
          ))}
        </div>
      </div>

      {/* Groups grid */}
      <h2 className="text-sm font-semibold text-ink mb-3">All Identity Groups</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {mockGroups.map(group => (
          <div key={group.id} className="fc-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex gap-1">
                {group.coverImages.slice(0, 3).map((color, i) => (
                  <div key={i} className="w-8 h-8 rounded-lg" style={{ background: color }} />
                ))}
              </div>
              <div className="ml-1">
                <p className="text-sm font-bold text-ink">{group.label}</p>
                <p className="text-xs text-ink-mute">{group.imageCount} images</p>
              </div>
            </div>
            <div className="flex gap-2">
              <GradientButton variant="secondary" size="sm" className="flex-1 justify-center">Move Image</GradientButton>
              <GradientButton variant="ghost" size="sm">View</GradientButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
