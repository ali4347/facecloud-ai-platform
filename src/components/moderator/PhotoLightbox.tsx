import { useEffect } from 'react'
import { X } from 'lucide-react'
import { AuthedImage } from '../ui/AuthedImage'
import { getPreview } from '../../lib/api/moderatorConsole'

/** A photo shown large (the 1024-pixel preview, fetched with the token). Escape or a click outside closes it. */
export function PhotoLightbox({ previewUrl, title, onClose }: { previewUrl: string; title: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div role="dialog" aria-modal="true" aria-label={title} className="relative max-w-4xl w-full rounded-2xl bg-surface border border-line p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="text-sm font-semibold text-ink truncate">{title}</p>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-surface-mute cursor-pointer"><X className="w-4 h-4 text-ink-mute" /></button>
        </div>
        <div className="flex justify-center rounded-xl bg-surface-mute">
          <AuthedImage load={signal => getPreview(previewUrl, signal, 1024)} cacheKey={`lightbox-${previewUrl}`} alt={title} className="max-h-[75vh] w-auto max-w-full object-contain !border-0" rounded="rounded-xl" />
        </div>
      </div>
    </div>
  )
}
