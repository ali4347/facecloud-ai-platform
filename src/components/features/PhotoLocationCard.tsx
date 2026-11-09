import { useState } from 'react'
import { Loader2, MapPin, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { useApiResource } from '../../lib/useApiResource'
import { getLocation, removeLocation, type PhotoLocation } from '../../lib/api/library'

/** Where the photo was taken: the place's name, and the position. Only its owner sees it, and it can be taken off. */
export function PhotoLocationCard({ imageId, onRemoved }: { imageId: number; onRemoved?: () => void }) {
  const location = useApiResource(signal => getLocation(imageId, signal), () => null as PhotoLocation | null, [imageId])
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (location.loading) return <p className="text-xs text-ink-faint flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" />Looking for the location…</p>
  if (location.error || !location.data) return null
  const { latitude, longitude, place } = location.data
  const name = place ? [place.name, place.region, place.country].filter(Boolean).join(', ') : 'A place without a name'

  const remove = async () => {
    setBusy(true); setError('')
    try { await removeLocation(imageId); setConfirming(false); location.reload(); onRemoved?.() }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not remove the location.') } finally { setBusy(false) }
  }

  return (
    <div className="p-4 rounded-3xl bg-surface-mute border border-line space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />Where it was taken</p>
      <p className="text-sm font-semibold text-ink">{name}</p>
      <p className="text-[11px] text-ink-mute">{latitude.toFixed(4)}, {longitude.toFixed(4)} · only you can see this</p>
      <button type="button" onClick={() => setConfirming(true)} className="text-xs font-bold text-error hover:underline inline-flex items-center gap-1.5 cursor-pointer"><Trash2 className="w-3.5 h-3.5" />Remove the location</button>
      {confirming && (
        <ConfirmDialog title="Remove this photo's location?" confirmLabel="Remove location" busyLabel="Removing…" danger busy={busy} error={error} onConfirm={() => void remove()} onCancel={() => setConfirming(false)}>
          <p>The place and position are taken out of your library, and are not read from the file again.</p>
          <p>The original file is not changed: a copy you download may still contain the location.</p>
        </ConfirmDialog>
      )}
    </div>
  )
}
