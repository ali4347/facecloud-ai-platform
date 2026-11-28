import { useState, useEffect, useCallback } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { FloatingNav } from './FloatingNav'
import { UploadDialog } from '../features/UploadDialog'
import { ErrorBoundary } from '../ui/ErrorBoundary'
import { NoOrganizationGuard } from '../moderator/NoOrganizationGuard'
import { DownloadAccessHost } from '../downloads/DownloadAccessHost'
import { useAppearance } from '../../lib/theme'
import type { Role } from '../../data/mock'
import { SESSION_LOST_EVENT } from '../../lib/api/client'
import { clearSession } from '../../lib/session'

interface AppShellProps {
  role: Role
}

export function AppShell({ role }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // The "+" in the bottom bar opens the upload popup over the current page (a member's shell only).
  const [uploadOpen, setUploadOpen] = useState(false)
  const closeUpload = useCallback(() => setUploadOpen(false), [])
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
      {/* The ground: a warm wash and three slow blobs behind everything */}
      <div className="fc-backdrop" aria-hidden="true">
        <span className="fc-shape fc-shape-left" />
        <span className="fc-shape fc-shape-right" />
        <span className="fc-shape fc-shape-shelf" />
        <span className="fc-shape fc-shape-floor" />
        <span className="fc-blob fc-blob-1" />
        <span className="fc-blob fc-blob-2" />
        <span className="fc-blob fc-blob-3" />
      </div>

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
      <div className="flex flex-col min-h-screen relative z-10">
        <Topbar
          role={role}
          sidebarOpen={sidebarOpen}
          onMenuClick={() => setSidebarOpen(o => !o)}
          onCloseSidebar={() => setSidebarOpen(false)}
          appearance={appearance}
          onToggleAppearance={toggleAppearance}
        />
        <main className="flex-1 px-3 sm:px-5 lg:pl-[60px] lg:pr-6 pt-4 pb-28">
          {/* One glass sheet holds the page; the floating pill below needs the extra bottom room. */}
          <div className="fc-stage page-enter">
            <ErrorBoundary key={location.pathname}>
              {role === 'moderator' ? <NoOrganizationGuard><Outlet /></NoOrganizationGuard> : <Outlet />}
            </ErrorBoundary>
          </div>
        </main>
      </div>

      <FloatingNav role={role} onUpload={() => setUploadOpen(true)} />

      {/* Inside .fc-app, not a portal to <body>: the glass styling is scoped to it. */}
      {role === 'user' && (
        <AnimatePresence>
          {uploadOpen && <UploadDialog key="upload-dialog" onClose={closeUpload} />}
        </AnimatePresence>
      )}
      {/* A download an approval-required organization refused, from any screen: explain it and offer to request access. */}
      {role === 'user' && <DownloadAccessHost />}
    </div>
  )
}
