import { Check } from 'lucide-react'
import { USE_API } from '../../lib/api/config'
import { cn } from '../../lib/utils'

export type UploadKind = 'single' | 'multiple' | 'zip'

/**
 * What one upload screen takes. The live screens keep the photo counts low (10 in a batch, 20 inside a ZIP) because the enhancement
 * models are heavy for the GPU the project runs on (the backend itself would take 150); the size limits follow the backend.
 * The offline demo screens keep their own, smaller ones.
 */
export const UPLOAD_LIMITS = USE_API ? { photos: 10, zipPhotos: 20, zip: '2 GB', image: '400 MB' } : { photos: 50, zipPhotos: 50, zip: '200 MB', image: '50 MB' }
const LIMITS = UPLOAD_LIMITS

export interface UploadKindInfo {
  kind: UploadKind
  /** The upload screen that does the work (the page, and what the popup shows inside itself). */
  path: string
  /** The page's own name. */
  title: string
  /** The button's name, and the popup's heading once a kind is chosen. */
  cta: string
  /** Short label on the popup's chooser. */
  short: string
  /** The card's description. */
  blurb: string
  /** One line for the popup's chooser. */
  line: string
  /** What to expect, as short chips. */
  facts: string[]
}

export const UPLOAD_KINDS: UploadKindInfo[] = [
  {
    kind: 'single',
    path: '/dashboard/upload/single',
    title: 'Single Image Upload',
    cta: 'Upload a photo',
    short: 'One photo',
    blurb: 'One portrait, checked and enhanced right away. Compare it before and after, then download or share it.',
    line: 'Enhanced right away, with a before / after.',
    facts: ['1 photo', 'Before / after', 'Download or share'],
  },
  {
    kind: 'multiple',
    path: '/dashboard/upload/multiple',
    title: 'Multiple Batch Upload',
    cta: 'Upload photos',
    short: 'Several photos',
    blurb: `Pick up to ${LIMITS.photos} photos, check your selection, then send them as one batch. Each photo gets its own result.`,
    line: `Up to ${LIMITS.photos} in one batch.`,
    facts: [`Up to ${LIMITS.photos} photos`, 'Review first', 'A result for each'],
  },
  {
    kind: 'zip',
    path: '/dashboard/upload/zip',
    title: 'ZIP Archive Upload',
    cta: 'Upload a ZIP',
    short: 'ZIP archive',
    // The live screen counts the photos inside the archive and refuses more than the limit; the offline demo has no such count, only a size.
    blurb: USE_API
      ? `Send a ZIP of up to ${LIMITS.zipPhotos} portraits. FaceCloud checks every photo and sorts the accepted ones into person folders.`
      : 'Send a whole ZIP of portraits. FaceCloud checks every photo and sorts the accepted ones into person folders.',
    line: USE_API ? `A ZIP of up to ${LIMITS.zipPhotos} photos, sorted by person.` : 'A whole folder, sorted by person.',
    facts: [USE_API ? `Up to ${LIMITS.zipPhotos} photos` : `Up to ${LIMITS.zip}`, 'Sorted by person', 'Download as ZIP'],
  },
]

/** A head-and-shoulders mark, enough to read as "a portrait" without being anyone. */
function Face({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 56" fill="currentColor" aria-hidden="true" className={className}>
      <circle cx="24" cy="19" r="9" />
      <path d="M5 56c0-13 8-21 19-21s19 8 19 21z" />
    </svg>
  )
}

function Frame({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-xl border border-line bg-surface shadow-[0_6px_18px_rgba(0,0,0,0.18)]', className)}>
      <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(249,115,22,0.16),rgba(249,115,22,0)_65%)]" />
      <Face className="absolute inset-x-[16%] bottom-0 h-[74%] w-[68%] text-ink-mute/45" />
    </div>
  )
}

const move = 'transition-transform duration-500 ease-out'

/**
 * The picture on an upload option: one framed portrait, a fan of them, or an archive with portraits coming out of it.
 * Drawn from tokens, so it follows the light and dark appearance. It moves only while a parent marked `group` is hovered,
 * and not at all when the person has asked for reduced motion. `compact` draws it smaller on a phone, for a short tile.
 */
export function UploadArt({ kind, className, compact = false }: { kind: UploadKind; className?: string; compact?: boolean }) {
  return (
    <div
      className={cn(
        'fc-tile relative flex items-center justify-center overflow-hidden rounded-2xl bg-[radial-gradient(120%_90%_at_50%_0%,rgba(249,115,22,0.18),transparent_62%)]',
        className,
      )}
      aria-hidden="true"
    >
      <div className={cn(compact && 'max-sm:scale-[0.78]')}>
        {kind === 'single' && (
          <div className={cn('relative', move, 'motion-safe:group-hover:-translate-y-1')}>
            <Frame className="h-[104px] w-[84px]" />
            {/* the four corners a face finder draws */}
            <span className="absolute -left-2 -top-2 h-3.5 w-3.5 rounded-tl-md border-l-2 border-t-2 border-accent" />
            <span className="absolute -right-2 -top-2 h-3.5 w-3.5 rounded-tr-md border-r-2 border-t-2 border-accent" />
            <span className="absolute -bottom-2 -left-2 h-3.5 w-3.5 rounded-bl-md border-b-2 border-l-2 border-accent" />
            <span className="absolute -bottom-2 -right-2 h-3.5 w-3.5 rounded-br-md border-b-2 border-r-2 border-accent" />
            <span className="absolute -bottom-3 -right-3 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white shadow-md">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
          </div>
        )}

        {kind === 'multiple' && (
          <div className="relative h-[112px] w-[156px]">
            <Frame className={cn('absolute left-0 top-4 h-[92px] w-[70px] -rotate-[9deg]', move, 'motion-safe:group-hover:-translate-x-1.5 motion-safe:group-hover:-rotate-[14deg]')} />
            <Frame className={cn('absolute right-0 top-4 h-[92px] w-[70px] rotate-[9deg]', move, 'motion-safe:group-hover:translate-x-1.5 motion-safe:group-hover:rotate-[14deg]')} />
            <Frame className={cn('absolute left-[43px] top-0 z-10 h-[100px] w-[70px]', move, 'motion-safe:group-hover:-translate-y-1')} />
          </div>
        )}

        {kind === 'zip' && (
          <div className="relative h-[112px] w-[136px]">
            <Frame className={cn('absolute left-3 top-1 h-[44px] w-[34px] -rotate-[8deg]', move, 'motion-safe:group-hover:-translate-y-2')} />
            <Frame className={cn('absolute left-[51px] top-0 h-[48px] w-[36px]', move, 'motion-safe:group-hover:-translate-y-3')} />
            <Frame className={cn('absolute right-3 top-1 h-[44px] w-[34px] rotate-[8deg]', move, 'motion-safe:group-hover:-translate-y-2')} />
            <div className="absolute inset-x-0 bottom-0 z-10 h-[68px] overflow-hidden rounded-2xl border border-accent/45 bg-accent/15 backdrop-blur-sm">
              {/* the zip: a dashed seam running down from the top, ending in its pull */}
              <span className="absolute left-1/2 top-0 h-[34px] -translate-x-1/2 border-l-2 border-dashed border-accent/70" />
              <span className="absolute left-1/2 top-[30px] h-[14px] w-[10px] -translate-x-1/2 rounded-[3px] bg-accent" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
