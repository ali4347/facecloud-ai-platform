import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { setFavorite } from '../../lib/api/library'

/** A heart that marks a photo as a favourite. It changes at once and goes back if the server says no. */
export function FavoriteButton({ imageId, value, onChange, className = '' }: { imageId: number; value: boolean; onChange?: (next: boolean) => void; className?: string }) {
  const [on, setOn] = useState(value)
  const [busy, setBusy] = useState(false)
  useEffect(() => setOn(value), [value])

  const toggle = async (event: React.MouseEvent) => {
    event.preventDefault(); event.stopPropagation()
    if (busy) return
    const next = !on
    setOn(next); setBusy(true)
    try { await setFavorite(imageId, next); onChange?.(next) } catch { setOn(!next) } finally { setBusy(false) }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? 'Remove from favourites' : 'Add to favourites'}
      title={on ? 'Remove from favourites' : 'Add to favourites'}
      className={`p-1.5 rounded-xl bg-surface/90 border border-line shadow-sm cursor-pointer transition-colors ${on ? 'text-[#EF4444]' : 'text-ink-mute hover:text-ink'} ${className}`}
    >
      <Heart className="w-4 h-4" fill={on ? 'currentColor' : 'none'} />
    </button>
  )
}
