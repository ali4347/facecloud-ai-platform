import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import type { ReasonGroup } from '../../lib/uploadBatch'

interface RejectionBreakdownProps {
  groups: ReasonGroup[]
  loading: boolean
}

/** Why some photos of an upload were not accepted, in plain words, with the photos behind each reason. */
export function RejectionBreakdown({ groups, loading }: RejectionBreakdownProps) {
  if (!loading && groups.length === 0) return null
  return (
    <div className="p-4 rounded-2xl bg-surface-mute border border-line space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint flex items-center gap-2">
        Why some photos were not accepted
        {loading && <Loader2 className="w-3 h-3 animate-spin" />}
      </p>
      {groups.map(group => (
        <div key={group.code} className="text-xs space-y-1">
          <p className="text-ink font-semibold">
            {group.title} <span className="text-ink-faint font-normal">· {group.photos.length} photo{group.photos.length === 1 ? '' : 's'}</span>
          </p>
          {group.hint && <p className="text-ink-mute">{group.hint}</p>}
          <p className="text-ink-faint">
            {group.photos.slice(0, 4).map((photo, i) => (
              <span key={photo.id}>{i > 0 && ', '}<Link to={`/dashboard/images/${photo.id}`} className="hover:text-accent hover:underline">{photo.name}</Link></span>
            ))}
            {group.photos.length > 4 && ` and ${group.photos.length - 4} more`}
          </p>
        </div>
      ))}
    </div>
  )
}
