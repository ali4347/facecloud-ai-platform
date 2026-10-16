import { Users } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { IdentityGroupCard } from '../../components/features/IdentityGroupCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { ConsentBanner } from '../../components/features/ConsentPrompt'
import { mockGroups } from '../../data/mock'
import { USE_API } from '../../lib/api/config'

export default function IdentityGroups() {
  return (
    <div>
      <PageHeader
        title="Identity Groups"
        subtitle={`${mockGroups.length} identity groups · ${mockGroups.reduce((a, g) => a + g.imageCount, 0)} total images`}
      />

      <ConsentBanner />

      {USE_API && (
        <div className="mb-5 p-3 rounded-2xl text-xs bg-surface-mute border border-line text-ink-soft">
          These folders are examples. Your own Person Folders will appear here once this screen is connected to your account.
        </div>
      )}

      {mockGroups.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No identity groups yet"
          description="Upload images and let FaceNet group them by person identity automatically."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {mockGroups.map(group => (
            <IdentityGroupCard key={group.id} group={group} />
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-soft-blue rounded-2xl border border-accent/30">
        <p className="text-sm font-semibold text-ink mb-1">How identity grouping works</p>
        <p className="text-xs text-ink-mute leading-relaxed">
          FaceCloud uses FaceNet/ArcFace to extract facial embeddings from each validated image.
          Images of the same person are automatically clustered together. The moderator can review
          and correct any grouping errors.
        </p>
      </div>
    </div>
  )
}
