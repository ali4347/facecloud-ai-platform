import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from 'framer-motion'
import { ArrowRight, ChevronLeft, ChevronRight, Maximize2, Pause, Play, Shuffle, X } from 'lucide-react'
import { RevealOnScroll } from '../animation/RevealOnScroll'
import { ScrambleText } from '../animation/ScrambleText'

/**
 * The home page's gallery: every photo the owner supplied is in one pool, six are on show in justified rows (two rows of
 * three on a desktop, three of two on a tablet, three stacked on a phone), and every few seconds two of them are swapped
 * for two that are not, chosen at random, so all of them come round. A full-screen viewer opens on a click.
 *
 * A row is as tall as it always was and its photos share the width in proportion to their shape, so a row of wide photos
 * and a row with a tall one look alike and nothing on the page moves when a photo changes: the neighbours only glide to
 * their new widths. A photo is cropped a little around its face (`focus`) when its row is not exactly its shape, and is
 * shown whole in the viewer. Updating pauses while the pointer or the keyboard is on the gallery, while the viewer is open
 * and while the visitor has paused it, and it never starts by itself for a visitor who asked for less motion (they get a
 * "Show other photos" button instead).
 *
 * To add photos: put `gallery-NN.webp` (up to 1800 px) and `gallery-NN-sm.webp` (1000 px) in public/gallery, with no
 * metadata, and add a line to PHOTOS. Nothing else needs to change.
 */

interface Photo {
  n: string      // file number
  w: number      // size of the large file
  h: number
  sw: number     // size of the small file
  focus: string  // where the face is, as an object-position, so a frame crops around it
  title: string
  tag: string
  alt: string
}

