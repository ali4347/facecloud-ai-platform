import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Menu, History, Sun, Moon } from 'lucide-react'
import { NotificationDropdown } from '../ui/NotificationDropdown'
import { GlobalSearch } from './GlobalSearch'
import type { Appearance } from '../../lib/theme'
import type { Role } from '../../data/mock'

interface TopbarProps {
  role: Role
  onMenuClick?: () => void
  sidebarOpen?: boolean
  onCloseSidebar?: () => void
  appearance?: Appearance
  onToggleAppearance?: () => void
}


/* Each portal keeps its own activity trail, so the history button goes to the
   one that belongs to the signed-in role. */
const activityPath: Record<Role, string> = {
  user:      '/dashboard/activity',
  admin:     '/admin/audit-logs',
  moderator: '/moderator/audit',
}

export function Topbar({ role, onMenuClick, sidebarOpen, onCloseSidebar, appearance = 'dark', onToggleAppearance }: TopbarProps) {
  const searchRef = useRef<HTMLInputElement>(null)

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
        <GlobalSearch role={role} inputRef={searchRef} />
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
        <NotificationDropdown sidebarOpen={sidebarOpen} onOpen={onCloseSidebar} role={role} />
        <Link
          to={activityPath[role]}
          className="fc-icon-btn hidden md:inline-flex"
          aria-label="Activity history"
          title="Activity history"
        >
          <History className="w-[18px] h-[18px]" />
        </Link>
      </div>
    </header>
  )
}
