import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import type { Role } from '../../data/mock'

interface AppShellProps {
  role: Role
}

export function AppShell({ role }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

  /* The document body is painted black for the marketing site. The shell is
     light, so repaint the body while it is mounted — otherwise overscroll and
     the area beneath short pages flash black. Restored on unmount so logging
     out returns to the dark public pages cleanly. */
  useEffect(() => {
    const previousBg = document.body.style.backgroundColor
    document.body.style.backgroundColor = '#F7F8FA'
    return () => {
      document.body.style.backgroundColor = previousBg
    }
  }, [])

  return (
    <div className="fc-light min-h-screen relative">
      {/* Sidebar */}
      <Sidebar role={role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-ink/25 backdrop-blur-[2px] lg:hidden cursor-default w-full h-full text-left"
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
        />
        <main className="flex-1 px-4 sm:px-6 lg:px-7 py-6 page-enter">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
