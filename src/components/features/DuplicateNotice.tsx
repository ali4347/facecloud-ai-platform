import { Link } from 'react-router-dom'
import { Copy } from 'lucide-react'
import { listDuplicateMatches } from '../../lib/api/duplicates'
import { useApiResource } from '../../lib/useApiResource'

const KIND: Record<string, string> = { exact: 'The same file', near: 'Almost the same photo', similar: 'A similar photo', face: 'The same face' }

/** Other photos this one looks like, if the duplicate check found any. Renders nothing otherwise. */
export function DuplicateNotice({ imageId }: { imageId: number }) {
  const { data } = useApiResource(signal => listDuplicateMatches(imageId, signal), () => [], [imageId])
  const matches = data ?? []
  if (matches.length === 0) return null
  return (
    <div className="p-4 rounded-3xl bg-[#F59E0B]/5 border border-[#F59E0B]/25 text-xs space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#FCD34D] flex items-center gap-1.5"><Copy className="w-3.5 h-3.5" />This photo looks like another one</p>
      <ul className="space-y-1">
        {matches.slice(0, 5).map(match => (
          <li key={match.id} className="text-ink-mute">
            <Link to={`/dashboard/images/${match.matched_image}`} className="font-semibold text-ink hover:text-accent hover:underline">{match.matched_filename}</Link>
            {' · '}{KIND[match.match_type] ?? match.match_type.replace(/_/g, ' ')}
            {match.similarity_score !== null ? ` · ${Math.round(match.similarity_score * 100)}% alike` : ''}
          </li>
        ))}
      </ul>
    </div>
  )
}
