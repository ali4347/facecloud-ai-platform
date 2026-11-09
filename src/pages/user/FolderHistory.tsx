import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, History, Loader2 } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { EmptyState } from '../../components/ui/EmptyState'
import { NeedsApi } from '../../components/ui/NeedsApi'
import { Pager } from '../../components/ui/Pager'
import { useApiResource } from '../../lib/useApiResource'
import { listIdentityHistory, type IdentityChange, type IdentityChangeAction } from '../../lib/api/identities'
import type { Page } from '../../lib/api/images'
import { formatDateTime } from '../../lib/utils'

const WORDS: Record<IdentityChangeAction, string> = {
  renamed: 'Renamed a folder', merged: 'Merged two folders', moved: 'Moved a photo to another folder', removed: 'Took a photo out of a folder',
  profile_set: 'Chose a folder cover', deleted: 'Deleted a folder', reviewed: 'Decided a match', archived: 'A folder with no photos was archived',
}
const detail = (change: IdentityChange): string => {
  const name = (value: Record<string, unknown> | null) => (value && typeof value.display_name === 'string' ? value.display_name : '')
  if (change.action === 'renamed') return [name(change.before), name(change.after)].filter(Boolean).join(' to ')
  return change.reason
}

/** What was changed in the person folders, and when. There is no undo: to reverse a change, do the opposite (move the photo back). */
export default function FolderHistory() {
  const [page, setPage] = useState(1)
  const history = useApiResource(signal => listIdentityHistory(page, signal), () => ({ count: 0, next: null, previous: null, results: [] as IdentityChange[] }) as Page<IdentityChange>, [page])
  const rows = history.data?.results ?? []
  return (
    <NeedsApi title="Folder history" icon={History}>
      <div className="page-enter">
        <Link to="/dashboard/groups" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-mute hover:text-ink mb-3"><ArrowLeft className="w-3.5 h-3.5" />Person Folders</Link>
        <PageHeader title="Folder history" subtitle="Renames, merges, moves and decisions" />
        {history.loading && <div className="text-center py-20 text-ink-faint"><Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin" /></div>}
        {!history.loading && history.error && <p role="alert" className="text-xs text-red-500 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{history.error}</p>}
        {!history.loading && !history.error && rows.length === 0 && <EmptyState icon={History} title="Nothing has changed yet" description="When you rename, merge or move things in your person folders, it is listed here." />}
        {rows.length > 0 && (
          <ul className="space-y-2">
            {rows.map(change => (
              <li key={change.id} className="fc-card px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="text-sm font-semibold text-ink">{WORDS[change.action] ?? change.action}</span>
                {detail(change) && <span className="text-xs text-ink-mute flex-1 min-w-0 truncate">{detail(change)}</span>}
                {change.group && <Link to={`/dashboard/groups/${change.group}`} className="text-xs font-semibold text-accent hover:underline">Open folder</Link>}
                <span className="text-[11px] text-ink-faint ml-auto">{formatDateTime(change.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
        <Pager page={page} hasNext={Boolean(history.data?.next)} hasPrevious={Boolean(history.data?.previous)} onPage={setPage} />
      </div>
    </NeedsApi>
  )
}
