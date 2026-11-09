import { useEffect, useState } from 'react'
import { AlertTriangle, Copy, Loader2, RefreshCw } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { DuplicateMatchCard, type CardMessage } from '../../components/features/DuplicateMatchCard'
import { LibraryTabs } from '../../components/features/LibraryTabs'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { NeedsApi } from '../../components/ui/NeedsApi'
import { NoticeBar } from '../../components/ui/NoticeBar'
import { Pager } from '../../components/ui/Pager'
import { ApiError } from '../../lib/api/client'
import { countMatchesByDecision, loadMatches, reviewDuplicateMatch, type DuplicateMatch } from '../../lib/api/duplicates'
import { moveToTrash } from '../../lib/api/library'
import { useApiResource } from '../../lib/useApiResource'
import { useNotice } from '../../lib/useNotice'

type Tab = 'review' | 'confirmed' | 'dismissed'

const TABS: { key: Tab; label: string; status: string; empty: { title: string; description: string } }[] = [
  { key: 'review', label: 'To review', status: 'suspected', empty: { title: 'Nothing to review', description: 'When an upload looks like a photo you already have, the pair shows up here for you to decide.' } },
  { key: 'confirmed', label: 'Confirmed', status: 'confirmed', empty: { title: 'No pairs confirmed yet', description: 'Pairs you mark as “Same photo” are listed here. An identical file uploaded twice is confirmed for you.' } },
  { key: 'dismissed', label: 'Not duplicates', status: 'not_duplicate', empty: { title: 'No dismissed pairs', description: 'Pairs you mark as “Not a duplicate” are listed here, so you can change your mind.' } },
]

const PER_PAGE = 10
const NO_MATCHES: DuplicateMatch[] = []
const NO_COUNTS = { suspected: 0, confirmed: 0, not_duplicate: 0 }

/**
 * Photos the duplicate check thinks are the same, one card per pair. The person decides each: the same photo, or not a duplicate.
 * Deciding changes nothing else; moving a copy to the trash is its own confirmed step.
 */
