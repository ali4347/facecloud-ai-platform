import { useState, useEffect, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { getStoredAppearance, storeAppearance } from '../../lib/theme'
import type { Appearance } from '../../lib/theme'
import type { Role } from '../../data/mock'

interface AppShellProps {
  role: Role
}

export function AppShell({ role }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [appearance, setAppearance] = useState<Appearance>(getStoredAppearance)

  const toggleAppearance = useCallback(() => {
    setAppearance(current => {
      const next: Appearance = current === 'dark' ? 'light' : 'dark'
      storeAppearance(next)
      return next
    })
  }, [])

  /* The page behind the shell is painted black for the marketing site. In the
     light appearance that shows through on overscroll and under short pages,
     so repaint the body while the shell is mounted and restore it on the way
     out, back to the dark public pages. */
  useEffect(() => {
    const previous = document.body.style.backgroundColor
    document.body.style.backgroundColor = appearance === 'light' ? '#F7F8FA' : ''
    return () => {
      document.body.style.backgroundColor = previous
    }
  }, [appearance])

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
    <div className="fc-app min-h-screen relative" data-theme={appearance}>
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
          <Outlet />
        </main>
      </div>
    </div>
  )
}
