import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, FolderHeart, ImagePlus, ImageOff, Loader2, Pencil, Star, Trash2, X } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ImageCard } from '../../components/features/ImageCard'
import { LibraryTabs } from '../../components/features/LibraryTabs'
import { PhotoPickerDialog } from '../../components/features/PhotoPickerDialog'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { NeedsApi } from '../../components/ui/NeedsApi'
import { NoticeBar } from '../../components/ui/NoticeBar'
import { Pager } from '../../components/ui/Pager'
import { useApiResource } from '../../lib/useApiResource'
import { useNotice } from '../../lib/useNotice'
import { addToAlbum, clearAlbumCover, deleteAlbum, getAlbum, listAlbumImages, removeFromAlbum, rowsOf, setAlbumCover, updateAlbum, type Album } from '../../lib/api/library'
import type { ImageListItem } from '../../lib/api/images'

/** One album: its photos, and what can be done with it (rename, add and remove photos, choose the cover, delete the album). */
export default function AlbumDetail() {
  const { id } = useParams()
  const albumId = id && /^\d+$/.test(id) ? Number(id) : null
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [editing, setEditing] = useState(false)
  const [adding, setAdding] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [busy, setBusy] = useState(false)
  const { notice, setNotice, ok, fail } = useNotice()

  const album = useApiResource(signal => (albumId === null ? Promise.reject(new Error('That album does not exist.')) : getAlbum(albumId, signal)), () => null as unknown as Album, [albumId])
  const photos = useApiResource(signal => (albumId === null ? Promise.resolve([] as ImageListItem[]) : listAlbumImages(albumId, page, signal)), () => [] as ImageListItem[], [albumId, page])
  const paged = photos.data && !Array.isArray(photos.data) ? photos.data : null
  const rows = useMemo(() => rowsOf(photos.data), [photos.data])
  const refresh = () => { album.reload(); photos.reload() }
  const clear = () => setSelected(new Set())
  const toggle = (photoId: number) => setSelected(current => { const next = new Set(current); if (next.has(photoId)) next.delete(photoId); else next.add(photoId); return next })

  const act = async (work: () => Promise<string>) => {
    setBusy(true)
    try { ok(await work()); clear(); refresh() } catch (caught) { fail(caught instanceof Error ? caught.message : 'That did not work.') } finally { setBusy(false) }
  }
  const removeSelected = () => act(async () => {
    const result = await removeFromAlbum(albumId!, [...selected])
    return `Took ${result.removed_ids.length} photo${result.removed_ids.length === 1 ? '' : 's'} out of the album. They are still in your library.`
  })
  const makeCover = () => act(async () => { await setAlbumCover(albumId!, [...selected][0]); return 'That photo is now the cover.' })
  const autoCover = () => act(async () => { await clearAlbumCover(albumId!); return 'The cover is automatic again.' })
  const removeAlbum = async () => {
    setBusy(true)
    try { await deleteAlbum(albumId!); navigate('/dashboard/albums', { replace: true }) } catch (caught) { fail(caught instanceof Error ? caught.message : 'Could not delete the album.'); setConfirmingDelete(false) } finally { setBusy(false) }
  }

  const data = album.data
  return (
    <NeedsApi title="Album" icon={FolderHeart}>
      <div className="page-enter">
        <Link to="/dashboard/albums" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-mute hover:text-ink mb-3"><ArrowLeft className="w-3.5 h-3.5" />All albums</Link>
        <PageHeader
          title={data?.title ?? 'Album'}
          subtitle={data ? `${data.photo_count} photo${data.photo_count === 1 ? '' : 's'}${data.description ? ` · ${data.description}` : ''}` : album.loading ? 'Loading…' : undefined}
          action={data && (
            <>
              <button type="button" onClick={() => setAdding(true)} className="fc-btn-primary !py-2 !px-4 text-xs font-bold inline-flex items-center gap-2 cursor-pointer"><ImagePlus className="w-4 h-4" />Add photos</button>
              <button type="button" onClick={() => setEditing(true)} className="fc-btn-secondary !py-2 !px-4 text-xs font-bold inline-flex items-center gap-2 cursor-pointer"><Pencil className="w-3.5 h-3.5" />Edit</button>
              <button type="button" onClick={() => setConfirmingDelete(true)} aria-label="Delete this album" className="fc-btn-secondary !py-2 !px-3 text-xs text-error cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
            </>
          )}
        />
        <LibraryTabs />

        {(album.loading || photos.loading) && <div className="text-center py-20 text-ink-faint"><Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin" /><p className="text-xs font-semibold">Loading the album…</p></div>}
        {!album.loading && album.error && (
          <div className="text-center py-20"><AlertTriangle className="w-7 h-7 mx-auto mb-3 text-[#EF4444]" /><p className="text-xs font-semibold text-ink">{album.error}</p></div>
        )}
        {!album.loading && !album.error && !photos.loading && rows.length === 0 && (
          <EmptyState icon={ImageOff} title="This album is empty" description="Add photos from your library, or pick photos in My Images and choose “Add to album”." action={{ label: 'Add photos', onClick: () => setAdding(true) }} />
        )}
        {!photos.loading && rows.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
              {rows.map(photo => <ImageCard key={photo.id} image={photo} selectable selected={selected.has(photo.id)} onToggleSelect={() => toggle(photo.id)} />)}
            </div>
            <Pager page={page} hasNext={Boolean(paged?.next)} hasPrevious={Boolean(paged?.previous)} onPage={next => { setPage(next); clear() }} />
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
                {selected.size === 1 && <button type="button" onClick={() => void makeCover()} disabled={busy} className="text-xs font-bold text-[#FB923C] hover:underline inline-flex items-center gap-1.5 px-2 cursor-pointer disabled:opacity-60"><Star className="w-3.5 h-3.5" />Make cover</button>}
                <button type="button" onClick={() => void removeSelected()} disabled={busy} className="text-xs font-bold text-error hover:underline inline-flex items-center gap-1.5 px-2 cursor-pointer disabled:opacity-60"><X className="w-3.5 h-3.5" />Remove from album</button>
              </div>
            )}
          </div>
        )}
        {data && selected.size === 0 && rows.length > 0 && <p className="mt-6 text-[11px] text-ink-faint">Pick photos to remove them from the album or choose the cover. <button type="button" onClick={() => void autoCover()} className="underline cursor-pointer">Use the automatic cover</button></p>}

        {editing && data && <EditAlbumDialog album={data} onClose={() => setEditing(false)} onSaved={() => { ok('Saved.'); refresh() }} />}
        {adding && albumId !== null && (
          <PhotoPickerDialog title="Add photos to this album" confirmLabel={count => (count === 0 ? 'Add' : `Add ${count} photo${count === 1 ? '' : 's'}`)} onClose={() => setAdding(false)}
            onPick={async ids => { const result = await addToAlbum(albumId, ids); setAdding(false); ok(`Added ${result.added_ids.length} photo${result.added_ids.length === 1 ? '' : 's'}${result.already_in_album_ids.length ? ` (${result.already_in_album_ids.length} already there)` : ''}.`); refresh() }} />
        )}
        {confirmingDelete && (
          <ConfirmDialog title="Delete this album?" confirmLabel="Delete album" busyLabel="Deleting…" danger busy={busy} onConfirm={() => void removeAlbum()} onCancel={() => setConfirmingDelete(false)}>
            <p>The album “{data?.title}” will be deleted. The photos in it stay in your library.</p>
          </ConfirmDialog>
        )}
      </div>
    </NeedsApi>
  )
}

function EditAlbumDialog({ album, onClose, onSaved }: { album: Album; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(album.title)
  const [description, setDescription] = useState(album.description)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim()) return
    setBusy(true); setError('')
    try { await updateAlbum(album.id, { title: title.trim(), description: description.trim() }); onSaved(); onClose() }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not save.') } finally { setBusy(false) }
  }
  return (
    <Modal title="Edit album" onClose={onClose} busy={busy}>
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-[11px] font-semibold text-ink">Name<input autoFocus value={title} onChange={event => setTitle(event.target.value)} maxLength={120} className="fc-input mt-1.5" /></label>
        <label className="block text-[11px] font-semibold text-ink">Description<textarea value={description} onChange={event => setDescription(event.target.value)} rows={2} className="fc-input mt-1.5" /></label>
        {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} disabled={busy} className="fc-btn-secondary text-xs py-2 px-4">Cancel</button>
          <button type="submit" disabled={busy || !title.trim()} className="fc-btn-primary !py-2 !px-4 text-xs font-bold inline-flex items-center gap-2 disabled:opacity-60 cursor-pointer">{busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Save</button>
        </div>
      </form>
    </Modal>
  )
}