/* The pool. */
const PHOTOS: Photo[] = [
  { n: '01', w: 1260, h: 1680, sw: 750,  focus: '45% 28%', title: 'Evening glow',   tag: 'Evening light',     alt: 'A bearded man in a white polo shirt looks to one side in a dim café, with warm out-of-focus lights behind him.' },
  { n: '02', w: 1800, h: 1012, sw: 1000, focus: '50% 38%', title: 'Fine detail',    tag: 'Studio close-up',   alt: 'Close-up of a man’s freckled face and brown eyes, looking straight at the camera against a grey-blue background.' },
  { n: '03', w: 1800, h: 1200, sw: 1000, focus: '60% 40%', title: 'A candid smile', tag: 'Black & white',     alt: 'Black-and-white portrait of a smiling woman with long dark hair, looking up at the camera.' },
  { n: '04', w: 1800, h: 1453, sw: 1000, focus: '36% 45%', title: 'Soft shadows',   tag: 'Black & white',     alt: 'Black-and-white portrait of a woman with loose hair, one hand raised to her face, lit from the side in a dark room.' },
  { n: '05', w: 1800, h: 1200, sw: 1000, focus: '58% 52%', title: 'One beam',       tag: 'Extreme low light', alt: 'A single beam of light falls across half of a woman’s face and one blue eye; everything else is black.' },
  { n: '06', w: 1448, h: 1086, sw: 1000, focus: '45% 35%', title: 'Warm daylight',  tag: 'Natural light',     alt: 'A smiling bearded man in a white T-shirt sits outdoors among palm plants in warm afternoon light.' },
  { n: '07', w: 1800, h: 1192, sw: 1000, focus: '46% 32%', title: 'Through the glass',   tag: 'Window light',       alt: 'A woman in profile looks out of a window at dusk, her hands folded under her chin, with soft red and white lights out of focus behind the glass.' },
  { n: '08', w: 1800, h: 1183, sw: 1000, focus: '45% 42%', title: 'Half in sunlight',    tag: 'Hard sunlight',      alt: 'Close portrait of a young man with short curly hair looking straight at the camera, one half of his face lit by low sun and the other in shadow.' },
  { n: '09', w: 1800, h: 1200, sw: 1000, focus: '49% 33%', title: 'Red and blue',        tag: 'Coloured light',     alt: 'A man with a thin gold chain and cross pendant stands against a dark wall, lit from the side by red and blue light.' },
  { n: '10', w: 1800, h: 1106, sw: 1000, focus: '46% 48%', title: 'Edge light',          tag: 'Low key',            alt: 'Side profile of a man with swept-back hair, a short beard and a small cross earring, lit by a cool light against a black background.' },
  { n: '11', w: 1800, h: 1200, sw: 1000, focus: '40% 33%', title: 'Behind the glass',    tag: 'Window reflections', alt: 'A young woman with long hair rests her head on her hand at a café table, seen through a window that reflects the street.' },
  { n: '12', w: 1800, h: 1200, sw: 1000, focus: '36% 44%', title: 'Neon',                tag: 'Neon light',         alt: 'Close-up of a man with dark hair and a light moustache looking sideways at the camera, with bright pink neon lights blurred behind him.' },
  { n: '13', w: 1800, h: 1200, sw: 1000, focus: '44% 52%', title: 'Over the shoulder',   tag: 'Black & white',      alt: 'Black-and-white portrait of a man with bleached cropped hair, a nose ring and an earring, looking back over his shoulder.' },
  { n: '14', w: 1800, h: 1155, sw: 1000, focus: '38% 40%', title: 'High key',            tag: 'Black & white',      alt: 'Black-and-white portrait of a freckled woman in a loose scarf, looking up and away with her hair blowing, against a bright white background.' },
  { n: '15', w: 1800, h: 1200, sw: 1000, focus: '56% 34%', title: 'Quiet light',         tag: 'Window light',       alt: 'A young man with light eyes smiles faintly and looks away from the camera, lit softly from one side in a dark room.' },
  { n: '16', w: 1800, h: 1200, sw: 1000, focus: '42% 52%', title: 'In motion',           tag: 'Motion blur',        alt: 'A man in a hooded top turns his head in front of a red-orange wall; the movement blurs his face and hair into soft layers.' },
  { n: '17', w: 1800, h: 1200, sw: 1000, focus: '48% 40%', title: 'Almost a silhouette', tag: 'Low key',            alt: 'A man with a beard and tousled hair seen in profile against a dark brown wall, his face almost entirely in shadow.' },
  { n: '18', w: 1800, h: 1440, sw: 1000, focus: '44% 33%', title: 'Open sky',            tag: 'Bright daylight',    alt: 'A woman with a short blonde bob and round sunglasses stands in a beige jacket and grey jeans, photographed from below against a pale, almost white sky.' },
  { n: '19', w: 1800, h: 1200, sw: 1000, focus: '62% 45%', title: 'Two faces, one sharp', tag: 'Black & white',     alt: 'Black-and-white profile of a woman with a fringe and a nose ring in sharp focus, with a second woman’s face blurred behind her.' },
  { n: '20', w: 1800, h: 1074, sw: 1000, focus: '52% 42%', title: 'Clear sky',           tag: 'Natural light',      alt: 'A bearded man in a pale blue shirt looks to the right against a clear blue sky, with out-of-focus buildings and trees below.' },
  { n: '21', w: 1800, h: 1350, sw: 1000, focus: '23% 22%', title: 'Soft haze',           tag: 'Overexposed',        alt: 'Black-and-white photo of a bearded man in glasses and a light jacket walking along a street, the picture washed out by bright haze.' },
  { n: '22', w: 1800, h: 1200, sw: 1000, focus: '50% 50%', title: 'Wide open',           tag: 'Black & white',      alt: 'Black-and-white photo of a woman in a long dark coat and a houndstooth top walking across a vast flat plain under an empty sky.' },
  { n: '23', w: 1800, h: 1200, sw: 1000, focus: '65% 42%', title: 'Hard light',          tag: 'Black & white',      alt: 'Black-and-white close-up of a man with a buzz cut, his face glistening, looking straight at the camera in strong light.' },
  { n: '24', w: 1800, h: 1200, sw: 1000, focus: '48% 32%', title: 'Sun and shade',       tag: 'Hard sunlight',      alt: 'A woman in a striped sleeveless top tilts her head, one hand behind her neck and one on her shoulder, in strong sunlight against a pale wall.' },
  { n: '25', w: 1800, h: 1350, sw: 1000, focus: '50% 38%', title: 'Out of focus',        tag: 'Blur',               alt: 'A blurred, grainy photo of a person with dark hair holding a camera up in front of their face.' },
  { n: '26', w: 1800, h: 1200, sw: 1000, focus: '61% 42%', title: 'Midday blue',         tag: 'Bright daylight',    alt: 'A woman in a black polo-neck and a gold necklace tilts her face to the sun with her eyes closed, holding a pair of sunglasses, with a blue river and city buildings behind her.' },
]
const ratio = (p: Photo) => p.w / p.h
const small = (p: Photo) => `/gallery/gallery-${p.n}-sm.webp`
const large = (p: Photo) => `/gallery/gallery-${p.n}.webp`

