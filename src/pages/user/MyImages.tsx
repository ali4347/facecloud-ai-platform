import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, FolderPlus, Heart, Images, Loader2, RefreshCw, ScanFace, Trash2, X } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ImageCard } from '../../components/features/ImageCard'
import { SearchInput } from '../../components/ui/SearchInput'
import { EmptyState } from '../../components/ui/EmptyState'
import { GradientButton } from '../../components/ui/GradientButton'
import { ConsentCard } from '../../components/features/ConsentPrompt'
import { useMyImages } from '../../lib/imageData'
import { useFaceConsent } from '../../lib/consent'
import { requestIdentityAnalysis } from '../../lib/api/identities'
import { photoStatus, type PhotoFilter } from '../../lib/api/images'
import { getAlbum, getPlace, moveToTrash, setFavorites } from '../../lib/api/library'
import { useApiResource } from '../../lib/useApiResource'
import { LibraryTabs } from '../../components/features/LibraryTabs'
import { AddToAlbumDialog } from '../../components/features/AddToAlbumDialog'
import { USE_API } from '../../lib/api/config'

/** Mirrors the pipeline's own verdicts, which is what the API filters on. */
const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'needs_review', label: 'In review' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'processing', label: 'Processing' },
] as const

/** What a tab says when nothing has that status: it is not "no images yet", the person may have many. */
const NOTHING_WITH_STATUS: Record<string, string> = {
  accepted: 'No accepted photos', needs_review: 'No photos are in review', rejected: 'No rejected photos', processing: 'Nothing is being processed',
}

/** How long a success message stays before it goes by itself. A failure is not timed: it explains what went wrong, so it stays until dismissed. */
const NOTICE_MS = 3000

const wholeNumber = (value: string | null) => (value && /^\d+$/.test(value) ? Number(value) : undefined)

/**
 * The narrowing the page's address asks for: favourites, one album, a place, a person, a stretch of dates. Albums, Places, Moments and
 * the person folders all link here with it, so one list serves every way of looking at the library.
 */
function useFilterFromAddress() {
  const [params, setParams] = useSearchParams()
  const key = params.toString()
  const filter = useMemo<PhotoFilter>(() => {
    const p = new URLSearchParams(key)
    return {
      favorite: p.get('favorite') === 'true' ? true : undefined,
      album: wholeNumber(p.get('album')),
      person: p.getAll('person').map(Number).filter(n => Number.isInteger(n) && n > 0),
      place: wholeNumber(p.get('place')),
      country: /^[A-Za-z]{2}$/.test(p.get('country') ?? '') ? p.get('country')!.toUpperCase() : undefined,
      takenFrom: /^\d{4}-\d{2}-\d{2}$/.test(p.get('taken_from') ?? '') ? p.get('taken_from')! : undefined,
      takenTo: /^\d{4}-\d{2}-\d{2}$/.test(p.get('taken_to') ?? '') ? p.get('taken_to')! : undefined,
    }
  }, [key])
  const drop = (...names: string[]) => setParams(current => { const next = new URLSearchParams(current); for (const name of names) next.delete(name); return next }, { replace: true })
  return { filter, drop }
}

/** What the list is narrowed to, as removable chips (favourites have their own tab, so they are not one). */
function FilterChips({ filter, drop }: { filter: PhotoFilter; drop: (...names: string[]) => void }) {
  const album = useApiResource(signal => (filter.album ? getAlbum(filter.album, signal) : Promise.resolve(null)), () => null, [filter.album], { skip: !filter.album || !USE_API })
  const place = useApiResource(signal => (filter.place ? getPlace(filter.place, signal) : Promise.resolve(null)), () => null, [filter.place], { skip: !filter.place || !USE_API })
  const chips: { label: string; on: () => void }[] = []
  if (filter.album) chips.push({ label: `Album: ${album.data?.title ?? '…'}`, on: () => drop('album') })
  if (filter.place) chips.push({ label: `Place: ${place.data ? place.data.name : '…'}`, on: () => drop('place') })
  if (filter.country) chips.push({ label: `Country: ${filter.country}`, on: () => drop('country') })
  if (filter.person?.length) chips.push({ label: filter.person.length === 1 ? 'With one person' : `With ${filter.person.length} people`, on: () => drop('person') })
  if (filter.takenFrom || filter.takenTo) chips.push({ label: `Taken ${filter.takenFrom ?? '…'} to ${filter.takenTo ?? '…'}`, on: () => drop('taken_from', 'taken_to') })
  if (chips.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-2 mb-5">
      <span className="text-[11px] font-semibold text-ink-faint">Showing only</span>
      {chips.map(chip => (
        <button key={chip.label} type="button" onClick={chip.on} aria-label={`Remove “${chip.label}”`} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent/10 text-accent border border-accent/25 cursor-pointer">
          {chip.label}<X className="w-3 h-3" />
        </button>
      ))}
    </div>
  )
}

