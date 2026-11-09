import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, History, Loader2, RefreshCw, Users } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { IdentityGroupCard } from '../../components/features/IdentityGroupCard'
import { EmptyState } from '../../components/ui/EmptyState'
import { ConsentBanner } from '../../components/features/ConsentPrompt'
import { usePersonFolders } from '../../lib/personFolders'
import { useApiResource } from '../../lib/useApiResource'
import { listReviewItems } from '../../lib/api/identityReview'
import { SuggestedMerges } from '../../components/features/SuggestedMerges'
import { USE_API } from '../../lib/api/config'

export default function IdentityGroups() {
  const { data, loading, error, isDemo, reload } = usePersonFolders()
  const folders = data ?? []
  const totalImages = folders.reduce((sum, folder) => sum + folder.imageCount, 0)
  // Photos the grouping was not sure about wait for the person's decision.
  const review = useApiResource(signal => listReviewItems(signal), () => [], [])
  const waiting = review.data?.length ?? 0

  return (
    <div>
      <PageHeader
        title="Person Folders"
        subtitle={
          loading ? 'Loading…'
          : `${folders.length} person folder${folders.length === 1 ? '' : 's'} · ${totalImages} photo${totalImages === 1 ? '' : 's'}`
        }
        action={USE_API ? <Link to="/dashboard/groups/history" className="fc-btn-secondary !py-2 !px-3 text-xs font-bold inline-flex items-center gap-1.5"><History className="w-3.5 h-3.5" />History</Link> : undefined}
      />

      <SuggestedMerges onMerged={reload} />

      <ConsentBanner />

      {waiting > 0 && (
        <Link to="/dashboard/groups/review"
          className="mb-5 p-4 rounded-2xl flex items-center justify-between gap-3 border border-[#F59E0B]/30 bg-[#F59E0B]/[0.06] hover:bg-[#F59E0B]/10 transition-colors">
          <span className="text-sm text-ink">
            <strong>{waiting} photo{waiting === 1 ? '' : 's'}</strong> need{waiting === 1 ? 's' : ''} your decision: FaceCloud was not sure whose face {waiting === 1 ? 'it shows' : 'they show'}.
          </span>
          <span className="text-xs font-bold text-[#FB923C] inline-flex items-center gap-1 flex-shrink-0">Review <ArrowRight className="w-3.5 h-3.5" /></span>
        </Link>
      )}

      {isDemo && (
        <div className="p-3 mb-5 rounded-2xl text-xs flex items-center gap-2 bg-surface-mute border border-line text-ink-soft">
          <AlertTriangle className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
          Showing demo data. Set <code className="fc-kbd">VITE_USE_API=true</code> to see your real Person Folders.
        </div>
      )}

      {loading && (
        <div className="text-center py-20 text-ink-faint">
          <Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin" />
          <p className="text-xs font-semibold">Loading your Person Folders…</p>
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-20">
          <AlertTriangle className="w-7 h-7 mx-auto mb-3 text-[#EF4444]" />
          <p className="text-xs font-semibold text-ink">{error}</p>
          <button
            type="button" onClick={reload}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#FB923C] hover:underline cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />Try again
          </button>
        </div>
      )}

      {!loading && !error && folders.length === 0 && (
        <EmptyState
          icon={Users}
          title="No Person Folders yet"
          description="Once face grouping is on, photos of the same person are filed together here as you upload them."
        />
      )}

      {!loading && !error && folders.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
          {folders.map(folder => <IdentityGroupCard key={folder.id} folder={folder} />)}
        </div>
      )}

      <div className="mt-6 p-4 bg-soft-blue rounded-2xl border border-accent/30">
        <p className="text-sm font-semibold text-ink mb-1">How Person Folders work</p>
        <p className="text-xs text-ink-mute leading-relaxed">
          FaceCloud finds the faces in each accepted photo and files photos of the same person together.
          When it is not sure, the photo waits for your decision under Review matches, and you can also merge two folders yourself.
        </p>
      </div>
    </div>
  )
}
