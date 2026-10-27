import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { animate, motion, useMotionValue, useReducedMotion } from 'framer-motion'
import { navByRole } from './Sidebar'
import { cn } from '../../lib/utils'
import type { Role } from '../../data/mock'

/* The portal's home link must not count as "current" on every page below it. */
const HOME = new Set(['/dashboard', '/admin', '/moderator'])
const isCurrent = (to: string, pathname: string) => (HOME.has(to) ? pathname === to : pathname.startsWith(to))

/** Where a flick comes to rest, as UIKit projects it (deceleration 0.998 per ms). */
const project = (velocity: number, rate = 0.998) => (velocity / 1000) * rate / (1 - rate)
/** Past the ends the lens follows less and less, like a real thing meeting a wall. */
const rubberband = (over: number, size: number, c = 0.55) => (over * size * c) / (size + c * Math.abs(over))

/**
 * The floating pill at the foot of the screen: every section of the portal by
 * name, scrolling sideways inside the pill when there are more than fit, plus
 * the upload shortcut for a member. It only points at routes the sidebar
 * already has; on a phone it shows icons alone, on a desk names alone.
 *
 * The current section sits under a lens of brighter glass. On a route change
 * the lens springs to the new section from wherever it is (interruptible: a
 * second change mid-flight re-targets without a jump). The lens can also be
 * dragged along the pill; on release it flies with the finger's momentum to
 * the nearest section and opens it.
 */
export function FloatingNav({ role }: { role: Role }) {
  const items = navByRole[role]
  const location = useLocation()
  const navigate = useNavigate()
  const reduced = useReducedMotion()
  const scrollRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])

  const x = useMotionValue(0)
  const width = useMotionValue(0)
  const [visible, setVisible] = useState(false)
  const dragging = useRef(false)

  const activeIndex = items.findIndex(item => isCurrent(item.to, location.pathname))

  /* The lens is laid out in the strip's own scroll space, so its target is the
     active link's offset inside the strip. */
  const targetFor = useCallback((index: number) => {
    const el = itemRefs.current[index]
    return el ? { x: el.offsetLeft, width: el.offsetWidth } : null
  }, [])

  const spring = reduced
    ? { type: 'tween' as const, duration: 0.18 }
    : { type: 'spring' as const, bounce: 0.22, duration: 0.5 }

  const moveLensTo = useCallback((index: number, velocity = 0) => {
    const t = targetFor(index)
    if (!t) return
    if (!visible) { x.set(t.x); width.set(t.width); setVisible(true); return }
    animate(x, t.x, { ...spring, velocity })
    animate(width, t.width, spring)
  }, [targetFor, visible, x, width, spring])

  // Follow the route; keep the current section in view when the pill has scrolled past it.
  useLayoutEffect(() => {
    if (activeIndex < 0 || dragging.current) return
    moveLensTo(activeIndex)
    itemRefs.current[activeIndex]?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduced ? 'auto' : 'smooth' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, location.pathname])

  // Re-measure after a resize (the names hide on a phone, so widths change).
  useEffect(() => {
    const onResize = () => { if (activeIndex >= 0 && !dragging.current) { const t = targetFor(activeIndex); if (t) { x.set(t.x); width.set(t.width) } } }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [activeIndex, targetFor, x, width])

  /* Dragging the lens: 1:1 with the pointer, remembering where it was grabbed;
     the last few moves give the release velocity. */
  const grab = useRef<{ startX: number; lensX: number; moves: { x: number; t: number }[] } | null>(null)
  const onPointerDown = (e: React.PointerEvent<HTMLSpanElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragging.current = true
    grab.current = { startX: e.clientX, lensX: x.get(), moves: [{ x: e.clientX, t: performance.now() }] }
  }
  const onPointerMove = (e: React.PointerEvent<HTMLSpanElement>) => {
    const g = grab.current; const strip = scrollRef.current
    if (!g || !strip) return
    const min = 0, max = strip.scrollWidth - width.get()
    let next = g.lensX + (e.clientX - g.startX)
    if (next < min) next = min + rubberband(next - min, strip.clientWidth)
    if (next > max) next = max + rubberband(next - max, strip.clientWidth)
    x.set(next)
    g.moves.push({ x: e.clientX, t: performance.now() }); if (g.moves.length > 6) g.moves.shift()
  }
  const onPointerUp = () => {
    const g = grab.current; grab.current = null; dragging.current = false
    if (!g) return
    const first = g.moves[0], last = g.moves[g.moves.length - 1]
    const dt = Math.max(1, last.t - first.t)
    const velocity = ((last.x - first.x) / dt) * 1000
    const landing = x.get() + width.get() / 2 + project(velocity)
    let nearest = 0, best = Infinity
    items.forEach((_, i) => { const t = targetFor(i); if (!t) return; const d = Math.abs(t.x + t.width / 2 - landing); if (d < best) { best = d; nearest = i } })
    moveLensTo(nearest, velocity)
    if (nearest !== activeIndex) navigate(items[nearest].to)
  }

  return (
    <nav className="fc-floating-nav fc-liquid" aria-label="Quick navigation">
      <div ref={scrollRef} className="fc-floating-scroll">
        {visible && (
          <motion.span
            className="fc-lens fc-lens-grab"
            style={{ x, width, top: 0, bottom: 0, left: 0 }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            aria-hidden="true"
          />
        )}
        {items.map((item, i) => (
          <NavLink
            key={item.to}
            ref={el => { itemRefs.current[i] = el }}
            to={item.to}
            end={HOME.has(item.to)}
            aria-label={item.label}
            title={item.label}
            className={({ isActive }) => cn('fc-floating-item', isActive && 'fc-floating-item-active')}
          >
            <item.icon className="w-[18px] h-[18px] flex-shrink-0 lg:hidden" aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
      {role === 'user' && (
        <Link to="/dashboard/upload" className="fc-floating-plus" aria-label="Upload photos" title="Upload photos">
          <Plus className="w-5 h-5" aria-hidden="true" />
        </Link>
      )}
    </nav>
  )
}
