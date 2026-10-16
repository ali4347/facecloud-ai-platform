import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Settings, LogOut, ChevronUp, Shield } from 'lucide-react'
import { Avatar } from './Avatar'
import { useSessionUser } from '../../lib/session'
import { announcePopoverOpen, onOtherPopoverOpen } from '../../lib/popover'
import type { Role } from '../../data/mock'
import { logout } from '../../lib/api/auth'
import { USE_API } from '../../lib/api/config'

interface UserMenuProps {
  role: Role
}

const roleBadge: Record<Role, { bg: string; border: string; color: string }> = {
  user:      { bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.28)', color: '#EA580C' },
  admin:     { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.28)', color: '#A78BFA' },
  moderator: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.28)', color: '#34D399' },
}

const avatarColor: Record<Role, string> = {
  user:      '#F97316',
  admin:     '#EA580C',
  moderator: '#10B981',
}

/** Admin has no settings page, so the row only appears where it leads somewhere. */
const settingsPath: Partial<Record<Role, string>> = {
  user:      '/dashboard/settings',
  moderator: '/moderator/settings',
}

const loginPath: Record<Role, string> = {
  user:      '/login',
  admin:     '/admin/login',
  moderator: '/moderator/login',
}

/**
 * The account card at the foot of the sidebar, and the menu it opens.
 *
 * This is the only place the signed-in person appears in the shell. The topbar
 * carried a second copy of the same details and a second menu; one of the two
 * had to be kept in step with the other, and they had already drifted.
 */
export function UserMenu({ role }: UserMenuProps) {
  const account = useSessionUser(role)
  const badge = roleBadge[role]
  const settingsTo = settingsPath[role]

  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setOpen(false)
  }, [location.pathname, location.search, location.hash])

  /* A document-level listener rather than a backdrop element: the sidebar has
     its own stacking context, so a backdrop rendered here could not catch
     clicks over the rest of the page. */
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (btnRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        btnRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  useEffect(() => onOtherPopoverOpen('user-menu', () => setOpen(false)), [])

  const handleToggle = () => {
    setOpen(prev => {
      const next = !prev
      if (next) announcePopoverOpen('user-menu')
      return next
    })
  }

  /* Signing out clears the session first. The old topbar menu only linked to
     /login, which left the session in place, so the guard sent you back in. */
  const handleLogout = () => {
    localStorage.removeItem('facecloud_session')
    /* Against the real backend this also revokes the refresh token, so the
       session cannot be revived from another tab. It clears the local tokens
       even if the call fails, so it does not need to be awaited. */
    if (USE_API) void logout()
    setOpen(false)
    navigate(loginPath[role])
  }

  return (
    <div className="relative mt-auto">
      {open && (
        <div
          ref={panelRef}
          role="menu"
          aria-labelledby="user-menu-btn"
          className="absolute bottom-full left-0 right-0 mb-2 z-50 rounded-2xl overflow-hidden
                     bg-surface border border-line shadow-soft-lg"
        >
          <div className="px-4 py-4 border-b border-line-soft">
            <div className="flex items-center gap-3">
              <Avatar email={account.email} initials={account.initials} size={40} fallbackColor={avatarColor[role]} />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-ink truncate">{account.name}</p>
                <p className="text-[12px] text-ink-mute truncate">{account.email}</p>
              </div>
            </div>
            <div
              className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
              style={{ background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color }}
            >
              <Shield className="w-3 h-3" />
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </div>
          </div>

          <div className="px-2 py-2">
            {settingsTo && (
              <Link
                to={settingsTo}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-ink-soft hover:bg-surface-mute transition-colors"
              >
                <Settings className="w-4 h-4 text-ink-faint" />
                Settings
              </Link>
            )}
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}

      <button
        ref={btnRef}
        id="user-menu-btn"
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        aria-haspopup="menu"
        className="w-full bg-surface border border-line rounded-[18px] shadow-soft p-3 text-left
                   hover:border-line-strong transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <Avatar email={account.email} initials={account.initials} size={36} fallbackColor={avatarColor[role]} />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-ink truncate leading-none">{account.name}</p>
            <span className="inline-flex mt-1.5 px-1.5 py-0.5 rounded-md bg-accent-tint text-accent-soft text-[10px] font-semibold capitalize leading-none">
              {role}
            </span>
          </div>
          <ChevronUp
            className={`w-4 h-4 text-ink-faint flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>
    </div>
  )
}
