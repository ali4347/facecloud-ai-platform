import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Settings, LogOut, ChevronDown, Shield } from 'lucide-react'
import { Avatar } from './Avatar'
import { announcePopoverOpen, onOtherPopoverOpen } from '../../lib/popover'
import type { Role } from '../../data/mock'

interface UserMenuProps {
  name: string
  email: string
  role: Role
  initials: string
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

export function UserMenu({ name, email, role, initials }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const badge = roleBadge[role]
  const location = useLocation()

  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on navigation — the menu used to stay open across a route change.
  useEffect(() => {
    setOpen(false)
  }, [location.pathname, location.search, location.hash])

  /* Close on a click anywhere outside.
     This replaces a full-screen backdrop div, which sat inside the topbar's own
     stacking context: the sidebar paints above it, so clicks over there never
     reached it and the menu stayed open. A document-level listener has no such
     blind spot. */
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

  // Escape closes and returns focus to the trigger.
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

  // Opening the notification panel closes this one.
  useEffect(() => onOtherPopoverOpen('user-menu', () => setOpen(false)), [])

  const handleToggle = () => {
    setOpen(prev => {
      const next = !prev
      if (next) announcePopoverOpen('user-menu')
      return next
    })
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={handleToggle}
        type="button"
        className="flex items-center gap-2.5 p-1 pr-2.5 rounded-xl border border-transparent hover:bg-surface hover:border-line transition-colors cursor-pointer"
        id="user-menu-btn"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Avatar email={email} initials={initials} size={36} fallbackColor={avatarColor[role]} />
        <div className="hidden sm:block text-left">
          <p className="text-[13px] font-semibold text-ink leading-none">{name.split(' ')[0]}</p>
          <p className="text-[11px] mt-1 capitalize text-ink-mute leading-none">{role}</p>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-ink-faint transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <>
          <div
            ref={panelRef}
            role="menu"
            aria-labelledby="user-menu-btn"
            className="absolute right-0 top-14 z-40 w-64 rounded-2xl overflow-hidden bg-surface border border-line shadow-soft-lg"
          >
            {/* Profile info */}
            <div className="px-4 py-4 border-b border-line-soft">
              <div className="flex items-center gap-3">
                <Avatar email={email} initials={initials} size={40} fallbackColor={avatarColor[role]} />
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-ink truncate">{name}</p>
                  <p className="text-[12px] text-ink-mute truncate">{email}</p>
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

            {/* Actions */}
            <div className="px-2 py-2">
              <Link
                to="/dashboard/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-ink-soft hover:bg-surface-mute transition-colors"
              >
                <Settings className="w-4 h-4 text-ink-faint" />
                Settings
              </Link>
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
