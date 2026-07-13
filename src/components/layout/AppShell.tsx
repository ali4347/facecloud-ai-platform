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

  return (
    <div className="dark-dashboard min-h-screen text-[#F0F4FF] fc-app-bg relative">
      {/* Sidebar */}
      <Sidebar role={role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden cursor-default w-full h-full text-left"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col min-h-screen relative z-10">
        <Topbar role={role} onMenuClick={() => setSidebarOpen(o => !o)} />
        <main className="flex-1 p-6 page-enter">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