export default function Duplicates() {
  const [tab, setTab] = useState<Tab>('review')
  const [page, setPage] = useState(1)
  const current = TABS.find(t => t.key === tab) ?? TABS[0]
  /* The server lists the matches with one decision at a time (`review_status`), newest first, so each filter is its own list; how many there are in each
     is asked apart (a count each), so the three filters show their numbers whichever one is open. */
  const feed = useApiResource(signal => loadMatches(current.status, signal), () => NO_MATCHES, [tab])
  const totals = useApiResource(signal => countMatchesByDecision(signal), () => NO_COUNTS, [])

  /* A decision is kept here and shown on its card in place: the card stays where it is until the person moves to another filter or reloads, and
     then the list is the server's again. */
  const [decided, setDecided] = useState<Record<number, DuplicateMatch>>({})
  const [busy, setBusy] = useState<Record<number, 'confirmed' | 'not_duplicate'>>({})
  const [messages, setMessages] = useState<Record<number, CardMessage>>({})
  useEffect(() => { setDecided({}); setMessages({}) }, [feed.data])
  const { notice, setNotice, ok } = useNotice()

  const all = (feed.data ?? NO_MATCHES).map(match => decided[match.id] ?? match)
  const pages = Math.max(1, Math.ceil(all.length / PER_PAGE))
  const shownPage = Math.min(page, pages)
  const rows = all.slice((shownPage - 1) * PER_PAGE, shownPage * PER_PAGE)
  const reloadAll = () => { feed.reload(); totals.reload() }

  const choose = (key: Tab) => { setTab(key); setPage(1) }

  const decide = async (match: DuplicateMatch, status: 'confirmed' | 'not_duplicate') => {
    setBusy(current => ({ ...current, [match.id]: status }))
    setMessages(current => { const next = { ...current }; delete next[match.id]; return next })
    try {
      const updated = await reviewDuplicateMatch(match.id, status)
      setDecided(current => ({ ...current, [match.id]: updated }))
      totals.reload()
      setMessages(current => ({ ...current, [match.id]: { kind: 'ok', text: status === 'confirmed' ? 'Marked as the same photo. Nothing was deleted or moved.' : 'Marked as not a duplicate. Nothing was changed.' } }))
    } catch (caught) {
      const gone = caught instanceof ApiError && caught.isNotFound
      setMessages(current => ({ ...current, [match.id]: { kind: 'error', text: gone ? 'This pair is no longer there; one of its photos may have been moved to the trash. The list was refreshed.' : caught instanceof Error ? caught.message : 'Could not save your decision.' } }))
      if (gone) reloadAll()
    } finally {
      setBusy(current => { const next = { ...current }; delete next[match.id]; return next })
    }
  }

  /* The optional second step after "Same photo": move one of the two to the trash, only when the person picks which and confirms. */
  const [trashing, setTrashing] = useState<DuplicateMatch | null>(null)
  const [copy, setCopy] = useState<number | null>(null)
  const [trashBusy, setTrashBusy] = useState(false)
  const [trashError, setTrashError] = useState('')
  const startTrash = (match: DuplicateMatch) => { setTrashing(match); setCopy(null); setTrashError('') }
  const trashCopy = async () => {
    if (!trashing || copy === null) return
    const name = copy === trashing.source_image ? trashing.source_filename : trashing.matched_filename
    setTrashBusy(true); setTrashError('')
    try {
      const result = await moveToTrash([copy])
      const skipped = result.skipped[0]
      if (skipped) {
        setTrashError(skipped.reason === 'still_processing' ? 'This photo is still being processed. Try again in a moment.' : 'A moderator has not decided this photo yet, so it cannot be moved to the trash.')
        return
      }
      setTrashing(null)
      ok(`${name} is in the trash. You can put it back from the Trash for a while.`)
      reloadAll()
    } catch (caught) {
      setTrashError(caught instanceof Error ? caught.message : 'Could not move this photo to the trash.')
    } finally {
      setTrashBusy(false)
    }
  }

  // While the numbers are loading, or could not be loaded, there is nothing true to show: no zeros.
  const counted = totals.data !== null && !totals.error
  const total = (key: Tab) => totals.data?.[TABS.find(t => t.key === key)!.status as keyof typeof NO_COUNTS] ?? 0
  return (
    <NeedsApi title="Duplicates" icon={Copy}>
      <div className="page-enter">
        <PageHeader title="Duplicates" subtitle={counted ? `${total('review')} to review · ${total('confirmed')} confirmed` : feed.loading ? 'Loading…' : undefined} />
        <LibraryTabs />
        <p className="text-xs text-ink-mute mb-4">FaceCloud compares every upload with your other photos. Say here whether two photos really are the same. Deciding never deletes or moves anything.</p>

        <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Show">
          {TABS.map(t => (
            <button key={t.key} type="button" onClick={() => choose(t.key)} aria-pressed={tab === t.key}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${tab === t.key ? 'bg-accent-tint text-accent-soft border-accent/30' : 'border-line text-ink-mute hover:text-ink'}`}>
              {t.label}{counted ? ` (${total(t.key)})` : ''}
            </button>
          ))}
        </div>

        {feed.loading && <div className="text-center py-20 text-ink-faint" role="status"><Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin" /><p className="text-xs font-semibold">Loading your matches…</p></div>}
        {!feed.loading && feed.error && (
          <div className="text-center py-20"><AlertTriangle className="w-7 h-7 mx-auto mb-3 text-[#EF4444]" /><p role="alert" className="text-xs font-semibold text-ink">{feed.error}</p>
            <button type="button" onClick={reloadAll} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#FB923C] hover:underline cursor-pointer"><RefreshCw className="w-3.5 h-3.5" />Try again</button></div>
        )}
        {!feed.loading && !feed.error && feed.data && (
          rows.length === 0 ? <EmptyState icon={Copy} title={current.empty.title} description={current.empty.description} /> : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {rows.map(match => (
                  <DuplicateMatchCard key={match.id} match={match} busy={busy[match.id] ?? null} message={messages[match.id] ?? null}
                    onDecide={status => void decide(match, status)} onTrash={() => startTrash(match)} />
                ))}
              </div>
              <Pager page={shownPage} hasNext={shownPage < pages} hasPrevious={shownPage > 1} onPage={setPage} />
            </>
          )
        )}

        {notice && <div className="sticky bottom-24 z-30 mt-6"><NoticeBar notice={notice} onDismiss={() => setNotice(null)} /></div>}

        {trashing && (
          <ConfirmDialog title="Move one copy to the trash?" confirmLabel="Move to trash" busyLabel="Moving…" danger busy={trashBusy} error={trashError}
            confirmDisabled={copy === null} onConfirm={() => void trashCopy()} onCancel={() => setTrashing(null)}>
            <p>Choose which of the two to move. The other one stays where it is. You can put the copy back from the Trash for a while; after that it is deleted for good.</p>
            <fieldset className="space-y-2 pt-1">
              <legend className="sr-only">Which photo to move to the trash</legend>
              {[{ id: trashing.source_image, name: trashing.source_filename }, { id: trashing.matched_image, name: trashing.matched_filename }].map(option => (
                <label key={option.id} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-line cursor-pointer hover:border-accent/40 has-[:checked]:border-accent has-[:checked]:bg-accent-tint">
                  <input type="radio" name="copy-to-trash" checked={copy === option.id} onChange={() => setCopy(option.id)} className="accent-[#F97316]" />
                  <span className="text-sm text-ink break-all">{option.name}</span>
                </label>
              ))}
            </fieldset>
          </ConfirmDialog>
        )}
      </div>
    </NeedsApi>
  )
}
