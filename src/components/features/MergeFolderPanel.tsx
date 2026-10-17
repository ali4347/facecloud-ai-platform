import { useState } from 'react'
import { GitMerge, Loader2, X } from 'lucide-react'
import { usePersonFolders } from '../../lib/personFolders'
import { mergeIdentityGroups } from '../../lib/api/identities'
import { ApiError } from '../../lib/api/client'

interface MergeFolderPanelProps {
  /** The folder that stays; the one picked here is merged into it. */
  targetId: number
  targetLabel: string
  onMerged: () => void
  onClose: () => void
}

/**
 * For when the same person ended up in two folders. Pick the other folder and its
 * photos move into this one; the other folder is then retired.
 */
export function MergeFolderPanel({ targetId, targetLabel, onMerged, onClose }: MergeFolderPanelProps) {
  const folders = usePersonFolders()
  const [sourceId, setSourceId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const others = (folders.data ?? []).filter(f => Number(f.id) !== targetId)
  const picked = others.find(f => Number(f.id) === sourceId)

  const merge = async () => {
    if (sourceId === null) return
    setBusy(true)
    setError(null)
    try {
      await mergeIdentityGroups(targetId, sourceId)
      onMerged()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not merge these folders. Please try again.')
      setBusy(false)
    }
  }

  return (
    <div className="p-4 rounded-2xl border border-line bg-surface-mute space-y-3" role="group" aria-label="Merge a folder into this one">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">Merge another folder into “{targetLabel}”</p>
          <p className="text-xs text-ink-mute mt-0.5">
            Use this when the same person ended up in two folders. All photos from the folder you pick move here.
          </p>
        </div>
        <button onClick={onClose} aria-label="Close merge" className="text-ink-mute hover:text-ink cursor-pointer"><X className="w-4 h-4" /></button>
      </div>

      {folders.loading && <p className="text-xs text-ink-mute">Loading your folders…</p>}
      {folders.error && <p role="alert" className="text-xs text-red-500">{folders.error}</p>}
      {!folders.loading && !folders.error && others.length === 0 && (
        <p className="text-xs text-ink-mute">You have no other folder to merge.</p>
      )}

      {others.length > 0 && (
        <div className="space-y-1.5 max-h-52 overflow-y-auto">
          {others.map(f => (
            <label key={f.id} className={`flex items-center gap-3 px-3 py-2 rounded-xl border cursor-pointer text-sm
              ${sourceId === Number(f.id) ? 'border-accent/60 bg-accent/5' : 'border-line hover:bg-surface'}`}>
              <input type="radio" name="merge-source" className="accent-orange-500"
                checked={sourceId === Number(f.id)} onChange={() => setSourceId(Number(f.id))} />
              <span className="flex-1 truncate text-ink font-medium">{f.label}</span>
              <span className="text-xs text-ink-mute">{f.imageCount} {f.imageCount === 1 ? 'image' : 'images'}</span>
            </label>
          ))}
        </div>
      )}

      {picked && (
        <p className="text-[11px] text-ink-mute">
          “{picked.label}” will be merged into “{targetLabel}” and removed from your folders. This cannot be undone here.
        </p>
      )}
      {error && <p role="alert" className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button onClick={onClose} className="fc-btn-secondary text-xs py-2 px-4">Cancel</button>
        <button onClick={() => void merge()} disabled={sourceId === null || busy}
          className="fc-btn-primary text-xs py-2 px-4 flex items-center gap-2 disabled:opacity-60">
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GitMerge className="w-3.5 h-3.5" />}
          {busy ? 'Merging…' : 'Merge folders'}
        </button>
      </div>
    </div>
  )
}