export default function MyImages() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const { filter, drop } = useFilterFromAddress()
  const [addingToAlbum, setAddingToAlbum] = useState(false)
  const [bulkBusy, setBulkBusy] = useState(false)

  /* Picking photos is what leads to the face-grouping question, so the consent card lives
     here and only appears once something is selected. */
  const consent = useFaceConsent()
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [cardHidden, setCardHidden] = useState(false)
  const [wantsToGroup, setWantsToGroup] = useState(false)
  const [grouping, setGrouping] = useState(false)
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  // A new success message restarts the clock; leaving the page cancels it.
  useEffect(() => {
    if (notice?.kind !== 'ok') return
    const timer = setTimeout(() => setNotice(null), NOTICE_MS)
    return () => clearTimeout(timer)
  }, [notice])

  const { data, loading, error, isDemo, reload } = useMyImages(page, status || undefined, filter)
  /* The server's Accepted filter also lists a photo whose stored decision is "rejected" (see photoStatus); it is in the Rejected tab, so it is left out here and from the count. */
  const images = useMemo(() => (data?.results ?? []).filter(image => status !== 'accepted' || photoStatus(image) !== 'rejected'), [data, status])
  const total = Math.max(0, (data?.count ?? 0) - ((data?.results.length ?? 0) - images.length))

  /* Filtering by status is the server's job (it knows every page); searching by
     name is done here, over the page in hand, because the API has no name
     search. The subtitle says which number is which so the two cannot be
     misread as disagreeing. */
  const visible = search
    ? images.filter(image => image.original_name.toLowerCase().includes(search.toLowerCase()))
    : images

  /* Only an accepted upload can be analysed: the backend answers 404 for a rejected or
     still-processing photo, so those cannot be ticked. */
  const eligibleIds = useMemo(() => visible.filter(image => image.status === 'uploaded').map(image => image.id), [visible])
  /* Any photo can be deleted, including a rejected one, so against the API every photo can be ticked. */
  const selectableIds = useMemo(() => (USE_API ? visible.map(image => image.id) : eligibleIds), [visible, eligibleIds])

  const clearSelection = () => setSelected(new Set())
  const toggle = (id: number) => setSelected(current => {
    const next = new Set(current)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })

  // The question starts afresh the next time something is picked.
  useEffect(() => {
    if (selected.size === 0) { setCardHidden(false); setWantsToGroup(false) }
  }, [selected.size])

  const showConsentCard = selected.size > 0 && consent.needsConsent && !cardHidden

  const changeStatus = (next: string) => {
    setStatus(next)
    setPage(1)
    clearSelection()
  }

  const goToPage = (next: number) => {
    setPage(next)
    clearSelection()
  }

  const groupSelected = async () => {
    // Only accepted photos can be grouped; the rest of the selection is left out rather than failing.
    const ids = [...selected].filter(id => eligibleIds.includes(id))
    if (ids.length === 0) {
      setNotice({ kind: 'error', text: 'Only accepted photos can be grouped by person. Select at least one accepted photo.' })
      return
    }
    setGrouping(true)
    setNotice(null)
    let started = 0
    let firstError = ''
    for (const id of ids) {
      try {
        await requestIdentityAnalysis(id)
        started += 1
      } catch (caught) {
        if (!firstError) firstError = caught instanceof Error ? caught.message : 'Could not group a photo.'
      }
    }
    setGrouping(false)
    if (started > 0) clearSelection()
    const failed = ids.length - started
    setNotice(
      failed === 0
        ? { kind: 'ok', text: `Grouping started for ${started} photo${started === 1 ? '' : 's'}. Person Folders update when it finishes.` }
        : { kind: 'error', text: `${started} started, ${failed} could not be grouped: ${firstError}` },
    )
  }

  /* Moving to the trash can be undone, so it asks nothing; the message says where the photos went and why any stayed. */
  const trashSelected = async () => {
    const ids = [...selected]
    setBulkBusy(true)
    try {
      const result = await moveToTrash(ids)
      const moved = result.trashed_ids.length
      const stayed = result.skipped.length
      const processing = result.skipped.filter(item => item.reason === 'still_processing').length
      const inReview = result.skipped.filter(item => item.reason === 'in_review').length
      clearSelection()
      reload()
      const why = [processing ? `${processing} still being processed, try again in a moment` : '', inReview ? `${inReview} waiting for a moderator` : ''].filter(Boolean).join('; ')
      setNotice(stayed === 0
        ? { kind: 'ok', text: `${moved} photo${moved === 1 ? '' : 's'} moved to the trash. You can put ${moved === 1 ? 'it' : 'them'} back from the Trash for ${result.retention_days} days.` }
        : { kind: moved ? 'ok' : 'error', text: `${moved} moved to the trash, ${stayed} stayed${why ? `: ${why}` : ''}.` })
    } catch (caught) {
      setNotice({ kind: 'error', text: caught instanceof Error ? caught.message : 'Could not move the photos to the trash.' })
    } finally {
      setBulkBusy(false)
    }
  }

  const favoriteSelected = async (favorite: boolean) => {
    const ids = [...selected]
    setBulkBusy(true)
    try {
      const result = await setFavorites(ids, favorite)
      clearSelection()
      reload()
      setNotice({ kind: 'ok', text: `${result.updated_ids.length} photo${result.updated_ids.length === 1 ? '' : 's'} ${favorite ? 'added to' : 'removed from'} your favourites.` })
    } catch (caught) {
      setNotice({ kind: 'error', text: caught instanceof Error ? caught.message : 'Could not change the favourites.' })
    } finally {
      setBulkBusy(false)
    }
  }

  const handleGroupClick = () => {
    if (consent.needsConsent) {
      // They asked for grouping, so once they agree it carries straight on.
      setWantsToGroup(true)
      setCardHidden(false)
      return
    }
    void groupSelected()
  }

  return (
    <div className="page-enter">
      <PageHeader
        title={filter.favorite ? 'Favourites' : 'My Images'}
        subtitle={
          loading ? 'Loading…'
          : search ? `${visible.length} of ${images.length} on this page match “${search}”`
          : `${total} image${total === 1 ? '' : 's'}${status ? ` marked ${status.replace('_', ' ')}` : ''}`
        }
      />
      {USE_API && <LibraryTabs />}
      <FilterChips filter={filter} drop={drop} />

      {isDemo && (
        <div className="p-3 mb-6 rounded-2xl text-xs flex items-center gap-2 bg-surface-mute border border-line text-ink-soft">
          <AlertTriangle className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
          Showing demo data. Set <code className="fc-kbd">VITE_USE_API=true</code> to see your real uploads.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <SearchInput
          placeholder="Search this page by filename…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64"
        />
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map(filter => {
            const isActive = status === filter.value
            return (
              <button
                key={filter.value || 'all'}
                onClick={() => changeStatus(filter.value)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                style={{
                  background: isActive ? 'rgba(249,115,22, 0.14)' : 'rgb(var(--a-surface-mute))',
                  border: isActive ? '1px solid rgba(249,115,22, 0.24)' : '1px solid rgb(var(--a-line))',
                  color: isActive ? '#FB923C' : 'rgb(var(--a-ink-mute))',
                  boxShadow: isActive ? '0 0 15px rgba(249,115,22, 0.1)' : 'none',
                }}
              >
                {filter.label}
              </button>
            )
          })}
        </div>
      </div>

      {loading && (
        <div className="text-center py-20 text-ink-faint">
          <Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin" />
          <p className="text-xs font-semibold">Loading your images…</p>
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-20">
          <AlertTriangle className="w-7 h-7 mx-auto mb-3 text-[#EF4444]" />
          <p className="text-xs font-semibold text-ink">{error}</p>
          <button
            type="button"
            onClick={reload}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#FB923C] hover:underline cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />Try again
          </button>
        </div>
      )}

      {!loading && !error && visible.length === 0 && (() => {
        const emptyTab = images.length === 0 && Boolean(status) && !filter.favorite
        return (
          <EmptyState
            icon={Images}
            title={images.length === 0 ? (filter.favorite ? 'No favourites yet' : emptyTab ? NOTHING_WITH_STATUS[status] ?? 'Nothing here' : 'No images yet') : 'Nothing matches that search'}
            description={
              images.length === 0
                ? (filter.favorite ? 'Press the heart on a photo and it will be here.' : emptyTab ? 'Photos with this status are listed here when there are any.' : 'Upload a photo and it will appear here once the pipeline has looked at it.')
                : 'Try a different filename, or clear the filters.'
            }
            action={{
              label: emptyTab ? 'Show all photos' : images.length === 0 ? 'Upload images' : 'Clear filters',
              onClick: () => {
                if (emptyTab) changeStatus('')
                else if (images.length === 0) window.location.assign('/dashboard/upload')
                else { setSearch(''); changeStatus('') }
              },
            }}
          />
        )
      })()}

      {!loading && !error && visible.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
            {visible.map(image => (
              <ImageCard
                key={image.id}
                image={image}
                selectable={USE_API || image.status === 'uploaded'}
                selected={selected.has(image.id)}
                onToggleSelect={() => toggle(image.id)}
                onFavoriteChange={() => { if (filter.favorite) reload() }}
              />
            ))}
          </div>

          {(selected.size > 0 || notice) && (
            <div className="sticky bottom-24 z-30 mt-6 space-y-3">
              {showConsentCard && (
                <ConsentCard
                  selectedCount={selected.size}
                  onNotNow={() => { setCardHidden(true); setWantsToGroup(false) }}
                  onAllowed={() => {
                    setCardHidden(true)
                    if (wantsToGroup) { setWantsToGroup(false); void groupSelected() }
                  }}
                />
              )}

              {notice && (
                <div
                  role="status"
                  className={`p-3 rounded-2xl text-xs border flex items-start justify-between gap-3 ${
                    notice.kind === 'ok'
                      ? 'bg-[#10B981]/10 border-[#10B981]/25 text-[#10B981]'
                      : 'bg-[#EF4444]/10 border-[#EF4444]/25 text-[#F87171]'
                  }`}
                >
                  <span>{notice.text}</span>
                  <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss" className="cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {selected.size > 0 && (
                <div className="fc-panel-strong px-4 py-3 flex flex-wrap items-center gap-3 shadow-soft-lg">
                  <span className="text-[13px] font-semibold text-ink">{selected.size} selected</span>
                  <button type="button" onClick={clearSelection} className="text-xs font-semibold text-ink-mute hover:text-ink cursor-pointer">
                    Clear
                  </button>
                  {selected.size < selectableIds.length && (
                    <button type="button" onClick={() => setSelected(new Set(selectableIds))} className="text-xs font-semibold text-[#FB923C] hover:underline cursor-pointer">
                      Select all on this page
                    </button>
                  )}
                  <div className="flex-1" />
                  <GradientButton
                    size="sm" leftIcon={<ScanFace className="w-4 h-4" />}
                    disabled={grouping || isDemo}
                    title={isDemo ? 'Connect the live service to group photos' : undefined}
                    onClick={handleGroupClick}
                  >
                    {grouping ? 'Starting…' : 'Group by person'}
                  </GradientButton>
                  {USE_API && (
                    <>
                      <button type="button" onClick={() => void favoriteSelected(!filter.favorite)} disabled={bulkBusy}
                        className="text-xs font-bold text-ink-soft hover:text-ink inline-flex items-center gap-1.5 px-2 cursor-pointer disabled:opacity-60">
                        <Heart className="w-3.5 h-3.5" />{filter.favorite ? 'Unfavourite' : 'Favourite'}
                      </button>
                      <button type="button" onClick={() => setAddingToAlbum(true)} disabled={bulkBusy}
                        className="text-xs font-bold text-ink-soft hover:text-ink inline-flex items-center gap-1.5 px-2 cursor-pointer disabled:opacity-60">
                        <FolderPlus className="w-3.5 h-3.5" />Add to album
                      </button>
                      <button type="button" onClick={() => void trashSelected()} disabled={bulkBusy}
                        className="text-xs font-bold text-error hover:underline inline-flex items-center gap-1.5 px-2 cursor-pointer disabled:opacity-60">
                        <Trash2 className="w-3.5 h-3.5" />Move to trash
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {(data?.next || data?.previous) && (
            <div className="flex items-center justify-center gap-3 mt-8 text-xs">
              <button
                type="button"
                disabled={!data?.previous}
                onClick={() => goToPage(Math.max(1, page - 1))}
                className="px-4 py-2 rounded-xl font-semibold border border-line text-ink-soft hover:text-ink transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default"
              >
                Previous
              </button>
              <span className="text-ink-mute">Page {page}</span>
              <button
                type="button"
                disabled={!data?.next}
                onClick={() => goToPage(page + 1)}
                className="px-4 py-2 rounded-xl font-semibold border border-line text-ink-soft hover:text-ink transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
      {addingToAlbum && (
        <AddToAlbumDialog imageIds={[...selected]} onClose={() => setAddingToAlbum(false)} onDone={text => { setNotice({ kind: 'ok', text }); clearSelection() }} />
      )}
    </div>
  )
}
