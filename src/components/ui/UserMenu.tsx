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
  user:      { bg: 'rgba(0,132,255,0.12)',   border: 'rgba(96,177,255,0.25)',  color: '#60B1FF' },
  admin:     { bg: 'rgba(123,97,255,0.12)',  border: 'rgba(123,97,255,0.25)', color: '#A78BFA' },
  moderator: { bg: 'rgba(79,255,176,0.10)',  border: 'rgba(79,255,176,0.22)', color: '#4FFFB0' },
}

const avatarGradient: Record<Role, string> = {
  user:      'linear-gradient(135deg, #0084FF, #319AFF)',
  admin:     'linear-gradient(135deg, #7B61FF, #0084FF)',
  moderator: 'linear-gradient(135deg, #4FFFB0, #0084FF)',
}

export function UserMenu({ name, email, role, initials }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const badge = roleBadge[role]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl hover:bg-white/[0.06] transition-colors"
        id="user-menu-btn"
      >
        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style={{ background: avatarGradient[role] }}
        >
          {initials}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-semibold text-white leading-none">{name.split(' ')[0]}</p>
          <p className="text-[10px] mt-0.5 capitalize" style={{ color: 'rgba(255,255,255,0.45)' }}>{role}</p>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          style={{ color: 'rgba(255,255,255,0.35)' }} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-14 z-40 w-64 rounded-3xl overflow-hidden"
            style={{
              background: 'rgba(5,7,10,0.95)',
              border: '1px solid rgba(96,177,255,0.20)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: '0 24px 90px rgba(0,0,0,0.65), 0 0 50px rgba(0,132,255,0.10)',
            }}
          >
            {/* Profile info */}
            <div className="px-4 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ background: avatarGradient[role] }}
                >
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{name}</p>
                  <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>{email}</p>
                </div>
              </div>
              <div
                className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color }}
              >
                <Shield className="w-3 h-3" />
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </div>
            </div>

            {/* Role switch */}
            <div className="px-2 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] px-2 py-1 mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Switch Role (Demo)</p>
              {(['user', 'admin', 'moderator'] as Role[]).map(r => (
                <button
                  key={r}
                  onClick={() => { navigate(r === 'user' ? '/dashboard' : `/${r}`); setOpen(false) }}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm transition-colors capitalize"
                  style={{
                    background: role === r ? 'rgba(0,132,255,0.12)' : 'transparent',
                    color: role === r ? '#60B1FF' : 'rgba(255,255,255,0.65)',
                    fontWeight: role === r ? 600 : 400,
                  }}
                  onMouseEnter={e => { if (role !== r) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)' }}
                  onMouseLeave={e => { if (role !== r) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
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
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors"
                style={{ color: 'rgba(255,255,255,0.65)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <Settings className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.38)' }} />
                Settings
              </Link>
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors"
                style={{ color: '#F87171' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
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
