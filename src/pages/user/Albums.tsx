import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, FolderHeart, Loader2, Plus, RefreshCw } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { LibraryTabs } from '../../components/features/LibraryTabs'
import { UrlThumb } from '../../components/features/UrlThumb'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { NeedsApi } from '../../components/ui/NeedsApi'
import { NoticeBar } from '../../components/ui/NoticeBar'
import { Pager } from '../../components/ui/Pager'
import { SearchInput } from '../../components/ui/SearchInput'
import { useApiResource } from '../../lib/useApiResource'
import { useNotice } from '../../lib/useNotice'
import { createAlbum, listAlbums, type Album } from '../../lib/api/library'

/** The albums the person has made by hand, and a way to make one. */
export default function Albums() {
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [making, setMaking] = useState(false)
  const { notice, setNotice, ok } = useNotice()
  useEffect(() => { const timer = setTimeout(() => { setQuery(search.trim()); setPage(1) }, 300); return () => clearTimeout(timer) }, [search])

  const albums = useApiResource(signal => listAlbums({ q: query || undefined, page, pageSize: 24 }, signal), () => ({ count: 0, next: null, previous: null, results: [] as Album[] }), [query, page])
  const rows = albums.data?.results ?? []

  return (
    <NeedsApi title="Albums" icon={FolderHeart}>
      <div className="page-enter">
        <PageHeader
          title="Albums"
          subtitle={albums.loading ? 'Loading…' : `${albums.data?.count ?? 0} album${(albums.data?.count ?? 0) === 1 ? '' : 's'}`}
          action={<button type="button" onClick={() => setMaking(true)} className="fc-btn-primary !py-2 !px-4 text-xs font-bold inline-flex items-center gap-2 cursor-pointer"><Plus className="w-4 h-4" />New album</button>}
        />
        <LibraryTabs />
        <div className="mb-6"><SearchInput placeholder="Search your albums…" value={search} onChange={event => setSearch(event.target.value)} className="w-64" /></div>

        {albums.loading && <div className="text-center py-20 text-ink-faint"><Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin" /><p className="text-xs font-semibold">Loading your albums…</p></div>}
        {!albums.loading && albums.error && (
          <div className="text-center py-20">
            <AlertTriangle className="w-7 h-7 mx-auto mb-3 text-[#EF4444]" /><p className="text-xs font-semibold text-ink">{albums.error}</p>
            <button type="button" onClick={albums.reload} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#FB923C] hover:underline cursor-pointer"><RefreshCw className="w-3.5 h-3.5" />Try again</button>
          </div>
        )}
        {!albums.loading && !albums.error && rows.length === 0 && (
          <EmptyState icon={FolderHeart} title={query ? 'No album has that name' : 'No albums yet'} description={query ? 'Try another word.' : 'An album is a collection you make by hand, like “Eid 2026”. Make one here, or pick photos in My Images and add them.'} action={query ? undefined : { label: 'New album', onClick: () => setMaking(true) }} />
        )}
        {!albums.loading && !albums.error && rows.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {rows.map(album => (
                <Link key={album.id} to={`/dashboard/albums/${album.id}`} className="fc-card overflow-hidden group hover:shadow-card-md transition-all">
                  <div className="h-40 relative bg-surface-mute flex items-center justify-center">
                    {album.cover_thumbnail_url ? <UrlThumb url={album.cover_thumbnail_url} alt={album.title} /> : <FolderHeart className="w-8 h-8 text-ink-faint" />}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-ink truncate" title={album.title}>{album.title}</p>
                    <p className="text-xs text-ink-mute mt-0.5">{album.photo_count} photo{album.photo_count === 1 ? '' : 's'}</p>
                    {album.description && <p className="text-[11px] text-ink-faint mt-1 line-clamp-2">{album.description}</p>}
                  </div>
                </Link>
              ))}
            </div>
            <Pager page={page} hasNext={Boolean(albums.data?.next)} hasPrevious={Boolean(albums.data?.previous)} onPage={setPage} />
          </>
        )}
        {notice && <div className="sticky bottom-24 z-30 mt-6"><NoticeBar notice={notice} onDismiss={() => setNotice(null)} /></div>}
        {making && <NewAlbumDialog onClose={() => setMaking(false)} onMade={album => { ok(`Made the album “${album.title}”.`); albums.reload() }} />}
      </div>
    </NeedsApi>
  )
}

function NewAlbumDialog({ onClose, onMade }: { onClose: () => void; onMade: (album: Album) => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim()) return
    setBusy(true); setError('')
    try { const album = await createAlbum({ title: title.trim(), description: description.trim() }); onMade(album); onClose() }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not make the album.') } finally { setBusy(false) }
  }
  return (
    <Modal title="New album" onClose={onClose} busy={busy}>
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-[11px] font-semibold text-ink">Name<input autoFocus value={title} onChange={event => setTitle(event.target.value)} maxLength={120} className="fc-input mt-1.5" placeholder="Eid 2026" /></label>
        <label className="block text-[11px] font-semibold text-ink">Description (optional)<textarea value={description} onChange={event => setDescription(event.target.value)} rows={2} className="fc-input mt-1.5" /></label>
        {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} disabled={busy} className="fc-btn-secondary text-xs py-2 px-4">Cancel</button>
          <button type="submit" disabled={busy || !title.trim()} className="fc-btn-primary !py-2 !px-4 text-xs font-bold inline-flex items-center gap-2 disabled:opacity-60 cursor-pointer">{busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Make album</button>
        </div>
      </form>
    </Modal>
  )
}
