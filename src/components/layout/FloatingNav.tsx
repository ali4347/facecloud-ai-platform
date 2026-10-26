import { useEffect, useRef } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { navByRole } from './Sidebar'
import { cn } from '../../lib/utils'
import type { Role } from '../../data/mock'

/* The portal's home link must not count as "current" on every page below it. */
const HOME = new Set(['/dashboard', '/admin', '/moderator'])

/**
 * The floating pill at the foot of the screen: every section of the portal by
 * name, scrolling sideways inside the pill when there are more than fit, plus
 * the upload shortcut for a member. It only points at routes the sidebar
 * already has; on a phone it shows icons alone, on a desk names alone.
 */
export function FloatingNav({ role }: { role: Role }) {
  const items = navByRole[role]
  const location = useLocation()
  const scrollRef = useRef<HTMLDivElement>(null)

  /* Keep the current section in view when the pill has scrolled past it. */
  useEffect(() => {
    const current = scrollRef.current?.querySelector<HTMLElement>('.fc-floating-item-active')
    current?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [location.pathname])

  return (
    <nav className="fc-floating-nav" aria-label="Quick navigation">
      <div ref={scrollRef} className="fc-floating-scroll">
        {items.map(item => (
          <NavLink
            key={item.to}
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
