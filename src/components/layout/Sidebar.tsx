import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Upload, Images, Users,
  Download, Settings, BarChart3, AlertCircle,
  ClipboardList, Server, UserCog, ShieldCheck, Eye, ScrollText,
  HardDrive, X, Bell, Briefcase, LineChart, UsersRound, ImageOff, Building2
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useUserDashboard, formatBytes } from '../../lib/imageData'
import { FaceCloudLogo } from '../branding/FaceCloudLogo'
import { UserMenu } from '../ui/UserMenu'

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
  { label: 'Organizations',      icon: Building2,        to: '/admin/organizations' },
  { label: 'Moderators',         icon: UserCog,          to: '/admin/moderators' },
  { label: 'Audit Logs',         icon: ClipboardList,    to: '/admin/audit-logs' },
  { label: 'Security Monitoring',icon: ShieldCheck,      to: '/admin/security' },
  { label: 'System Monitoring',  icon: Server,           to: '/admin/system' },
  { label: 'Statistics',         icon: LineChart,        to: '/admin/statistics' },
  { label: 'Upload Statistics',  icon: BarChart3,        to: '/admin/upload-statistics' },
  { label: 'Rejection Summary',  icon: AlertCircle,      to: '/admin/rejection-summary' },
  { label: 'Image Monitoring',   icon: Images,           to: '/admin/images' },
]

const moderatorNav = [
  { label: 'Moderator Dashboard', icon: LayoutDashboard, to: '/moderator' },
  { label: 'Member Management',    icon: Users,           to: '/moderator/members' },
  { label: 'Review & Dup. Queue',  icon: Eye,             to: '/moderator/queue' },
  { label: 'Identity Review',      icon: UsersRound,      to: '/moderator/identity' },
  { label: 'Rejected Images',      icon: ImageOff,        to: '/moderator/rejected' },
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


export function Sidebar({ role, isOpen, onClose }: SidebarProps) {
  const location = useLocation()
  const nav = navByRole[role]
  const cfg = roleConfig[role]
  // Only the user portal shows storage, so only it asks for the figures.
  const dashboard = useUserDashboard()
  const summary = role === 'user' ? dashboard.data?.summary : null

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
            tone="app"
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
                // The portal's home link must not count as "current" on every page below it.
                end={item.to === '/admin' || item.to === '/dashboard' || item.to === '/moderator'}
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

      {/* ── Storage card ───────────────────────────────────────────
           Replaces a card that named the enhancement model. Which model runs
           is an implementation detail; how much room is taken is not.

           There is no plan or quota in the system, so none is drawn: a bar
           against a limit nothing enforces would be a made-up number, and the
           previous "312 MB of 500 MB" was exactly that. What is shown is what
           the backend can actually answer — how much has been stored. */}
      {role === 'user' && summary && (
        <div className="bg-surface border border-line rounded-[18px] shadow-soft p-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent-tint flex items-center justify-center flex-shrink-0">
              <HardDrive className="w-4 h-4 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink leading-none">
                {formatBytes(summary.storage_bytes)} stored
              </p>
              <p className="text-[11px] text-ink-mute mt-1 leading-none">
                {summary.total_images} photo{summary.total_images === 1 ? '' : 's'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Account menu ────────────────────────────────────────── */}
      <UserMenu role={role} />
    </aside>
  )
}
