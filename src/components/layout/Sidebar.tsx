import { useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Upload, Images, Users,
  Download, Settings, BarChart3, AlertCircle,
  ClipboardList, Server, Code2, ShieldCheck, Key, Eye, ScrollText,
  Sparkles, X, LogOut, Bell, Briefcase
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { FaceCloudLogo } from '../branding/FaceCloudLogo'

interface SidebarProps {
  role: 'user' | 'admin' | 'moderator'
  collapsed?: boolean
  isOpen?: boolean
  onClose?: () => void
}

const userNav = [
  { label: 'Overview',       icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Upload Center',  icon: Upload,          to: '/dashboard/upload' },
  { label: 'My Images',      icon: Images,          to: '/dashboard/images' },
  { label: 'Person Folders', icon: Users,           to: '/dashboard/groups' },
  { label: 'Downloads',      icon: Download,        to: '/dashboard/downloads' },
  { label: 'Settings',       icon: Settings,        to: '/dashboard/settings' },
]

const adminNav = [
  { label: 'Overview',           icon: LayoutDashboard, to: '/admin' },
  { label: 'Manage Users',       icon: Users,            to: '/admin/users' },
  { label: 'Audit Logs',         icon: ClipboardList,    to: '/admin/audit-logs' },
  { label: 'Security Monitoring',icon: ShieldCheck,      to: '/admin/security' },
  { label: 'API Documentation',  icon: Code2,            to: '/admin/api-docs' },
  { label: 'Test API Endpoints', icon: Key,              to: '/admin/api-test' },
  { label: 'System Monitoring',  icon: Server,           to: '/admin/system' },
  { label: 'Upload Statistics',  icon: BarChart3,        to: '/admin/upload-statistics' },
  { label: 'Rejection Summary',  icon: AlertCircle,      to: '/admin/rejection-summary' },
  { label: 'Image Monitoring',   icon: Images,           to: '/admin/images' },
]

const moderatorNav = [
  { label: 'Moderator Dashboard', icon: LayoutDashboard, to: '/moderator' },
  { label: 'Member Management',    icon: Users,           to: '/moderator/members' },
  { label: 'Review & Dup. Queue',  icon: Eye,             to: '/moderator/queue' },
  { label: 'Batch Management',     icon: Briefcase,       to: '/moderator/batches' },
  { label: 'Notification Center',  icon: Bell,            to: '/moderator/notifications' },
  { label: 'Reports & Exports',    icon: BarChart3,       to: '/moderator/reports' },
  { label: 'Audit Entries',        icon: ScrollText,      to: '/moderator/audit' },
  { label: 'Settings',             icon: Settings,        to: '/moderator/settings' },
]

const navByRole = { user: userNav, admin: adminNav, moderator: moderatorNav }

const roleConfig = {
  user: {
    label: 'User Portal',
    tagline: 'Upload, enhance and organize your photos',
    navLabel: 'Image Tools',
  },
  admin: {
    label: 'Admin Panel',
    tagline: 'Monitor the platform, users and system health',
    navLabel: 'Admin Tools',
  },
  moderator: {
    label: 'Moderator Panel',
    tagline: 'Review flagged images and keep the queue moving',
    navLabel: 'Review Tools',
  },
}

const roleHome = {
  user: '/dashboard',
  admin: '/admin',
  moderator: '/moderator',
}

/* Same avatar colour the topbar's UserMenu uses, so the two representations of
   the signed-in person match. */
const avatarColor = {
  user:      '#4F46E5',
  admin:     '#4338CA',
  moderator: '#059669',
}

const fallbackUser = {
  user:      { name: 'Ali Hassan',     initials: 'AH' },
  admin:     { name: 'Ali Hassan',     initials: 'AH' },
  moderator: { name: 'Vaneeza Sohaib', initials: 'VS' },
}

export function Sidebar({ role, isOpen, onClose }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const nav = navByRole[role]
  const cfg = roleConfig[role]

  /* Read the signed-in person from the session, exactly as the topbar does. */
  let account = fallbackUser[role]
  const sessionStr = localStorage.getItem('facecloud_session')
  if (sessionStr) {
    try {
      const session = JSON.parse(sessionStr)
      if (session.role === role) {
        account = {
          name:     session.name     || account.name,
          initials: session.initials || account.initials,
        }
      }
    } catch (_) { /* ignore a malformed session and keep the fallback */ }
  }

  const handleLogout = () => {
    localStorage.removeItem('facecloud_session')
    if (role === 'admin') navigate('/admin/login')
    else if (role === 'moderator') navigate('/moderator/login')
    else navigate('/login')
  }

  // Auto-close on route change for mobile width
  useEffect(() => {
    if (onClose) {
      onClose()
    }
  }, [location.pathname])

  return (
    <aside
      className={cn(
        'fixed top-0 bottom-0 left-0 w-[280px] z-50 flex flex-col gap-3 p-3',
        'bg-surface-soft overflow-y-auto',
        'transform transition-transform duration-300 ease-out lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* ── Brand card ─────────────────────────────────────────────── */}
      <div className="bg-surface border border-line rounded-[18px] shadow-soft px-4 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <FaceCloudLogo
            variant="horizontal"
            size="sm"
            tone="light"
            showSubtitle={false}
            href={roleHome[role]}
            priority={true}
          />
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-ink-faint hover:bg-surface-mute hover:text-ink transition-colors cursor-pointer"
              type="button"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-line-soft">
          <p className="text-[13px] font-semibold text-ink leading-tight">{cfg.label}</p>
          <p className="text-[11px] text-ink-mute leading-snug mt-0.5">{cfg.tagline}</p>
        </div>
      </div>

      {/* ── Navigation card ────────────────────────────────────────── */}
      <nav className="bg-surface border border-line rounded-[18px] shadow-soft p-2.5">
        <p className="px-2.5 pt-1 pb-2.5 text-[11px] font-medium text-ink-faint tracking-wide">
          {cfg.navLabel}
        </p>
        <div className="flex flex-col gap-0.5">
          {nav.map(item => {
            const isActive =
              item.to === '/dashboard' || item.to === '/admin' || item.to === '/moderator'
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to)

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => {
                  if (window.innerWidth < 1024 && onClose) onClose()
                }}
                className={cn(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-200 cursor-pointer',
                  isActive
                    ? 'bg-surface border border-line text-ink font-semibold shadow-pill'
                    : 'text-ink-mute font-medium border border-transparent hover:bg-surface-mute hover:text-ink'
                )}
              >
                <item.icon
                  className={cn(
                    'w-[17px] h-[17px] flex-shrink-0 transition-colors',
                    isActive ? 'text-accent' : 'text-ink-faint group-hover:text-ink-mute'
                  )}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />}
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* ── Model status card ──────────────────────────────────────── */}
      <div className="bg-surface border border-line rounded-[18px] shadow-soft p-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-accent-tint flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-ink leading-none">Zero-DCE AI</p>
            <p className="text-[11px] text-ink-mute mt-1 leading-none">Model active</p>
          </div>
          <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
        </div>
      </div>

      {/* ── Account card ───────────────────────────────────────────── */}
      <div className="mt-auto bg-surface border border-line rounded-[18px] shadow-soft p-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0"
            style={{ background: avatarColor[role] }}
          >
            {account.initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-ink truncate leading-none">
              {account.name}
            </p>
            <span className="inline-flex mt-1.5 px-1.5 py-0.5 rounded-md bg-accent-tint text-accent-deep text-[10px] font-semibold capitalize leading-none">
              {role}
            </span>
          </div>
          <button
            onClick={handleLogout}
            type="button"
            aria-label="Logout"
            title="Logout"
            className="p-2 rounded-lg text-ink-faint hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
