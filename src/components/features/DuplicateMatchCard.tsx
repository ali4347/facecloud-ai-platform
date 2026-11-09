import { Link } from 'react-router-dom'
import { Check, Loader2, Trash2 } from 'lucide-react'
import { UrlThumb } from './UrlThumb'
import type { DuplicateMatch } from '../../lib/api/duplicates'
import { matchKind, reviewTone, reviewWords } from '../../lib/duplicateLabels'

export interface CardMessage { kind: 'ok' | 'error'; text: string }

function PhotoTile({ id, name }: { id: number; name: string }) {
  return (
    <Link to={`/dashboard/images/${id}`} className="block min-w-0 group" aria-label={`Open ${name}`}>
      <div className="h-36 sm:h-44 bg-surface-mute overflow-hidden">
        <UrlThumb url={`/api/images/${id}/thumbnail/?size=256`} alt={name} />
      </div>
      <p className="px-3 pt-2 text-xs font-semibold text-ink truncate group-hover:text-accent" title={name}>{name}</p>
    </Link>
  )
}

/**
 * Two photos the duplicate check thinks are the same, side by side, with the person's decision on them.
 *
 * Deciding never deletes or moves anything. An exact (checksum) match is created already confirmed and the server refuses to
 * dismiss it, so it offers only "Same photo". Moving one copy to the trash is a separate, confirmed step.
 */
export function DuplicateMatchCard({ match, busy, message, onDecide, onTrash }: {
  match: DuplicateMatch
  /** The decision being sent for this card, if any. */
  busy: 'confirmed' | 'not_duplicate' | null
  message: CardMessage | null
  onDecide: (status: 'confirmed' | 'not_duplicate') => void
  onTrash: () => void
}) {
  const status = match.review_status
  const exact = match.match_type === 'exact'
  const button = '!py-2 !px-4 text-xs font-bold inline-flex items-center gap-2 cursor-pointer disabled:cursor-default'
  return (
    <article data-match={match.id} className="fc-card overflow-hidden" aria-label={`${match.source_filename} and ${match.matched_filename}`}>
      <div className="grid grid-cols-2 gap-px bg-line">
        <div className="bg-surface min-w-0 pb-2"><PhotoTile id={match.source_image} name={match.source_filename} /></div>
        <div className="bg-surface min-w-0 pb-2"><PhotoTile id={match.matched_image} name={match.matched_filename} /></div>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-ink">{matchKind(match.match_type)}</span>
          {match.similarity_score !== null && <span className="text-ink-mute">{Math.round(match.similarity_score)}% alike</span>}
          <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full border ${reviewTone(status)}`}>{reviewWords(status)}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => onDecide('confirmed')} disabled={busy !== null || status === 'confirmed'} aria-pressed={status === 'confirmed'}
            className={`fc-btn-primary ${button} disabled:opacity-60`}>
            {busy === 'confirmed' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : status === 'confirmed' ? <Check className="w-3.5 h-3.5" /> : null}Same photo
          </button>
          {!exact && (
            <button type="button" onClick={() => onDecide('not_duplicate')} disabled={busy !== null || status === 'not_duplicate'} aria-pressed={status === 'not_duplicate'}
              className={`fc-btn-secondary ${button} disabled:opacity-60`}>
              {busy === 'not_duplicate' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : status === 'not_duplicate' ? <Check className="w-3.5 h-3.5" /> : null}Not a duplicate
            </button>
          )}
        </div>
        {exact && <p className="text-[11px] text-ink-mute">These are identical files, so this cannot be dismissed.</p>}

        {message && (
          <p role={message.kind === 'error' ? 'alert' : 'status'} className={`text-xs ${message.kind === 'ok' ? 'text-[#10B981] [html[data-theme=light]_&]:text-[#047857]' : 'text-[#F87171] [html[data-theme=light]_&]:text-[#B91C1C]'}`}>{message.text}</p>
        )}

        {status === 'confirmed' && (
          <button type="button" onClick={onTrash} className="text-[11px] font-semibold text-ink-mute hover:text-ink underline inline-flex items-center gap-1.5 cursor-pointer">
            <Trash2 className="w-3 h-3" />Move one copy to trash…
          </button>
        )}
      </div>
    </article>
  )
}
