import { useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Upload, Images, Users,
  Download, Settings, BarChart3, AlertCircle,
  ClipboardList, Server, Code2, ShieldCheck, Key, Eye, ScrollText,
  ChevronRight, Sparkles, X, LogOut, Bell, Briefcase
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
  user:      { label: 'User Portal',      gradient: 'from-[#F97316] to-[#FB923C]' },
  admin:     { label: 'Admin Panel',      gradient: 'from-[#EA580C] to-[#FDBA74]' },
  moderator: { label: 'Moderator Panel',  gradient: 'from-[#FB923C] to-[#EA580C]' },
}

export function Sidebar({ role, isOpen, onClose }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const nav = navByRole[role]
  const cfg = roleConfig[role]

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
        "fixed top-0 bottom-0 left-0 w-64 flex flex-col z-50 transform transition-transform duration-300 ease-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
      style={{
        background: 'rgba(0, 0, 0, 0.95)',
        borderRight: '1px solid rgba(249, 115, 22, 0.12)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: '4px 0 40px rgba(0,0,0,0.5)',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center justify-between px-5 py-5"
        style={{ borderBottom: '1px solid rgba(249,115,22,0.1)' }}
      >
        <FaceCloudLogo
          variant="horizontal"
          size="md"
          roleLabel={cfg.label}
          href={role === 'admin' ? '/admin' : role === 'moderator' ? '/moderator' : '/dashboard'}
          priority={true}
        />
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
            type="button"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4 text-white/40" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
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
              className={cn(isActive ? 'sidebar-item-active' : 'sidebar-item')}
            >
              <item.icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-[#F97316]' : 'text-white/35')} />
              <span className="flex-1 text-xs">{item.label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#F97316]" />}
            </NavLink>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-[#EF4444] hover:bg-[#EF4444]/5 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Logout</span>
        </button>
      </div>

      {/* Bottom badge */}
      <div
        className="px-4 py-4"
        style={{ borderTop: '1px solid rgba(249,115,22,0.1)' }}
      >
        <div
          className="flex items-center gap-2.5 p-3 rounded-2xl"
          style={{
            background: 'rgba(249, 115, 22, 0.06)',
            border: '1px solid rgba(249, 115, 22, 0.15)',
          }}
        >
          <Sparkles className="w-4 h-4 text-[#F97316] flex-shrink-0 animate-pulse" />
          <div>
            <p className="text-xs font-semibold text-white">Zero-DCE AI</p>
            <p className="text-[10px] text-white/35">Model active</p>
          </div>
          <div className="ml-auto w-2 h-2 bg-[#10B981] rounded-full animate-pulse" />
        </div>
      </div>
    </aside>
  )
}
