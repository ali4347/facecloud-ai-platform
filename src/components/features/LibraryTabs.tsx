import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Clock, Copy, Heart, Images, MapPin, Trash2, FolderHeart } from 'lucide-react'

const TABS = [
  { to: '/dashboard/images', label: 'All photos', icon: Images, match: (path: string, search: string) => path === '/dashboard/images' && !/favorite=/.test(search) },
  { to: '/dashboard/images?favorite=true', label: 'Favourites', icon: Heart, match: (path: string, search: string) => path === '/dashboard/images' && /favorite=/.test(search) },
  { to: '/dashboard/albums', label: 'Albums', icon: FolderHeart, match: (path: string) => path.startsWith('/dashboard/albums') },
  { to: '/dashboard/places', label: 'Places', icon: MapPin, match: (path: string) => path.startsWith('/dashboard/places') },
  { to: '/dashboard/moments', label: 'Moments', icon: Clock, match: (path: string) => path.startsWith('/dashboard/moments') },
  { to: '/dashboard/duplicates', label: 'Duplicates', icon: Copy, match: (path: string) => path.startsWith('/dashboard/duplicates') },
  { to: '/dashboard/trash', label: 'Trash', icon: Trash2, match: (path: string) => path.startsWith('/dashboard/trash') },
]

/** The ways into the photo library, shown above each of its screens. */
export function LibraryTabs() {
  const { pathname, search } = useLocation()
  const strip = useRef<HTMLElement>(null)
  /* On a phone the strip scrolls sideways; bring the current tab into view so the person can see where they are. */
  useEffect(() => {
    const nav = strip.current
    const current = nav?.querySelector<HTMLElement>('[aria-current="page"]')
    if (nav && current) nav.scrollLeft = Math.max(0, current.offsetLeft - (nav.clientWidth - current.offsetWidth) / 2)
  }, [pathname, search])
  return (
    <nav ref={strip} aria-label="Photo library" className="mb-5 -mx-1 overflow-x-auto">
      <ul className="flex gap-1.5 px-1 w-max min-w-full">
        {TABS.map(tab => {
          const active = tab.match(pathname, search)
          const Icon = tab.icon
          return (
            <li key={tab.label}>
              <Link
                to={tab.to}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-colors ${
                  active ? 'bg-accent/15 text-accent border-accent/30' : 'text-ink-mute border-line bg-surface-mute hover:text-ink'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />{tab.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
