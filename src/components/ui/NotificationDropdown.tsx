import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, Check, X } from 'lucide-react'
import { formatDateTime } from '../../lib/utils'
import { mockActivity } from '../../data/mock'

interface NotificationDropdownProps {
  onOpen?: () => void
  sidebarOpen?: boolean
}

export function NotificationDropdown({ onOpen, sidebarOpen }: NotificationDropdownProps) {
  const [open, setOpen] = useState(false)
  const [notifications] = useState(mockActivity.slice(0, 5))
  const location = useLocation()

  const btnRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // Auto-close panel on route change
  useEffect(() => {
    setOpen(false)
  }, [location.pathname, location.search, location.hash])

  // Auto-close panel if mobile sidebar opens
  useEffect(() => {
    if (sidebarOpen) {
      setOpen(false)
    }
  }, [sidebarOpen])

  // Close panel on outside pointer click
  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      const clickedButton = btnRef.current?.contains(target)
      const clickedPanel = panelRef.current?.contains(target)

      if (!clickedButton && !clickedPanel) {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [open])

  // Close panel on Escape key press and return focus to bell button
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        btnRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const handleToggle = () => {
    setOpen(prev => {
      const next = !prev
      if (next && onOpen) {
        onOpen()
      }
      return next
    })
  }

  const dotColor = (status: string) => {
    if (status === 'success') return '#4FFFB0'
    if (status === 'error')   return '#F87171'
    if (status === 'warning') return '#FCD34D'
    return '#FB923C'
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="relative p-2.5 rounded-xl hover:bg-white/[0.06] transition-colors"
        id="notification-btn"
        aria-expanded={open}
        aria-controls="dashboard-notification-panel"
        aria-haspopup="dialog"
        aria-label="Notifications"
      >
        <Bell className="w-4.5 h-4.5" style={{ color: 'rgba(255,255,255,0.55)', width: 18, height: 18 }} />
        <span
          className="absolute top-2 right-2 w-2 h-2 rounded-full ring-2 ring-black"
          style={{ background: '#EF4444', boxShadow: '0 0 8px rgba(239,68,68,0.6)' }}
        />
      </button>

      {open && (
        <div
          ref={panelRef}
          id="dashboard-notification-panel"
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-12 z-50 w-80 rounded-3xl overflow-hidden"
          style={{
            background: 'rgba(5,7,10,0.96)',
            border: '1px solid rgba(249, 115, 22,0.28)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 24px 90px rgba(0,0,0,0.65), 0 0 50px rgba(249, 115, 22,0.16)',
            animation: 'dropdownFadeIn 0.18s ease-out both',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3.5"
            style={{ borderBottom: '1px solid rgba(249, 115, 22,0.16)' }}
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" style={{ color: '#FB923C' }} />
              <span className="text-sm font-bold text-white">Notifications</span>
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(249, 115, 22,0.18)', color: '#FB923C' }}
              >
                {notifications.length}
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 hover:bg-white/[0.06] rounded-lg transition-colors"
              aria-label="Close notifications"
            >
              <X className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.45)' }} />
            </button>
          </div>

          {/* Items */}
          <div className="max-h-80 overflow-y-auto p-2 space-y-1">
            {notifications.map(n => (
              <div
                key={n.id}
                className="flex gap-3 px-3 py-3 rounded-2xl cursor-pointer transition-all duration-150"
                style={{
                  background: 'rgba(255,255,255,0.045)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(249, 115, 22,0.10)'
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(249, 115, 22,0.20)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.045)'
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'
                }}
              >
                <div
                  className="w-2 h-2 mt-1.5 rounded-full flex-shrink-0"
                  style={{ background: dotColor(n.status) }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white leading-snug">{n.message}</p>
                  <p className="text-[10px] mt-0.5 font-mono" style={{ color: 'rgba(255,255,255,0.38)' }}>
                    {formatDateTime(n.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div
            className="px-4 py-3"
            style={{ borderTop: '1px solid rgba(249, 115, 22,0.16)' }}
          >
            <button
              className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
              style={{ color: '#FB923C' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#4FFFB0'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#FB923C'}
            >
              <Check className="w-3.5 h-3.5" />
              Mark all as read
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes dropdownFadeIn {
          0%   { opacity: 0; transform: translateY(-6px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
