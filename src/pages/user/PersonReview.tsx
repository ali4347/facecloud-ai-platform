import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Check, Loader2, RefreshCw, UserPlus, Users, X } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { AuthedImage } from '../../components/ui/AuthedImage'
import { EmptyState } from '../../components/ui/EmptyState'
import { USE_API } from '../../lib/api/config'
import { ApiError } from '../../lib/api/client'
import { getImageThumbnail } from '../../lib/api/images'
import { listReviewItems, reviewAssignment, type ReviewDecision, type ReviewItem } from '../../lib/api/identityReview'
import { usePersonFolders } from '../../lib/personFolders'

/**
 * The photos the face grouping was not sure about. Each one is shown with the folder it suggests and how close the
 * match was, and the person decides: yes it is them, it is a different person (an existing folder or a new one), or
 * leave the face out. Nothing here is simulated: every choice is sent to the backend and the card goes away only when
 * the backend accepted it.
 */
export default function PersonReview() {
  const folders = usePersonFolders()
  const [items, setItems] = useState<ReviewItem[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [busy, setBusy] = useState<Set<number>>(new Set())
  const [errors, setErrors] = useState<Record<number, string>>({})
  const [picking, setPicking] = useState<number | null>(null)
  const [target, setTarget] = useState<Record<number, string>>({})
  const [done, setDone] = useState(0)

  const load = () => {
    setLoadError('')
    setItems(null)
    listReviewItems().then(setItems).catch(caught => setLoadError(caught instanceof Error ? caught.message : 'Could not load the photos to review.'))
  }
  useEffect(() => { if (USE_API) load() }, [])

  const nameOf = (groupId: number | null) =>
    groupId === null ? null : folders.data?.find(folder => Number(folder.id) === groupId)?.label ?? `Folder ${groupId}`

  const decide = async (item: ReviewItem, decision: ReviewDecision) => {
    setBusy(current => new Set(current).add(item.id))
    setErrors(current => { const next = { ...current }; delete next[item.id]; return next })
    try {
      await reviewAssignment(item.id, decision)
      setItems(current => current && current.filter(other => other.id !== item.id))
      setDone(count => count + 1)
      setPicking(null)
      folders.reload()
    } catch (caught) {
      setErrors(current => ({ ...current, [item.id]: caught instanceof ApiError ? caught.message : 'Could not save that choice.' }))
    } finally {
      setBusy(current => { const next = new Set(current); next.delete(item.id); return next })
    }
  }

  const back = (
    <div className="flex items-center gap-3 mb-1">
      <Link to="/dashboard/groups" aria-label="Back to Person Folders"
        className="p-2 rounded-xl hover:bg-surface-mute border border-line text-ink-mute hover:text-ink"><ArrowLeft className="w-4 h-4" /></Link>
      <PageHeader title="Review matches"
        subtitle={items === null && !loadError ? 'Loading…'
          : `${items?.length ?? 0} photo${items?.length === 1 ? '' : 's'} waiting${done > 0 ? ` · ${done} decided` : ''}`} />
    </div>
  )

  if (!USE_API) {
    return <div className="space-y-6">{back}<EmptyState icon={Users} title="Review needs the live backend" description="This screen is not part of the demo build." /></div>
  }

  return (
    <div className="space-y-6 page-enter">
      {back}
      <p className="text-xs text-ink-mute max-w-2xl">
        When FaceCloud is not sure whose face a photo shows, it waits here for you. Say whether it is the suggested person,
        someone else, or leave that face out of the folders.
      </p>

      {loadError && (
        <div className="fc-card p-10 text-center">
          <AlertTriangle className="w-7 h-7 mx-auto mb-3 text-[#EF4444]" />
          <p className="text-xs font-semibold text-ink">{loadError}</p>
          <button type="button" onClick={load} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#FB923C] hover:underline cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" />Try again
          </button>
        </div>
      )}

      {items === null && !loadError && (
        <div className="text-center py-16 text-ink-faint"><Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin" /><p className="text-xs font-semibold">Loading…</p></div>
      )}

      {items !== null && items.length === 0 && (
        <EmptyState icon={Check} title={done > 0 ? 'All done' : 'Nothing to review'}
          description={done > 0 ? 'Every uncertain match has been decided.' : 'Every photo was filed with confidence.'}
          action={{ label: 'Back to Person Folders', onClick: () => window.location.assign('/dashboard/groups') }} />
      )}

      {items !== null && items.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {items.map(item => {
            const suggestion = nameOf(item.identity_group)
            const working = busy.has(item.id)
            const others = (folders.data ?? []).filter(folder => Number(folder.id) !== item.identity_group)
            return (
              <div key={item.id} className="fc-card overflow-hidden flex flex-col">
                <Link to={`/dashboard/images/${item.image}`} className="block aspect-[4/3] bg-surface-mute" aria-label="Open this photo">
                  <AuthedImage load={signal => getImageThumbnail(item.image, 256, signal)} cacheKey={`review-${item.image}`}
                    alt={`Photo ${item.image}`} className="w-full h-full !border-0 !object-cover" rounded="rounded-none" />
                </Link>
                <div className="p-4 space-y-3 flex-1 flex flex-col">
                  <p className="text-sm text-ink">
                    {suggestion
                      ? <>Looks like <strong>{suggestion}</strong>{item.similarity_score !== null && <span className="text-ink-mute"> · {Math.round(item.similarity_score * 100)}% match</span>}</>
                      : 'No folder looks right for this face.'}
                  </p>

                  {picking !== item.id ? (
                    <div className="flex flex-wrap gap-2 mt-auto">
                      {suggestion && (
                        <button type="button" disabled={working} onClick={() => void decide(item, { action: 'confirm' })}
                          className="fc-btn-primary !py-2 !px-3 text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-60 cursor-pointer">
                          {working ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}Yes, same person
                        </button>
                      )}
                      <button type="button" disabled={working} onClick={() => setPicking(item.id)}
                        className="fc-btn-secondary !py-2 !px-3 text-xs font-bold cursor-pointer disabled:opacity-60">A different person</button>
                      <button type="button" disabled={working} onClick={() => void decide(item, { action: 'reject' })}
                        className="text-xs font-semibold text-ink-mute hover:text-ink inline-flex items-center gap-1 px-1 cursor-pointer disabled:opacity-60">
                        <X className="w-3.5 h-3.5" />Leave this face out
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 mt-auto">
                      {others.length > 0 && (
                        <div className="flex gap-2">
                          <select aria-label="Choose a folder" className="fc-input !py-2 text-xs flex-1" value={target[item.id] ?? ''}
                            onChange={e => setTarget(current => ({ ...current, [item.id]: e.target.value }))}>
                            <option value="" disabled>Choose a folder</option>
                            {others.map(folder => <option key={folder.id} value={folder.id}>{folder.label}</option>)}
                          </select>
                          <button type="button" disabled={working || !target[item.id]}
                            onClick={() => void decide(item, { action: 'select_group', group_id: Number(target[item.id]) })}
                            className="fc-btn-primary !py-2 !px-3 text-xs font-bold disabled:opacity-60 cursor-pointer">Move</button>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <button type="button" disabled={working} onClick={() => void decide(item, { action: 'new_group' })}
                          className="fc-btn-secondary !py-2 !px-3 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
                          <UserPlus className="w-3.5 h-3.5" />Start a new folder
                        </button>
                        <button type="button" onClick={() => setPicking(null)} className="text-xs font-semibold text-ink-mute hover:text-ink cursor-pointer">Back</button>
                      </div>
                    </div>
                  )}
                  {errors[item.id] && <p role="alert" className="text-xs text-red-500">{errors[item.id]}</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
