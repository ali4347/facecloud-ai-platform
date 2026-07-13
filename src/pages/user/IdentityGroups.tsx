import { Users } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { IdentityGroupCard } from '../../components/features/IdentityGroupCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { mockGroups } from '../../data/mock'

export default function IdentityGroups() {
  return (
    <div>
      <PageHeader
        title="Identity Groups"
        subtitle={`${mockGroups.length} identity groups · ${mockGroups.reduce((a, g) => a + g.imageCount, 0)} total images`}
      />

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

      <div className="mt-6 p-4 bg-soft-blue rounded-2xl border border-primary-100">
        <p className="text-sm font-semibold text-dark mb-1">How identity grouping works</p>
        <p className="text-xs text-muted leading-relaxed">
          FaceCloud uses FaceNet/ArcFace to extract facial embeddings from each validated image.
          Images of the same person are automatically clustered together. The moderator can review
          and correct any grouping errors.
        </p>
      </div>
    </div>
  )
}
