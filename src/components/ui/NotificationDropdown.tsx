import { useState, useEffect, useMemo, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, Check, X } from 'lucide-react'
import { formatDateTime } from '../../lib/utils'
import { mockActivity } from '../../data/mock'
import { announcePopoverOpen, onOtherPopoverOpen } from '../../lib/popover'
import { useReadNotifications } from '../../lib/notifications'
import { getSession } from '../../lib/session'

interface NotificationDropdownProps {
  onOpen?: () => void
  sidebarOpen?: boolean
}

export function NotificationDropdown({ onOpen, sidebarOpen }: NotificationDropdownProps) {
  const [open, setOpen] = useState(false)
  const [notifications] = useState(mockActivity.slice(0, 5))
  const location = useLocation()
  const email = getSession()?.email ?? ''
  const ids = useMemo(() => notifications.map(n => String(n.id)), [notifications])
  const { isRead, unreadCount, markAllRead } = useReadNotifications(email, ids)

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

  // Opening the user menu closes this panel.
  useEffect(() => onOtherPopoverOpen('notifications', () => setOpen(false)), [])

  const handleToggle = () => {
    setOpen(prev => {
      const next = !prev
      if (next) {
        announcePopoverOpen('notifications')
        if (onOpen) onOpen()
      }
      return next
    })
  }

  const dotColor = (status: string) => {
    if (status === 'success') return '#10B981'
    if (status === 'error')   return '#EF4444'
    if (status === 'warning') return '#F59E0B'
    return '#F97316'
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="fc-icon-btn relative"
        id="notification-btn"
        type="button"
        aria-expanded={open}
        aria-controls="dashboard-notification-panel"
        aria-haspopup="dialog"
        aria-label="Notifications"
      >
        <Bell className="w-[18px] h-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-surface" />
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          id="dashboard-notification-panel"
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-12 z-50 w-80 rounded-2xl overflow-hidden bg-surface border border-line shadow-soft-lg"
          style={{ animation: 'dropdownFadeIn 0.18s ease-out both' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-line-soft">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-accent" />
              <span className="text-[13px] font-semibold text-ink">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-accent-tint text-accent-soft">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={() => setOpen(false)}
              type="button"
              className="p-1 rounded-lg text-ink-faint hover:bg-surface-mute hover:text-ink transition-colors"
              aria-label="Close notifications"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Items */}
          <div className="max-h-80 overflow-y-auto p-2 space-y-1">
            {notifications.map(n => (
              <div
                key={n.id}
                className="flex gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors duration-150 hover:bg-surface-mute"
              >
                <div
                  className="w-2 h-2 mt-1.5 rounded-full flex-shrink-0"
                  style={{ background: isRead(String(n.id)) ? 'transparent' : dotColor(n.status) }}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-[12px] leading-snug ${isRead(String(n.id)) ? 'font-normal text-ink-mute' : 'font-medium text-ink-soft'}`}>{n.message}</p>
                  <p className="text-[10px] mt-1 font-mono text-ink-faint">
                    {formatDateTime(n.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-line-soft">
            <button
              type="button"
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-accent hover:text-accent-soft
                         transition-colors cursor-pointer disabled:text-ink-faint disabled:cursor-default"
            >
              <Check className="w-3.5 h-3.5" />
              {unreadCount === 0 ? 'All caught up' : 'Mark all as read'}
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
