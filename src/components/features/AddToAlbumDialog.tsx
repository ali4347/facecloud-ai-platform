import { useEffect, useState } from 'react'
import { Check, FolderHeart, Loader2, Plus } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { useApiResource } from '../../lib/useApiResource'
import { addToAlbum, createAlbum, listAlbums, type Album } from '../../lib/api/library'

/** Put photos in an album the person already has, or in a new one. `onDone` gets a sentence to show on the page behind. */
export function AddToAlbumDialog({ imageIds, onClose, onDone }: { imageIds: number[]; onClose: () => void; onDone: (message: string) => void }) {
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [busyId, setBusyId] = useState<number | 'new' | null>(null)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [made, setMade] = useState<Set<number>>(new Set())
  useEffect(() => { const timer = setTimeout(() => setDebounced(query.trim()), 250); return () => clearTimeout(timer) }, [query])

  const albums = useApiResource(signal => listAlbums({ q: debounced || undefined, pageSize: 100 }, signal), () => ({ count: 0, next: null, previous: null, results: [] as Album[] }), [debounced])
  const count = imageIds.length === 1 ? 'this photo' : `these ${imageIds.length} photos`

  const addTo = async (album: Album) => {
    setBusyId(album.id); setError('')
    try {
      const result = await addToAlbum(album.id, imageIds)
      setMade(current => new Set(current).add(album.id))
      const added = result.added_ids.length, already = result.already_in_album_ids.length
      onDone(added > 0 ? `Added ${added} photo${added === 1 ? '' : 's'} to “${album.title}”${already ? ` (${already} already there)` : ''}.` : `Already in “${album.title}”.`)
      onClose()
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not add to the album.') } finally { setBusyId(null) }
  }

  const createWith = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim()) return
    setBusyId('new'); setError('')
    try {
      const album = await createAlbum({ title: title.trim(), imageIds })
      onDone(`Made the album “${album.title}” with ${album.photo_count} photo${album.photo_count === 1 ? '' : 's'}.`)
      onClose()
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not make the album.') } finally { setBusyId(null) }
  }

  return (
    <Modal title="Add to an album" onClose={onClose} busy={busyId !== null}>
      <p className="text-xs">Choose an album for {count}, or make a new one. A photo can be in several albums; deleting an album never deletes photos.</p>

      <form onSubmit={createWith} className="flex gap-2">
        <input value={title} onChange={event => setTitle(event.target.value)} maxLength={120} placeholder="New album name" aria-label="New album name" className="fc-input flex-1" />
        <button type="submit" disabled={!title.trim() || busyId !== null} className="fc-btn-primary !py-2 !px-4 text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-60 cursor-pointer">
          {busyId === 'new' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}Make
        </button>
      </form>

      <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search your albums" aria-label="Search your albums" className="fc-input" />

      {albums.loading && <p className="text-xs flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" />Loading albums…</p>}
      {albums.error && <p role="alert" className="text-xs text-red-500">{albums.error}</p>}
      {!albums.loading && (albums.data?.results.length ?? 0) === 0 && !albums.error && <p className="text-xs">{debounced ? 'No album has that name.' : 'You have no albums yet: make the first one above.'}</p>}
      <ul className="space-y-1.5">
        {(albums.data?.results ?? []).map(album => (
          <li key={album.id}>
            <button type="button" onClick={() => void addTo(album)} disabled={busyId !== null} className="w-full flex items-center gap-3 p-3 rounded-2xl border border-line bg-surface-mute hover:border-accent/40 text-left cursor-pointer disabled:opacity-60">
              <FolderHeart className="w-4 h-4 text-accent flex-shrink-0" />
              <span className="flex-1 min-w-0"><span className="block text-sm font-semibold text-ink truncate">{album.title}</span><span className="block text-[11px] text-ink-faint">{album.photo_count} photo{album.photo_count === 1 ? '' : 's'}</span></span>
              {busyId === album.id ? <Loader2 className="w-4 h-4 animate-spin" /> : made.has(album.id) ? <Check className="w-4 h-4 text-emerald-400" /> : null}
            </button>
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
    </Modal>
  )
}
