import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle, AlertTriangle, Bell, CheckCheck, CheckCircle2, Info, Loader2, RefreshCw, Trash2,
} from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import {
  announceNotificationsChanged, deleteNotification, getUnreadCount, listNotifications, markAllNotificationsRead,
  markNotificationRead, resolveNotificationPath, type NotificationSeverity, type UserNotification,
} from '../../lib/api/notifications'
import { dayHeading, notificationKind } from '../../lib/notificationKinds'
import { useApiResource } from '../../lib/useApiResource'

const TONE: Record<NotificationSeverity, { icon: typeof Info; cls: string }> = {
  success: { icon: CheckCircle2, cls: 'text-emerald-400' },
  warning: { icon: AlertTriangle, cls: 'text-[#FCD34D]' },
  error:   { icon: AlertCircle, cls: 'text-accent-soft' },
  info:    { icon: Info, cls: 'text-accent' },
}

export default function NotificationsLive() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [actionError, setActionError] = useState<string | null>(null)
  const [unreadTotal, setUnreadTotal] = useState<number | null>(null)
  const { data, loading, error, reload } = useApiResource(
    signal => listNotifications(page, signal, { unreadOnly: filter === 'unread' }),
    () => ({ count: 0, next: null, previous: null, results: [] as UserNotification[] }),
    [page, filter],
  )
  const items = useMemo(() => data?.results ?? [], [data])

  // The unread total over every page (not just this one), refreshed whenever the list is.
  useEffect(() => {
    let alive = true
    getUnreadCount().then(n => { if (alive) setUnreadTotal(n) }).catch(() => { /* the list still works */ })
    return () => { alive = false }
  }, [data])

  // New notifications arrive while the page is open: look again every minute and when the tab is shown again.
  useEffect(() => {
    const again = () => { if (document.visibilityState === 'visible') reload() }
    const timer = setInterval(again, 60_000)
    document.addEventListener('visibilitychange', again)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', again) }
  }, [reload])

  const groups = useMemo(() => {
    const out: { heading: string; rows: UserNotification[] }[] = []
    for (const item of items) {
      const heading = dayHeading(item.created_at)
      const last = out[out.length - 1]
      if (last && last.heading === heading) last.rows.push(item)
      else out.push({ heading, rows: [item] })
    }
    return out
  }, [items])

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
          <span>{loading && !data ? '…' : `${data?.count ?? 0} ${filter === 'unread' ? 'unread' : 'notification' + ((data?.count ?? 0) === 1 ? '' : 's')}${filter === 'all' && unreadTotal !== null ? ` · ${unreadTotal} unread` : ''}`}</span>
          <button onClick={() => void run(markAllNotificationsRead)} disabled={loading || !unreadTotal}
            className="hover:text-accent flex items-center gap-1 disabled:opacity-50 cursor-pointer disabled:cursor-default">
            <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> Mark all read
          </button>
        </div>

        <div className="flex gap-2" role="group" aria-label="Show">
          {([['all', 'All'], ['unread', 'Unread only']] as const).map(([value, label]) => (
            <button key={value} type="button" aria-pressed={filter === value} onClick={() => { setFilter(value); setPage(1) }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border cursor-pointer ${filter === value ? 'bg-accent-tint text-accent border-accent/30' : 'bg-surface-mute text-ink-mute border-line'}`}>{label}</button>
          ))}
        </div>

        {actionError && <p role="alert" className="text-xs text-[#F87171]">{actionError}</p>}

        <ChartCard title="Your notifications" subtitle="Newest first">
          {loading && !data && (
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
              <p className="text-xs font-semibold">{filter === 'unread' ? 'You have read everything.' : 'You have no notifications yet.'}</p>
              {filter === 'all' && <p className="text-[11px] max-w-xs">They appear here when an upload finishes, a photo is accepted or rejected, a download or report is ready, or a Person Folder is created.</p>}
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="space-y-5">
              {groups.map(group => (
                <section key={group.heading} aria-label={group.heading} className="space-y-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-ink-faint">{group.heading}</h3>
                  {group.rows.map(item => {
                    const tone = TONE[item.severity] ?? TONE.info
                    const kind = notificationKind(item.event_type)
                    const Icon = kind.icon
                    const to = resolveNotificationPath(item.action_path)
                    return (
                      <div key={item.id}
                        className={`p-4 rounded-3xl border transition-all flex items-start gap-4 ${
                          !item.is_read ? 'bg-accent/5 border-accent/20 ring-1 ring-accent/10' : 'bg-surface-mute border-line opacity-80'
                        }`}>
                        <div className={`p-2.5 rounded-2xl bg-surface-mute border border-line ${tone.cls}`} title={kind.label}><Icon className="w-4 h-4" /></div>
                        <div className="flex-1 text-xs min-w-0">
                          <div className="flex justify-between items-center gap-3">
                            <h4 className="font-bold text-ink">{item.title}</h4>
                            <span className="text-[10px] text-ink-mute shrink-0">{new Date(item.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-ink-mute mt-1 leading-relaxed">{item.message}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">{kind.label}</span>
                            {to && (
                              <button onClick={() => void open(item)} className="font-semibold text-[#FB923C] hover:underline cursor-pointer">Open</button>
                            )}
                            {!item.is_read && (
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
                </section>
              ))}
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
