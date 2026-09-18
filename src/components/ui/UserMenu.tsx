import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Settings, LogOut, ChevronDown, Shield } from 'lucide-react'
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
  const navigate = useNavigate()
  const badge = roleBadge[role]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        type="button"
        className="flex items-center gap-2.5 p-1 pr-2.5 rounded-xl border border-transparent hover:bg-surface hover:border-line transition-colors cursor-pointer"
        id="user-menu-btn"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0"
          style={{ background: avatarColor[role] }}
        >
          {initials}
        </div>
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
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-14 z-40 w-64 rounded-2xl overflow-hidden bg-surface border border-line shadow-soft-lg">
            {/* Profile info */}
            <div className="px-4 py-4 border-b border-line-soft">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[13px] font-semibold flex-shrink-0"
                  style={{ background: avatarColor[role] }}
                >
                  {initials}
                </div>
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

            {/* Role switch */}
            <div className="px-2 py-2 border-b border-line-soft">
              <p className="text-[11px] px-2 py-1 mb-1 text-ink-faint">Switch Role (Demo)</p>
              {(['user', 'admin', 'moderator'] as Role[]).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => { navigate(r === 'user' ? '/dashboard' : `/${r}`); setOpen(false) }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors capitalize cursor-pointer ${
                    role === r
                      ? 'bg-accent-tint text-accent-soft font-semibold'
                      : 'text-ink-soft hover:bg-surface-mute'
                  }`}
                >
                  {r} Dashboard
                </button>
              ))}
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
