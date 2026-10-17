import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle, AlertTriangle, Bell, CheckCheck, CheckCircle2, Info, Loader2, RefreshCw, Trash2,
} from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import {
  announceNotificationsChanged, deleteNotification, listNotifications, markAllNotificationsRead,
  markNotificationRead, resolveNotificationPath, type NotificationSeverity, type UserNotification,
} from '../../lib/api/notifications'
import { useApiResource } from '../../lib/useApiResource'
import { formatDateTime } from '../../lib/utils'

const TONE: Record<NotificationSeverity, { icon: typeof Info; cls: string }> = {
  success: { icon: CheckCircle2, cls: 'text-emerald-400' },
  warning: { icon: AlertTriangle, cls: 'text-[#FCD34D]' },
  error:   { icon: AlertCircle, cls: 'text-accent-soft' },
  info:    { icon: Info, cls: 'text-accent' },
}

export default function NotificationsLive() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [actionError, setActionError] = useState<string | null>(null)
  const { data, loading, error, reload } = useApiResource(
    signal => listNotifications(page, signal),
    () => ({ count: 0, next: null, previous: null, results: [] as UserNotification[] }),
    [page],
  )
  const items = data?.results ?? []
  const unreadHere = items.filter(item => !item.is_read).length

  const run = async (work: () => Promise<unknown>) => {
    setActionError(null)
    try {
      await work()
      announceNotificationsChanged()
      reload()
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'That did not work. Please try again.')
    }
  }

  const open = async (item: UserNotification) => {
    const to = resolveNotificationPath(item.action_path)
    if (!item.is_read) { try { await markNotificationRead(item.id); announceNotificationsChanged() } catch { /* opening still works */ } }
    if (to) navigate(to)
    else reload()
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" subtitle="What has happened to your uploads, downloads and Person Folders." />

      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex justify-between items-center text-xs font-bold text-ink-mute">
          <span>{loading ? '…' : `${data?.count ?? 0} notification${(data?.count ?? 0) === 1 ? '' : 's'} · ${unreadHere} unread on this page`}</span>
          <button onClick={() => void run(markAllNotificationsRead)} disabled={loading || unreadHere === 0}
            className="hover:text-accent flex items-center gap-1 disabled:opacity-50 cursor-pointer disabled:cursor-default">
            <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> Mark all read
          </button>
        </div>

        {actionError && <p role="alert" className="text-xs text-[#F87171]">{actionError}</p>}

        <ChartCard title="Your notifications" subtitle="Newest first">
          {loading && (
            <div className="h-48 flex flex-col items-center justify-center text-ink-faint">
              <Loader2 className="w-6 h-6 mb-3 animate-spin" />
              <p className="text-xs font-semibold">Loading…</p>
            </div>
          )}

          {!loading && error && (
            <div className="h-48 flex flex-col items-center justify-center text-center">
              <AlertTriangle className="w-7 h-7 mb-3 text-[#EF4444]" />
              <p className="text-xs font-semibold text-ink">{error}</p>
              <button type="button" onClick={reload}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#FB923C] hover:underline cursor-pointer">
                <RefreshCw className="w-3.5 h-3.5" />Try again
              </button>
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="h-64 flex flex-col items-center justify-center text-center text-ink-mute gap-2">
              <Bell className="w-8 h-8 text-ink-mute opacity-40" />
              <p className="text-xs font-semibold">You have no notifications yet.</p>
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="space-y-3">
              {items.map(item => {
                const tone = TONE[item.severity] ?? TONE.info
                const Icon = tone.icon
                const to = resolveNotificationPath(item.action_path)
                return (
                  <div key={item.id}
                    className={`p-4 rounded-3xl border transition-all flex items-start gap-4 ${
                      !item.is_read ? 'bg-accent/5 border-accent/20 ring-1 ring-accent/10' : 'bg-surface-mute border-line opacity-80'
                    }`}>
                    <div className={`p-2.5 rounded-2xl bg-surface-mute border border-line ${tone.cls}`}><Icon className="w-4 h-4" /></div>
                    <div className="flex-1 text-xs min-w-0">
                      <div className="flex justify-between items-center gap-3">
                        <h4 className="font-bold text-ink">{item.title}</h4>
                        <span className="text-[10px] text-ink-mute shrink-0">{formatDateTime(item.created_at)}</span>
                      </div>
                      <p className="text-ink-mute mt-1 leading-relaxed">{item.message}</p>
                      <div className="flex items-center gap-4 mt-2">
                        {to && (
                          <button onClick={() => void open(item)} className="font-semibold text-[#FB923C] hover:underline cursor-pointer">Open</button>
                        )}
                        {!item.is_read && !to && (
                          <button onClick={() => void run(() => markNotificationRead(item.id))} className="font-semibold text-ink-mute hover:text-ink cursor-pointer">Mark read</button>
                        )}
                      </div>
                    </div>
                    <button onClick={() => void run(() => deleteNotification(item.id))} aria-label={`Dismiss "${item.title}"`} title="Dismiss"
                      className="p-1.5 rounded-lg text-ink-faint hover:text-accent-soft hover:bg-surface-mute transition-colors cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {!loading && !error && (data?.next || data?.previous) && (
            <div className="flex items-center justify-center gap-3 pt-5 text-xs">
              <button disabled={!data?.previous} onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-4 py-2 rounded-xl font-semibold border border-line text-ink-soft hover:text-ink transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default">Previous</button>
              <span className="text-ink-mute">Page {page}</span>
              <button disabled={!data?.next} onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 rounded-xl font-semibold border border-line text-ink-soft hover:text-ink transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default">Next</button>
            </div>
          )}
        </ChartCard>

        <p className="text-[11px] text-ink-mute text-center">
          Choose which events notify you in <Link to="/dashboard/settings" className="font-semibold text-[#FB923C] hover:underline">Settings → Notifications</Link>.
        </p>
      </div>
    </div>
  )
}
