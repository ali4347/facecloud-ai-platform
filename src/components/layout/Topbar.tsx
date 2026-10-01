import { useEffect, useRef, useState } from 'react'
import { Menu, Search, Settings, History, Sun, Moon } from 'lucide-react'
import { NotificationDropdown } from '../ui/NotificationDropdown'
import { UserMenu } from '../ui/UserMenu'
import type { Appearance } from '../../lib/theme'
import { getSessionUser } from '../../lib/session'
import type { Role } from '../../data/mock'

interface TopbarProps {
  role: Role
  onMenuClick?: () => void
  sidebarOpen?: boolean
  onCloseSidebar?: () => void
  appearance?: Appearance
  onToggleAppearance?: () => void
}


export function Topbar({ role, onMenuClick, sidebarOpen, onCloseSidebar, appearance = 'dark', onToggleAppearance }: TopbarProps) {
  const searchRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const user = getSessionUser(role)

  /* ⌘K / Ctrl+K focuses search — the shortcut the chip in the field advertises. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header className="sticky top-0 z-30 h-[72px] flex items-center gap-3 px-4 sm:px-6 lg:px-7 bg-surface-soft/90 backdrop-blur-md">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuClick}
        className="fc-icon-btn lg:hidden flex-shrink-0"
        type="button"
        aria-label="Open menu"
      >
        <Menu className="w-[18px] h-[18px]" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-[460px]">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint pointer-events-none" />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search project..."
            aria-label="Search images, groups and jobs"
            className="w-full h-11 pl-10 pr-16 rounded-[14px] bg-surface border border-line text-[13px] text-ink
                       placeholder:text-ink-faint shadow-[0_1px_2px_rgb(var(--a-shadow-rgb) / 0.45)] outline-none
                       transition-colors focus:border-accent-soft"
          />
          <span className="fc-kbd absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center">
            ⌘ K
          </span>
        </div>
      </div>

      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleAppearance}
          className="fc-icon-btn hidden sm:inline-flex"
          aria-label={appearance === 'dark' ? 'Switch to light appearance' : 'Switch to dark appearance'}
          title={appearance === 'dark' ? 'Light appearance' : 'Dark appearance'}
          aria-pressed={appearance === 'light'}
        >
          {appearance === 'dark'
            ? <Sun className="w-[18px] h-[18px]" />
            : <Moon className="w-[18px] h-[18px]" />}
        </button>
        <button type="button" className="fc-icon-btn hidden sm:inline-flex" aria-label="Settings" title="Settings">
          <Settings className="w-[18px] h-[18px]" />
        </button>
        <NotificationDropdown sidebarOpen={sidebarOpen} onOpen={onCloseSidebar} />
        <button type="button" className="fc-icon-btn hidden md:inline-flex" aria-label="Activity history" title="Activity history">
          <History className="w-[18px] h-[18px]" />
        </button>
        <div className="w-px h-6 bg-line mx-1 hidden sm:block" />
        <UserMenu name={user.name} email={user.email} role={role} initials={user.initials} />
      </div>
    </header>
  )
}
