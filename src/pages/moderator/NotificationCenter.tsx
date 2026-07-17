import { useState, useMemo } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { mockModNotifications } from '../../data/mock'
import type { ModNotification } from '../../data/mock'
import { ClipboardList, Clock, AlertTriangle, ArrowUpRight, Check, CheckCircle2, Inbox } from 'lucide-react'

// Relative time helper
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return mins <= 1 ? 'Just now' : `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return hrs === 1 ? '1 hr ago' : `${hrs} hrs ago`
  const days = Math.floor(hrs / 24)
  return days === 1 ? 'Yesterday' : `${days} days ago`
}

const TYPE_ICONS: Record<ModNotification['type'], React.ElementType> = {
  Assignment: ClipboardList,
  Deadline: Clock,
  Failure: AlertTriangle,
  Escalation: ArrowUpRight
}

const TYPE_COLORS: Record<ModNotification['type'], string> = {
  Assignment: 'text-[#60B1FF] bg-[#60B1FF]/10 border-[#60B1FF]/20',
  Deadline: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20',
  Failure: 'text-red-400 bg-red-500/10 border-red-500/20',
  Escalation: 'text-purple-300 bg-purple-500/10 border-purple-500/20'
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<ModNotification[]>(mockModNotifications)

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
  }

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  // Group notifications by type
  const grouped = useMemo(() => {
    const groups: Record<ModNotification['type'], ModNotification[]> = {
      Assignment: [],
      Deadline: [],
      Failure: [],
      Escalation: []
    }
    notifications.forEach(n => {
      groups[n.type].push(n)
    })
    return groups
  }, [notifications])

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length
  }, [notifications])

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="Notification Center"
        subtitle="Manage queue assignments, deadlines alerts, and escalations"
        action={
          unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="fc-btn-secondary !py-2.5 !px-5 text-xs font-bold flex items-center gap-2 border-white/10 hover:border-white/20"
            >
              <CheckCircle2 className="w-4 h-4" /> Mark all as read
            </button>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Grouped Sections */}
        <div className="lg:col-span-8 space-y-6">
          {(Object.keys(grouped) as ModNotification['type'][]).map(type => {
            const list = grouped[type]
            if (list.length === 0) return null

            return (
              <ChartCard 
                key={type} 
                title={`${type} Alerts`} 
                subtitle={`Manual intervention and backlog ${type.toLowerCase()} logs`}
              >
                <div className="divide-y divide-white/[0.04]">
                  {list.map(notif => {
                    const Icon = TYPE_ICONS[notif.type]
                    const colorClass = TYPE_COLORS[notif.type]

                    return (
                      <div 
                        key={notif.id} 
                        className={`flex items-center gap-4 py-4 hover:bg-white/[0.01] transition-colors ${
                          !notif.isRead ? 'bg-white/[0.015]' : ''
                        }`}
                      >
                        {/* Unread indicator dot */}
                        <div className="w-1.5 h-1.5 shrink-0 flex items-center justify-center">
                          {!notif.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0084FF] animate-pulse" />
                          )}
                        </div>

                        {/* Icon Badge */}
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${colorClass}`}>
                          <Icon className="w-4 h-4" />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs leading-relaxed text-white/80 ${!notif.isRead ? 'font-bold text-white' : 'font-medium'}`}>
                            {notif.description}
                          </p>
                          <p className="text-[10px] text-white/30 font-mono mt-1">
                            {relativeTime(notif.timestamp)}
                          </p>
                        </div>

                        {/* Actions */}
                        {!notif.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="p-1.5 rounded-lg border border-white/10 hover:border-white/20 bg-white/5 text-white/50 hover:text-white transition-all shrink-0"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </ChartCard>
            )
          })}

          {notifications.length === 0 && (
            <ChartCard title="Notifications backlog" subtitle="Queue messages">
              <div className="text-center py-16 text-white/40">
                <Inbox className="w-8 h-8 mx-auto mb-3 opacity-30 animate-pulse" />
                <p className="text-xs font-semibold">Inbox is empty.</p>
                <p className="text-[10px] text-white/20 mt-1">You have no active assignments or notifications.</p>
              </div>
            </ChartCard>
          )}
        </div>

        {/* Right Column: Statistics */}
        <div className="lg:col-span-4">
          <ChartCard title="Notifications Overview" subtitle="System alerts stats breakdown">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <span className="block text-[8px] text-muted font-bold uppercase tracking-wider">Unread</span>
                  <span className="block text-xl font-bold text-[#0084FF] mt-1">{unreadCount}</span>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <span className="block text-[8px] text-muted font-bold uppercase tracking-wider">Total</span>
                  <span className="block text-xl font-bold text-dark mt-1">{notifications.length}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3.5 text-xs text-muted">
                {(Object.keys(grouped) as ModNotification['type'][]).map(type => (
                  <div key={type} className="flex justify-between">
                    <span>{type} alerts:</span>
                    <span className="font-bold text-white">{grouped[type].length} items</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        </div>

      </div>
    </div>
  )
}