/* ── Which arrangement fits the screen ──────────────────────────────────── */

type Layout = 'phone' | 'tablet' | 'desktop'
const subscribe = (notify: () => void) => {
  const queries = [matchMedia('(min-width: 640px)'), matchMedia('(min-width: 1024px)')]
  queries.forEach(q => q.addEventListener('change', notify))
  return () => queries.forEach(q => q.removeEventListener('change', notify))
}
const snapshot = (): Layout => (matchMedia('(min-width: 1024px)').matches ? 'desktop' : matchMedia('(min-width: 640px)').matches ? 'tablet' : 'phone')
const useLayout = () => useSyncExternalStore(subscribe, snapshot, () => 'desktop' as Layout)

const INTERVAL = 4000   // ms between updates
const SWAPS = 2         // photos swapped at each update (one on a phone, where only three are on show)
const RECENT = 4        // the photos that have just left are not brought straight back

/** How many frames are on show: six (two rows of three, or three of two), three stacked on a phone. */
const frameCount = (layout: Layout) => Math.min(layout === 'phone' ? 3 : 6, PHOTOS.length)
const perRow = (layout: Layout) => (layout === 'desktop' ? 3 : 2)
/** A row's width over its height. Fixed, so the rows never change height: 4.1 is what the first six photos came to. */
const ROW_SHAPE: Record<Layout, number> = { desktop: 4.1, tablet: 2.9, phone: 1 }

const shuffled = <T,>(items: T[]): T[] => {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]] }
  return out
}
const SIZES = '(min-width: 1024px) 560px, (min-width: 640px) 50vw, 92vw'

/* ── One frame ──────────────────────────────────────────────────────────── */

/** `row` frames share the row's width in proportion to their photo's shape (and glide when a neighbour changes); a frame
 *  that is not in a row (a phone) has a shape of its own. */
function Frame({ slot, photo, row, onOpen }: { slot: number; photo: Photo; row: boolean; onOpen: (n: string, opener: HTMLElement) => void }) {
  const reduced = useReducedMotion()
  const seconds = reduced ? 0.01 : 0.9
  return (
    <div
      className="relative min-w-0"
      style={
        row
          ? { flex: `${ratio(photo)} 1 0%`, transition: reduced ? 'none' : 'flex-grow 900ms cubic-bezier(0.16, 1, 0.3, 1)' }
          : { aspectRatio: '4 / 3' }
      }
    >
      <button
        type="button"
        onClick={e => onOpen(photo.n, e.currentTarget)}
        aria-haspopup="dialog"
        aria-label={`Open photo: ${photo.title}, ${photo.tag}`}
        className="group absolute inset-0 overflow-hidden rounded-2xl border border-line bg-surface-mute shadow-soft cursor-zoom-in
                   transition-[box-shadow,transform] duration-500 hover:shadow-soft-lg active:scale-[0.985]"
      >
        <div className="absolute inset-0 transition-transform duration-[900ms] ease-out group-hover:scale-[1.045]">
          {/* The photo that leaves stays fully visible until the new one has covered it (it only drifts a little), so a
              frame never dips to the background half-way through a change. */}
          <AnimatePresence initial={false}>
            <motion.img
              key={photo.n}
              src={small(photo)}
              srcSet={`${small(photo)} ${photo.sw}w, ${large(photo)} ${photo.w}w`}
              sizes={SIZES}
              width={photo.w}
              height={photo.h}
              alt={photo.alt}
              decoding="async"
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover"
              style={{ objectPosition: photo.focus }}
              initial={{ opacity: 0, scale: reduced ? 1 : 1.07 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ scale: reduced ? 1 : 1.03 }}
              transition={{ duration: seconds, ease: [0.16, 1, 0.3, 1], delay: reduced ? 0 : (slot % 3) * 0.18 }}
            />
          </AnimatePresence>
        </div>
        {/* Caption: on hover or keyboard focus; always there on a touch screen, where there is no hover. */}
        <span
          className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/75 via-black/30 to-transparent
                     p-4 pt-14 text-left opacity-0 translate-y-1 transition-all duration-500
                     group-hover:opacity-100 group-hover:translate-y-0 group-focus-visible:opacity-100 group-focus-visible:translate-y-0
                     [@media(hover:none)]:opacity-100 [@media(hover:none)]:translate-y-0"
        >
          <span className="min-w-0">
            <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#FB923C]">{photo.tag}</span>
            <span className="mt-1 block truncate text-sm font-semibold text-white">{photo.title}</span>
          </span>
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-md">
            <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </span>
      </button>
    </div>
  )
}

