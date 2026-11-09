import { useState } from 'react'
import { GitMerge, Loader2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApiResource } from '../../lib/useApiResource'
import { listSuggestedMerges, mergeIdentityGroups, type SuggestedMerge } from '../../lib/api/identities'
import { USE_API } from '../../lib/api/config'

/**
 * Folders that may be the same person ("Person 003 and Person 001 are 87% alike"). Photos are grouped one after the other, so the first ones of a
 * batch can open separate folders before later ones show they match. Nothing is merged unless the person says so.
 */
export function SuggestedMerges({ onMerged }: { onMerged: () => void }) {
  const suggestions = useApiResource(signal => listSuggestedMerges(signal), () => [] as SuggestedMerge[], [], { skip: !USE_API })
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const key = (pair: SuggestedMerge) => `${pair.source_group}-${pair.target_group}`
  const rows = (suggestions.data ?? []).filter(pair => !dismissed.has(key(pair)))
  if (!USE_API || rows.length === 0) return null

  const merge = async (pair: SuggestedMerge) => {
    setBusy(key(pair)); setError('')
    try { await mergeIdentityGroups(pair.target_group, pair.source_group); suggestions.reload(); onMerged() }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not merge the folders.') } finally { setBusy(null) }
  }

  return (
    <section aria-label="Folders that may be the same person" className="mb-5 p-4 rounded-2xl border border-accent/30 bg-accent/[0.05] space-y-3">
      <p className="text-sm font-semibold text-ink flex items-center gap-2"><GitMerge className="w-4 h-4 text-accent" />{rows.length} pair{rows.length === 1 ? '' : 's'} of folders may be the same person</p>
      <ul className="space-y-2">
        {rows.slice(0, 5).map(pair => (
          <li key={key(pair)} className="flex flex-wrap items-center gap-2 text-xs text-ink-mute">
            <span className="flex-1 min-w-0"><Link to={`/dashboard/groups/${pair.source_group}`} className="font-semibold text-ink hover:text-accent">{pair.source.display_name}</Link> ({pair.source.member_count}) and <Link to={`/dashboard/groups/${pair.target_group}`} className="font-semibold text-ink hover:text-accent">{pair.target.display_name}</Link> ({pair.target.member_count}) · {Math.round(pair.similarity * 100)}% alike</span>
            <button type="button" onClick={() => void merge(pair)} disabled={busy !== null} className="fc-btn-primary !py-1.5 !px-3 text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-60 cursor-pointer">{busy === key(pair) ? <Loader2 className="w-3 h-3 animate-spin" /> : <GitMerge className="w-3 h-3" />}Merge</button>
            <button type="button" onClick={() => setDismissed(current => new Set(current).add(key(pair)))} aria-label="Not the same person" title="Not the same person" className="p-1.5 rounded-lg border border-line hover:bg-surface-mute cursor-pointer"><X className="w-3 h-3" /></button>
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
    </section>
  )
}
