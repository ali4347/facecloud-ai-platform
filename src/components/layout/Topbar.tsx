import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Menu, History, Sun, Moon } from 'lucide-react'
import { NotificationDropdown } from '../ui/NotificationDropdown'
import { Avatar } from '../ui/Avatar'
import { GlobalSearch } from './GlobalSearch'
import { AdminSearch } from './AdminSearch'
import { useSessionUser } from '../../lib/session'
import { useServerAvatar } from '../../lib/useServerAvatar'
import { useModeratorOrganization } from '../../lib/moderationData'
import { USE_API } from '../../lib/api/config'
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
  /* The picture lives on the account in API mode, so another device's picture shows here too. */
  const account = useSessionUser(role)
  useServerAvatar(account.email, USE_API && role === 'user')
  /* A moderator works for one team; its name stays in view beside the greeting. */
  const { team } = useModeratorOrganization(role === 'moderator')
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
    <header className="sticky top-3 z-30 mx-3 sm:mx-5 lg:mx-6 h-14 flex items-center gap-2 sm:gap-3 pl-2.5 pr-2.5 sm:pl-3 sm:pr-3 rounded-full fc-glass-bar">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuClick}
        className="fc-icon-btn lg:hidden flex-shrink-0"
        type="button"
        aria-label="Open menu"
      >
        <Menu className="w-[18px] h-[18px]" />
      </button>

      {/* Who is signed in. The menu itself lives in the sidebar; this only greets. */}
      <div className="hidden lg:flex items-center gap-2.5 pl-1 flex-shrink-0 max-w-[320px]">
        <Avatar email={account.email} initials={account.initials} size={34} />
        <p className="text-[14px] font-semibold text-ink leading-tight truncate">Welcome, {account.name.split(' ')[0]}</p>
        {role === 'moderator' && team && (
          <span className="ml-1 px-2.5 py-1 rounded-full fc-tile text-[11px] font-semibold text-ink-soft truncate" style={team.accent ? { borderColor: team.accent } : undefined}>
            {team.brandName}
          </span>
        )}
      </div>

      {/* Search: takes the middle of the bar, centred between its neighbours */}
      <div className="flex-1 min-w-0 max-w-[460px] mx-auto">
        {role === 'admin'
          ? <AdminSearch inputRef={searchRef} />
          : <GlobalSearch role={role} inputRef={searchRef} />}
      </div>

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
