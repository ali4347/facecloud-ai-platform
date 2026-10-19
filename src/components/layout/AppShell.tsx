import { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { ErrorBoundary } from '../ui/ErrorBoundary'
import { useAppearance } from '../../lib/theme'
import type { Role } from '../../data/mock'
import { SESSION_LOST_EVENT } from '../../lib/api/client'
import { clearSession } from '../../lib/session'

interface AppShellProps {
  role: Role
}

export function AppShell({ role }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [appearance, toggleAppearance] = useAppearance()
  const navigate = useNavigate()
  const location = useLocation()

  /* The API says the session is over (revoked, expired, or the server no longer knows it): sign out and say why. */
  useEffect(() => {
    const onLost = () => {
      clearSession(role)
      const to = role === 'admin' ? '/admin/login' : role === 'moderator' ? '/moderator/login' : '/login'
      navigate(to, { replace: true, state: { sessionExpired: true } })
    }
    window.addEventListener(SESSION_LOST_EVENT, onLost)
    return () => window.removeEventListener(SESSION_LOST_EVENT, onLost)
  }, [role, navigate])

  // Escape key listener to close sidebar
  useEffect(() => {
    if (!sidebarOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sidebarOpen])

  // Body scroll lock on mobile
  useEffect(() => {
    if (sidebarOpen && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  return (
    <div className="fc-app min-h-screen relative">
      {/* Sidebar */}
      <Sidebar role={role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-[2px] lg:hidden cursor-default w-full h-full text-left"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:pl-[280px] flex flex-col min-h-screen relative z-10">
        <Topbar
          role={role}
          sidebarOpen={sidebarOpen}
          onMenuClick={() => setSidebarOpen(o => !o)}
          onCloseSidebar={() => setSidebarOpen(false)}
          appearance={appearance}
          onToggleAppearance={toggleAppearance}
        />
        <main className="flex-1 px-4 sm:px-6 lg:px-7 py-6 page-enter">
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
