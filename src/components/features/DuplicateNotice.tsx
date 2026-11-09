import { Link } from 'react-router-dom'
import { Copy } from 'lucide-react'
import { listDuplicateMatches } from '../../lib/api/duplicates'
import { matchKind, reviewTone, reviewWords } from '../../lib/duplicateLabels'
import { useApiResource } from '../../lib/useApiResource'

/**
 * Other photos this one looks like, if the duplicate check found any, with the decision on each. Renders nothing otherwise.
 * `similarity_score` is already a percentage (an exact match is 100). The server lists a pair under both of its photos, so the
 * "other" photo is whichever of the two this one is not.
 */
export function DuplicateNotice({ imageId, refresh = 0 }: { imageId: number; refresh?: number }) {
  const { data } = useApiResource(signal => listDuplicateMatches(imageId, signal), () => [], [imageId, refresh])
  const matches = data ?? []
  if (matches.length === 0) return null
  const open = matches.some(match => match.review_status !== 'not_duplicate')
  return (
    <div className="p-4 rounded-3xl bg-[#F59E0B]/5 border border-[#F59E0B]/25 text-xs space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#B45309] [html[data-theme=dark]_&]:text-[#FCD34D] flex items-center gap-1.5">
        <Copy className="w-3.5 h-3.5" />{open ? 'This photo looks like another one' : 'You said these look-alikes are different photos'}
      </p>
      <ul className="space-y-1.5">
        {matches.slice(0, 5).map(match => {
          const otherIsMatched = match.source_image === imageId
          const other = otherIsMatched ? { id: match.matched_image, name: match.matched_filename } : { id: match.source_image, name: match.source_filename }
          return (
            <li key={match.id} className="text-ink-mute flex flex-wrap items-center gap-x-1.5 gap-y-1">
              <Link to={`/dashboard/images/${other.id}`} className="font-semibold text-ink hover:text-accent hover:underline break-all">{other.name}</Link>
              <span>· {matchKind(match.match_type)}{match.similarity_score !== null ? ` · ${Math.round(match.similarity_score)}% alike` : ''}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${reviewTone(match.review_status)}`}>{reviewWords(match.review_status)}</span>
            </li>
          )
        })}
      </ul>
      {matches.length > 5 && <p className="text-ink-mute">and {matches.length - 5} more</p>}
      <Link to="/dashboard/duplicates" className="inline-block font-bold text-[#FB923C] hover:underline">Review duplicates</Link>
    </div>
  )
}