/* ── The full-screen viewer ─────────────────────────────────────────────── */

function Viewer({ index, direction, onIndex, onClose }: { index: number; direction: number; onIndex: (i: number, d: number) => void; onClose: () => void }) {
  const reduced = useReducedMotion()
  const photo = PHOTOS[index]
  const closeRef = useRef<HTMLButtonElement>(null)
  const prevRef = useRef<HTMLButtonElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const step = useCallback((d: number) => onIndex((index + d + PHOTOS.length) % PHOTOS.length, d), [index, onIndex])

  useEffect(() => {
    closeRef.current?.focus()
    const html = document.documentElement
    const before = html.style.overflow
    html.style.overflow = 'hidden'
    return () => { html.style.overflow = before }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1) }
      else if (e.key === 'ArrowRight') { e.preventDefault(); step(1) }
      else if (e.key === 'Tab') {                              // keep the focus inside the viewer
        const items = [closeRef.current, prevRef.current, nextRef.current].filter(Boolean) as HTMLElement[]
        const at = items.indexOf(document.activeElement as HTMLElement)
        e.preventDefault()
        items[(at + (e.shiftKey ? -1 : 1) + items.length) % items.length]?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, step])

  // The next and the previous photo are fetched before they are asked for.
  useEffect(() => {
    for (const d of [-1, 1]) new Image().src = large(PHOTOS[(index + d + PHOTOS.length) % PHOTOS.length])
  }, [index])

  /* A drag follows the finger 1:1; on release the photo's momentum, not just its position, decides whether it turns the page. */
  const onDragEnd = (_: unknown, info: PanInfo) => {
    const projected = info.offset.x + info.velocity.x * 0.2
    if (projected < -90) step(1)
    else if (projected > 90) step(-1)
  }

  const slide = reduced ? 0 : 56
  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      className="fixed inset-0 z-[120] flex flex-col bg-black/90 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0.01 : 0.25 }}
      onClick={onClose}
    >
      <div className="flex items-center justify-between px-5 py-4 text-white" onClick={e => e.stopPropagation()}>
        <span className="font-mono text-xs font-bold tracking-[0.2em] text-white/70" aria-live="polite">
          {String(index + 1).padStart(2, '0')} / {String(PHOTOS.length).padStart(2, '0')}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close photo viewer"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F97316]"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-20">
        {(['prev', 'next'] as const).map(side => (
          <button
            key={side}
            ref={side === 'prev' ? prevRef : nextRef}
            type="button"
            onClick={e => { e.stopPropagation(); step(side === 'prev' ? -1 : 1) }}
            aria-label={side === 'prev' ? 'Previous photo' : 'Next photo'}
            className={`absolute top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md
                        transition-colors hover:bg-white/20 sm:flex focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F97316] ${side === 'prev' ? 'left-5' : 'right-5'}`}
          >
            {side === 'prev' ? <ChevronLeft className="h-6 w-6" aria-hidden="true" /> : <ChevronRight className="h-6 w-6" aria-hidden="true" />}
          </button>
        ))}

        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.img
            key={photo.n}
            src={large(photo)}
            alt={photo.alt}
            width={photo.w}
            height={photo.h}
            draggable={false}
            custom={direction}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d * slide, scale: reduced ? 1 : 0.98 }),
              center: { opacity: 1, x: 0, scale: 1 },
              exit: (d: number) => ({ opacity: 0, x: -d * slide, scale: reduced ? 1 : 0.98 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={reduced ? { duration: 0.01 } : { type: 'spring', bounce: 0, duration: 0.38 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.35}
            onDragEnd={onDragEnd}
            onClick={e => e.stopPropagation()}
            className="max-h-full max-w-full cursor-grab select-none rounded-xl object-contain shadow-[0_30px_90px_rgba(0,0,0,0.6)] active:cursor-grabbing"
          />
        </AnimatePresence>
      </div>

      <div className="px-5 py-5 text-center text-white" onClick={e => e.stopPropagation()}>
        <span className="block font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#FB923C]">{photo.tag}</span>
        <span className="mt-1 block text-base font-semibold">{photo.title}</span>
      </div>
    </motion.div>,
    document.body,
  )
}

/* ── The rotating grid and its timer ─────────────────────────────────────── */

/* All the state that changes every few seconds lives here, in a component of its own, so a change re-renders only the
   frames and the countdown. The heading and the rest of the section are not touched by it. */
function Rotor({ layout, viewerOpen, onOpen }: { layout: Layout; viewerOpen: boolean; onOpen: (n: string, opener: HTMLElement) => void }) {
  const reduced = useReducedMotion()

  /* `order` is the whole pool in a random order: the first `count` photos are on show, the rest wait in a queue. An update
     swaps some of those on show with some of those waiting, so what comes in is always something that was not there; what
     leaves goes to the back of the queue and is not picked again for a while. */
  const [order, setOrder] = useState<number[]>(() => shuffled(PHOTOS.map((_, i) => i)))
  const [running, setRunning] = useState(true)
  const [touched, setTouched] = useState(false)       // the pointer or the keyboard is on the gallery
  const count = frameCount(layout)
  const shown = order.slice(0, count)
  const gridRef = useRef<HTMLDivElement>(null)
  const ready = useRef(new Set<number>())              // photos already fetched: only those are brought in

  // Every photo is fetched once, just before the gallery comes into view, so a change never waits for the network.
  useEffect(() => {
    const fetchAll = () => PHOTOS.forEach((p, i) => {
      const img = new Image()
      img.sizes = SIZES
      img.srcset = `${small(p)} ${p.sw}w, ${large(p)} ${p.w}w`
      img.onload = () => ready.current.add(i)
      img.src = small(p)
    })
    const el = gridRef.current
    if (!el || typeof IntersectionObserver === 'undefined') { fetchAll(); return }
    const watch = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { fetchAll(); watch.disconnect() } }, { rootMargin: '800px 0px' })
    watch.observe(el)
    return () => watch.disconnect()
  }, [])

  const update = useCallback(() => {
    setOrder(cur => {
      if (cur.length <= count) return cur
      const out = cur.slice()
      const swaps = Math.min(count >= 6 ? SWAPS : 1, count)
      for (const h of shuffled(Array.from({ length: count }, (_, i) => i)).slice(0, swaps)) {
        const waiting = out.length - count
        const lock = Math.min(RECENT, waiting - 1)           // the photos that left last are at the back of the queue
        const eligible: number[] = []
        for (let i = count; i < out.length - lock; i++) if (ready.current.has(out[i])) eligible.push(i)
        if (!eligible.length) break
        const leaving = out[h]
        const [incoming] = out.splice(eligible[Math.floor(Math.random() * eligible.length)], 1)
        out.push(leaving)
        out[h] = incoming
      }
      return out
    })
  }, [count])

  const active = running && !touched && !viewerOpen && !reduced
  const per = perRow(layout)
  const rows = layout === 'phone' ? [] : Array.from({ length: Math.ceil(shown.length / per) }, (_, r) => shown.slice(r * per, r * per + per))

  return (
    <>
      <div
        ref={gridRef}
        role="group"
        aria-label="Gallery photos"
        className="flex flex-col gap-4"
        onPointerEnter={() => setTouched(true)}
        onPointerLeave={() => setTouched(false)}
        onFocus={() => setTouched(true)}
        onBlur={() => setTouched(false)}
      >
        {layout === 'phone'
          ? shown.map((photoIndex, slot) => <Frame key={slot} slot={slot} photo={PHOTOS[photoIndex]} row={false} onOpen={onOpen} />)
          : rows.map((row, r) => (
              <div key={r} className="flex gap-4" style={{ aspectRatio: ROW_SHAPE[layout] }}>
                {row.map((photoIndex, k) => <Frame key={r * per + k} slot={r * per + k} photo={PHOTOS[photoIndex]} row onOpen={onOpen} />)}
              </div>
            ))}
      </div>

      {/* The countdown to the next update doubles as the timer: the bar fills over the interval, over and over, and the
          update happens each time it is full, so pausing the bar pauses the gallery and the two can never drift apart
          (and the beat does not wait for React to render a change). */}
      <div className="mt-6 flex items-center justify-center gap-4 text-xs text-ink-mute">
        {reduced ? (
          <button
            type="button"
            onClick={update}
            className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 font-semibold text-ink transition-colors hover:border-[#F97316]/50"
          >
            <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
            Show other photos
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setRunning(r => !r)}
              aria-label={running ? 'Pause the automatic photo updates' : 'Resume the automatic photo updates'}
              className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-line bg-surface text-ink transition-colors hover:border-[#F97316]/50"
            >
              {running ? <Pause className="h-3.5 w-3.5" aria-hidden="true" /> : <Play className="h-3.5 w-3.5" aria-hidden="true" />}
            </button>
            <div className="h-[3px] w-32 overflow-hidden rounded-full bg-ink/10 sm:w-48" aria-hidden="true">
              <div
                className="h-full origin-left bg-[#F97316]"
                style={{ animation: `fcGalleryTick ${INTERVAL}ms linear infinite`, animationPlayState: active ? 'running' : 'paused' }}
                onAnimationIteration={update}
              />
            </div>
            <span>{running ? `New photos every ${INTERVAL / 1000} seconds` : 'Paused'}</span>
          </>
        )}
      </div>
    </>
  )
}

