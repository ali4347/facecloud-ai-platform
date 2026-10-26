import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Upload, Images, Users,
  Download, Settings, BarChart3, AlertCircle,
  ClipboardList, Server, UserCog, ShieldCheck, Eye, ScrollText,
  HardDrive, X, Bell, Briefcase, LineChart, UsersRound, ImageOff, Building2, ClipboardCheck, Mail
} from 'lucide-react'
import { useOwnedOrganizations } from '../../lib/useOwnedOrganizations'
import { useModeratorOrganization } from '../../lib/moderationData'
import { AuthedImage } from '../ui/AuthedImage'
import { getOrgLogoBlob } from '../../lib/api/organizations'
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
  { label: 'Moderation',         icon: Eye,              to: '/admin/moderation' },
  { label: 'Invitations',        icon: Mail,             to: '/admin/invitations' },
  { label: 'Audit Logs',         icon: ClipboardList,    to: '/admin/audit-logs' },
  { label: 'Security Monitoring',icon: ShieldCheck,      to: '/admin/security' },
  { label: 'System Monitoring',  icon: Server,           to: '/admin/system' },
  { label: 'Statistics',         icon: LineChart,        to: '/admin/statistics' },
  { label: 'Upload Statistics',  icon: BarChart3,        to: '/admin/upload-statistics' },
  { label: 'Rejection Summary',  icon: AlertCircle,      to: '/admin/rejection-summary' },
  { label: 'Image Monitoring',   icon: Images,           to: '/admin/images' },
  { label: 'Settings',           icon: Settings,         to: '/admin/settings' },
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
  { label: 'Decision Log',         icon: ClipboardCheck,  to: '/moderator/logs' },
  { label: 'Audit Entries',        icon: ScrollText,      to: '/moderator/audit' },
  { label: 'Settings',             icon: Settings,        to: '/moderator/settings' },
]

export const navByRole = { user: userNav, admin: adminNav, moderator: moderatorNav }

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
  // A person who owns an organization also gets its management page, between Downloads and Settings.
  const { owned } = useOwnedOrganizations(role === 'user')
  const { team } = useModeratorOrganization(role === 'moderator')
  const nav = role === 'user' && owned.length > 0
    ? [...userNav.slice(0, -1), { label: 'My Organization', icon: Building2, to: '/dashboard/organization' }, userNav[userNav.length - 1]]
    : navByRole[role]
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

  const isCurrent = (to: string) =>
    to === '/dashboard' || to === '/admin' || to === '/moderator' ? location.pathname === to : location.pathname.startsWith(to)
  const isHome = (to: string) => to === '/admin' || to === '/dashboard' || to === '/moderator'
  const closeOnPhone = () => { if (window.innerWidth < 1024 && onClose) onClose() }

  return (
    <aside
      className={cn(
        'fc-sidebar fixed z-50 flex flex-col',
        'top-0 bottom-0 left-0 w-[288px] overflow-y-auto',
        'lg:top-[84px] lg:bottom-[88px] lg:left-3 lg:w-[62px] lg:overflow-visible',
        'transform transition-transform duration-300 ease-out lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* ── Desk: an icon rail. The brand mark on top, the account at the foot. ── */}
      <div className="fc-rail hidden lg:flex flex-col items-center gap-1 px-2.5 py-2.5">
        <FaceCloudLogo variant="icon" size="xs" tone="app" showText={false} showSubtitle={false} href={roleHome[role]} priority={true} />
        <div className="w-6 border-t border-line/60 my-2" />
        {nav.map(item => {
          const active = isCurrent(item.to)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={isHome(item.to)}
              aria-label={item.label}
              data-tip={item.label}
              className={cn('fc-rail-item', active && 'fc-rail-item-active')}
            >
              <item.icon className="w-[19px] h-[19px]" aria-hidden="true" />
            </NavLink>
          )
        })}
        <div className="w-6 border-t border-line/60 my-2" />
        <UserMenu role={role} compact />
      </div>

      {/* ── Phone: the drawer, with names ─────────────────────────────────── */}
      <div className="lg:hidden flex flex-col flex-1">
        <div className="px-4 pt-4 pb-3">
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
                className="fc-icon-btn !w-8 !h-8"
                type="button"
                aria-label="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-line/60">
            {role === 'moderator' && team ? (
              <div className="flex items-center gap-2.5" style={team.accent ? { borderLeft: `3px solid ${team.accent}`, paddingLeft: 10 } : undefined}>
                {team.logoUrl && <AuthedImage load={signal => getOrgLogoBlob(team.logoUrl as string, signal)} cacheKey={`team-logo-${team.id}-${team.logoUrl}`} alt="" box={28} rounded="rounded-lg" className="object-contain !border-0" />}
                <div className="min-w-0"><p className="text-[13px] font-semibold text-ink leading-tight truncate">{team.brandName}</p><p className="text-[11px] text-ink-mute leading-snug mt-0.5">{cfg.label}</p></div>
              </div>
            ) : (
              <>
                <p className="text-[13px] font-semibold text-ink leading-tight">{cfg.label}</p>
                <p className="text-[11px] text-ink-mute leading-snug mt-0.5">{cfg.tagline}</p>
              </>
            )}
          </div>
        </div>

        <nav className="flex-1 px-3 py-1">
          <p className="px-3 pt-1 pb-2 text-[11px] font-medium text-ink-faint tracking-wide">
            {cfg.navLabel}
          </p>
          <div className="flex flex-col gap-0.5">
            {nav.map(item => {
              const active = isCurrent(item.to)
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  // The portal's home link must not count as "current" on every page below it.
                  end={isHome(item.to)}
                  onClick={closeOnPhone}
                  className={cn('group fc-nav-item', active && 'fc-nav-item-active')}
                >
                  <item.icon
                    className={cn(
                      'w-[17px] h-[17px] flex-shrink-0 transition-colors',
                      active ? 'text-accent' : 'text-ink-faint group-hover:text-ink-mute'
                    )}
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />}
                </NavLink>
              )
            })}
          </div>
        </nav>

        {/* Storage: what the backend can actually answer — how much has been stored. There is no plan
            or quota in the system, so no bar against a limit is drawn. */}
        {role === 'user' && summary && (
          <div className="px-3 pb-2">
            <div className="fc-tile rounded-[18px] p-3">
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
          </div>
        )}

        <div className="px-3 pb-3 mt-auto">
          <UserMenu role={role} />
        </div>
      </div>
    </aside>
  )
}
