import { Menu } from 'lucide-react'
import { NotificationDropdown } from '../ui/NotificationDropdown'
import { UserMenu } from '../ui/UserMenu'
import { SearchInput } from '../ui/SearchInput'
import type { Role } from '../../data/mock'

interface TopbarProps {
  role: Role
  onMenuClick?: () => void
  sidebarOpen?: boolean
  onCloseSidebar?: () => void
}

const roleUser = {
  user:      { name: 'Ali Hassan',      email: 'ali@facecloud.io',      initials: 'AH' },
  admin:     { name: 'Ali Hassan',      email: 'ali@facecloud.io',      initials: 'AH' },
  moderator: { name: 'Vaneeza Sohaib',  email: 'vaneeza@facecloud.io',  initials: 'VS' },
}

export function Topbar({ role, onMenuClick, sidebarOpen, onCloseSidebar }: TopbarProps) {
  const sessionStr = localStorage.getItem('facecloud_session')
  let user = roleUser[role]

  if (sessionStr) {
    try {
      const session = JSON.parse(sessionStr)
      if (session.role === role) {
        user = {
          name:     session.name     || user.name,
          email:    session.email    || user.email,
          initials: session.initials || user.initials,
        }
      }
    } catch (_) { /* ignore */ }
  }

  return (
    <header
      className="sticky top-0 z-30 h-16 flex items-center gap-4 px-6"
      style={{
        background: 'rgba(0,0,0,0.85)',
        borderBottom: '1px solid rgba(249,115,22,0.1)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-xl hover:bg-white/5 transition-colors"
      >
        <Menu className="w-5 h-5 text-white/40" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-sm hidden md:block">
        <SearchInput placeholder="Search images, groups, jobs…" className="w-full" />
      </div>

      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <NotificationDropdown sidebarOpen={sidebarOpen} onOpen={onCloseSidebar} />
        <div className="w-px h-6 mx-1" style={{ background: 'rgba(249,115,22,0.15)' }} />
        <UserMenu name={user.name} email={user.email} role={role} initials={user.initials} />
      </div>
    </header>
  )
}
