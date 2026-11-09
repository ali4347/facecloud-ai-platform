import { useEffect, useState } from 'react'
import { AlertTriangle, Loader2, RefreshCw, RotateCcw, Trash2 } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { LibraryTabs } from '../../components/features/LibraryTabs'
import { UrlThumb } from '../../components/features/UrlThumb'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { NeedsApi } from '../../components/ui/NeedsApi'
import { NoticeBar } from '../../components/ui/NoticeBar'
import { Pager } from '../../components/ui/Pager'
import { SearchInput } from '../../components/ui/SearchInput'
import { useApiResource } from '../../lib/useApiResource'
import { useNotice } from '../../lib/useNotice'
import { deleteFromTrash, emptyTrash, listTrash, restoreFromTrash, type TrashItem } from '../../lib/api/library'
import { formatBytes } from '../../lib/imageData'
import type { Page } from '../../lib/api/images'

/** The trash: photos that were deleted with an undo. They can be put back until their days run out, or deleted for good. */
export default function Trash() {
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [confirming, setConfirming] = useState<'selected' | 'all' | null>(null)
  const [busy, setBusy] = useState(false)
  const { notice, setNotice, ok, fail } = useNotice()
  useEffect(() => { const timer = setTimeout(() => { setQuery(search.trim()); setPage(1) }, 300); return () => clearTimeout(timer) }, [search])

  const trash = useApiResource(signal => listTrash({ search: query || undefined, page }, signal), () => ({ count: 0, next: null, previous: null, results: [] as TrashItem[] }) as Page<TrashItem>, [query, page])
  const rows = trash.data?.results ?? []
  const total = trash.data?.count ?? 0
  const clear = () => setSelected(new Set())
  const toggle = (id: number) => setSelected(current => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next })

  const restore = async () => {
    setBusy(true)
    try { const result = await restoreFromTrash([...selected]); ok(`Put back ${result.restored_ids.length} photo${result.restored_ids.length === 1 ? '' : 's'}.`); clear(); trash.reload() }
    catch (caught) { fail(caught instanceof Error ? caught.message : 'Could not put them back.') } finally { setBusy(false) }
  }
  const deleteSelected = async () => {
    setBusy(true)
    let gone = 0, firstError = ''
    for (const id of selected) { try { await deleteFromTrash(id); gone += 1 } catch (caught) { if (!firstError) firstError = caught instanceof Error ? caught.message : 'A photo could not be deleted.' } }
    setBusy(false); setConfirming(null); clear(); trash.reload()
    if (firstError) fail(`${gone} deleted, the rest could not be: ${firstError}`); else ok(`${gone} photo${gone === 1 ? '' : 's'} deleted for good.`)
  }
  const emptyAll = async () => {
    setBusy(true)
    try { const gone = await emptyTrash(); ok(`Emptied the trash (${gone} photo${gone === 1 ? '' : 's'} deleted for good).`); clear(); setPage(1); trash.reload() }
    catch (caught) { fail(caught instanceof Error ? caught.message : 'Could not empty the trash.') } finally { setBusy(false); setConfirming(null) }
  }

  const soonest = rows.length ? Math.min(...rows.map(row => row.days_left)) : null
  return (
    <NeedsApi title="Trash" icon={Trash2}>
      <div className="page-enter">
        <PageHeader
          title="Trash"
          subtitle={trash.loading ? 'Loading…' : `${total} photo${total === 1 ? '' : 's'}${soonest !== null ? ` · the first goes for good in ${soonest} day${soonest === 1 ? '' : 's'}` : ''}`}
          action={total > 0 ? <button type="button" onClick={() => setConfirming('all')} className="fc-btn-secondary !py-2 !px-4 text-xs font-bold text-error inline-flex items-center gap-2 cursor-pointer"><Trash2 className="w-3.5 h-3.5" />Empty trash</button> : undefined}
        />
        <LibraryTabs />
        <p className="text-xs text-ink-mute mb-4">A photo you delete waits here. It is out of My Images, albums, person folders and search, and can be put back until its days run out.</p>
        <div className="mb-6"><SearchInput placeholder="Search the trash by filename…" value={search} onChange={event => setSearch(event.target.value)} className="w-64" /></div>

        {trash.loading && <div className="text-center py-20 text-ink-faint"><Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin" /><p className="text-xs font-semibold">Loading the trash…</p></div>}
        {!trash.loading && trash.error && (
          <div className="text-center py-20"><AlertTriangle className="w-7 h-7 mx-auto mb-3 text-[#EF4444]" /><p className="text-xs font-semibold text-ink">{trash.error}</p>
            <button type="button" onClick={trash.reload} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#FB923C] hover:underline cursor-pointer"><RefreshCw className="w-3.5 h-3.5" />Try again</button></div>
        )}
        {!trash.loading && !trash.error && rows.length === 0 && <EmptyState icon={Trash2} title={query ? 'Nothing in the trash matches' : 'The trash is empty'} description={query ? 'Try another filename.' : 'Photos you delete from My Images wait here for a while before they are gone.'} />}
        {!trash.loading && !trash.error && rows.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
              {rows.map(item => {
                const on = selected.has(item.id)
                return (
                  <div key={item.id} className={`fc-card overflow-hidden ${on ? 'ring-2 ring-accent' : ''}`}>
                    <div className="h-40 relative bg-surface-mute">
                      <label className="absolute top-2 left-2 z-10 w-6 h-6 rounded-lg bg-surface/90 border border-line shadow-sm flex items-center justify-center cursor-pointer" title={`Select ${item.original_name}`}>
                        <input type="checkbox" checked={on} onChange={() => toggle(item.id)} className="w-4 h-4 accent-[#F97316] cursor-pointer" aria-label={`Select ${item.original_name}`} />
                      </label>
                      <UrlThumb url={item.thumbnail_url ?? `/api/images/trash/${item.id}/thumbnail/`} alt={item.original_name} />
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-semibold text-ink truncate" title={item.original_name}>{item.original_name}</p>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.days_left <= 3 ? 'text-[#F87171] border-[#EF4444]/30 bg-[#EF4444]/10' : 'text-ink-mute border-line bg-surface-mute'}`}>{item.days_left} day{item.days_left === 1 ? '' : 's'} left</span>
                        <span className="text-xs text-ink-mute">{formatBytes(item.file_size)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <Pager page={page} hasNext={Boolean(trash.data?.next)} hasPrevious={Boolean(trash.data?.previous)} onPage={next => { setPage(next); clear() }} />
          </>
        )}

        {(selected.size > 0 || notice) && (
          <div className="sticky bottom-24 z-30 mt-6 space-y-3">
            <NoticeBar notice={notice} onDismiss={() => setNotice(null)} />
            {selected.size > 0 && (
              <div className="fc-panel-strong px-4 py-3 flex flex-wrap items-center gap-3 shadow-soft-lg">
                <span className="text-[13px] font-semibold text-ink">{selected.size} selected</span>
                <button type="button" onClick={clear} className="text-xs font-semibold text-ink-mute hover:text-ink cursor-pointer">Clear</button>
                <div className="flex-1" />
                <button type="button" onClick={() => void restore()} disabled={busy} className="fc-btn-primary !py-2 !px-4 text-xs font-bold inline-flex items-center gap-2 disabled:opacity-60 cursor-pointer">{busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}Put back</button>
                <button type="button" onClick={() => setConfirming('selected')} disabled={busy} className="text-xs font-bold text-error hover:underline inline-flex items-center gap-1.5 px-2 cursor-pointer disabled:opacity-60"><Trash2 className="w-3.5 h-3.5" />Delete forever</button>
              </div>
            )}
          </div>
        )}

        {confirming === 'selected' && (
          <ConfirmDialog title={`Delete ${selected.size} photo${selected.size === 1 ? '' : 's'} for good?`} confirmLabel="Delete forever" busyLabel="Deleting…" danger busy={busy} onConfirm={() => void deleteSelected()} onCancel={() => setConfirming(null)}>
            <p>The photos and their enhanced versions will be permanently deleted. This cannot be undone.</p>
          </ConfirmDialog>
        )}
        {confirming === 'all' && (
          <ConfirmDialog title="Empty the trash?" confirmLabel="Empty trash" busyLabel="Emptying…" danger busy={busy} onConfirm={() => void emptyAll()} onCancel={() => setConfirming(null)}>
            <p>All {total} photo{total === 1 ? '' : 's'} in the trash will be permanently deleted. This cannot be undone.</p>
          </ConfirmDialog>
        )}
      </div>
    </NeedsApi>
  )
}
