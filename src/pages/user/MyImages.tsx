import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Images, Loader2, RefreshCw, ScanFace, Trash2, X } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ImageCard } from '../../components/features/ImageCard'
import { SearchInput } from '../../components/ui/SearchInput'
import { EmptyState } from '../../components/ui/EmptyState'
import { GradientButton } from '../../components/ui/GradientButton'
import { ConsentCard } from '../../components/features/ConsentPrompt'
import { useMyImages } from '../../lib/imageData'
import { useFaceConsent } from '../../lib/consent'
import { requestIdentityAnalysis } from '../../lib/api/identities'
import { deleteImage } from '../../lib/api/images'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { USE_API } from '../../lib/api/config'

/** Mirrors the pipeline's own verdicts, which is what the API filters on. */
const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'needs_review', label: 'In review' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'processing', label: 'Processing' },
] as const

export default function MyImages() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  /* Picking photos is what leads to the face-grouping question, so the consent card lives
     here and only appears once something is selected. */
  const consent = useFaceConsent()
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [cardHidden, setCardHidden] = useState(false)
  const [wantsToGroup, setWantsToGroup] = useState(false)
  const [grouping, setGrouping] = useState(false)
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const { data, loading, error, isDemo, reload } = useMyImages(page, status || undefined)
  const images = useMemo(() => data?.results ?? [], [data])
  const total = data?.count ?? 0

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

  /* Delete one by one, so a failure on one photo does not stop the others and is reported by name. */
  const deleteSelected = async () => {
    const ids = [...selected]
    setDeleting(true)
    let gone = 0
    let firstError = ''
    for (const id of ids) {
      try {
        await deleteImage(id)
        gone += 1
      } catch (caught) {
        if (!firstError) firstError = caught instanceof Error ? caught.message : 'A photo could not be deleted.'
      }
    }
    setDeleting(false)
    setConfirmingDelete(false)
    clearSelection()
    reload()
    const failed = ids.length - gone
    setNotice(
      failed === 0
        ? { kind: 'ok', text: `${gone} photo${gone === 1 ? '' : 's'} deleted.` }
        : { kind: 'error', text: `${gone} deleted, ${failed} could not be deleted: ${firstError}` },
    )
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
        title="My Images"
        subtitle={
          loading ? 'Loading…'
          : search ? `${visible.length} of ${images.length} on this page match “${search}”`
          : `${total} image${total === 1 ? '' : 's'}${status ? ` marked ${status.replace('_', ' ')}` : ''}`
        }
      />

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

      {!loading && !error && visible.length === 0 && (
        <EmptyState
          icon={Images}
          title={images.length === 0 ? 'No images yet' : 'Nothing matches that search'}
          description={
            images.length === 0
              ? 'Upload a photo and it will appear here once the pipeline has looked at it.'
              : 'Try a different filename, or clear the filters.'
          }
          action={{
            label: images.length === 0 ? 'Upload images' : 'Clear filters',
            onClick: () => {
              if (images.length === 0) window.location.assign('/dashboard/upload')
              else { setSearch(''); changeStatus('') }
            },
          }}
        />
      )}

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
                    <button type="button" onClick={() => setConfirmingDelete(true)}
                      className="text-xs font-bold text-error hover:underline inline-flex items-center gap-1.5 px-2 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />Delete
                    </button>
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
      {confirmingDelete && (
        <ConfirmDialog title={`Delete ${selected.size} photo${selected.size === 1 ? '' : 's'}?`} confirmLabel="Delete" busyLabel="Deleting…" danger busy={deleting}
          onConfirm={() => void deleteSelected()} onCancel={() => setConfirmingDelete(false)}>
          <p>The selected photo{selected.size === 1 ? '' : 's'} and their enhanced versions will be permanently deleted.</p>
          <p>This cannot be undone.</p>
        </ConfirmDialog>
      )}
    </div>
  )
}