/* ── The section ────────────────────────────────────────────────────────── */

export default function GallerySection() {
  const layout = useLayout()
  const [open, setOpen] = useState<number | null>(null)
  const [direction, setDirection] = useState(1)
  const opener = useRef<HTMLElement | null>(null)

  const show = (n: string, el: HTMLElement) => { opener.current = el; setDirection(1); setOpen(PHOTOS.findIndex(p => p.n === n)) }
  const close = useCallback(() => { setOpen(null); requestAnimationFrame(() => opener.current?.focus()) }, [])
  const go = useCallback((i: number, d: number) => { setDirection(d); setOpen(i) }, [])

  return (
    <section id="gallery" className="py-24 max-w-6xl mx-auto px-6">
      <div className="text-center mb-14 space-y-4">
        <RevealOnScroll>
          <span className="text-xs font-bold text-[#F97316] tracking-widest uppercase block">Gallery</span>
        </RevealOnScroll>
        <RevealOnScroll delay={0.04}>
          <h2 className="text-2xl sm:text-4xl font-bold text-ink tracking-tight leading-relaxed font-display">
            <ScrambleText text="Faces in" />{' '}
            <span className="bg-[#F97316] text-white px-2 py-0.5 inline-block font-bold mx-1">
              <ScrambleText text="every kind of light" />
            </span>
          </h2>
        </RevealOnScroll>
        <RevealOnScroll delay={0.08}>
          <p className="text-xs sm:text-sm text-ink-mute max-w-xl mx-auto font-medium">
            From a single beam in a dark room to warm evening light: the kinds of portraits FaceCloud is built to check, enhance and organise.
          </p>
        </RevealOnScroll>
      </div>

      <Rotor layout={layout} viewerOpen={open !== null} onOpen={show} />

      <RevealOnScroll delay={0.1} className="mt-12 text-center">
        <Link
          to="/register"
          className="group inline-flex items-center gap-2 text-sm font-semibold text-[#F97316] hover:text-[#FB923C] transition-colors"
        >
          Try it with your own photos
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </RevealOnScroll>

      <AnimatePresence>
        {open !== null && <Viewer index={open} direction={direction} onIndex={go} onClose={close} />}
      </AnimatePresence>
    </section>
  )
}
