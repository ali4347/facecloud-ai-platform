import { useState } from 'react'
import { Check, Images, Loader2 } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Pager } from '../ui/Pager'
import { AuthedImage } from '../ui/AuthedImage'
import { useApiResource } from '../../lib/useApiResource'
import { getImageThumbnail, listMyImages, type ImageListItem, type Page } from '../../lib/api/images'

/** Pick photos from the person's library. `onPick` gets the chosen ids; the caller does the work and closes the dialog. */
export function PhotoPickerDialog({ title, confirmLabel, onClose, onPick }: { title: string; confirmLabel: (count: number) => string; onClose: () => void; onPick: (ids: number[]) => Promise<void> }) {
  const [page, setPage] = useState(1)
  const [chosen, setChosen] = useState<Set<number>>(new Set())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const photos = useApiResource(signal => listMyImages({ page, pageSize: 24 }, signal), () => ({ count: 0, next: null, previous: null, results: [] as ImageListItem[] }) as Page<ImageListItem>, [page])
  // Only stored photos can be added; one the checks refused has no picture to show and is left out of the choice.
  const rows = (photos.data?.results ?? []).filter(photo => photo.thumbnail_url !== null)

  const toggle = (id: number) => setChosen(current => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next })
  const submit = async () => {
    setBusy(true); setError('')
    try { await onPick([...chosen]) } catch (caught) { setError(caught instanceof Error ? caught.message : 'That did not work.') } finally { setBusy(false) }
  }

  return (
    <Modal
      title={title}
      onClose={onClose}
      busy={busy}
      wide
      footer={<>
        <span className="mr-auto self-center text-xs">{chosen.size} chosen</span>
        <button type="button" onClick={onClose} disabled={busy} className="fc-btn-secondary text-xs py-2 px-4">Cancel</button>
        <button type="button" onClick={() => void submit()} disabled={busy || chosen.size === 0} className="fc-btn-primary !py-2 !px-4 text-xs font-bold inline-flex items-center gap-2 disabled:opacity-60 cursor-pointer">{busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}{confirmLabel(chosen.size)}</button>
      </>}
    >
      {photos.loading && <p className="text-xs flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" />Loading your photos…</p>}
      {photos.error && <p role="alert" className="text-xs text-red-500">{photos.error}</p>}
      {!photos.loading && !photos.error && rows.length === 0 && <p className="text-xs flex items-center gap-2"><Images className="w-4 h-4" />There are no photos here to choose.</p>}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {rows.map(photo => {
          const on = chosen.has(photo.id)
          return (
            <button key={photo.id} type="button" onClick={() => toggle(photo.id)} aria-pressed={on} aria-label={`${on ? 'Unselect' : 'Select'} ${photo.original_name}`} className={`relative aspect-square rounded-xl overflow-hidden border cursor-pointer ${on ? 'border-accent ring-2 ring-accent' : 'border-line'}`}>
              <AuthedImage load={signal => getImageThumbnail(photo.id, 256, signal)} cacheKey={`pick-${photo.id}`} alt={photo.original_name} className="w-full h-full !border-0" rounded="rounded-none" />
              {on && <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center"><Check className="w-3 h-3" /></span>}
            </button>
          )
        })}
      </div>
      <Pager page={page} hasNext={Boolean(photos.data?.next)} hasPrevious={Boolean(photos.data?.previous)} onPage={setPage} />
      {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
    </Modal>
  )
}
