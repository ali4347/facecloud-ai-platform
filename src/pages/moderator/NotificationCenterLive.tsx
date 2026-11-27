import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowUpRight, Check, CheckCircle2, ClipboardList, Clock, FileDown, Inbox, Loader2 } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import {
  announceNotificationsChanged, listNotifications, markAllNotificationsRead, markNotificationRead, resolveNotificationPath, type UserNotification,
} from '../../lib/api/notifications'
import { messageFor } from '../../lib/useApiResource'

type Kind = 'Assignment' | 'Download' | 'Deadline' | 'Failure' | 'Escalation' | 'Other'

/** The moderator events the backend sends, in the screen's own words. */
const KIND: Record<string, Kind> = {
  moderator_review_assigned: 'Assignment', moderator_review_overdue: 'Deadline',
  moderator_review_escalated: 'Escalation', moderator_batch_failed: 'Failure',
  download_request_received: 'Download',
}
/** Where a kind leads when the notification's own link is not one of this app's pages. A download request links to itself (action_path). */
const LEADS_TO: Record<Kind, string | null> = { Assignment: '/moderator/queue', Download: '/moderator/download-requests', Deadline: '/moderator/queue', Escalation: '/moderator/queue', Failure: '/moderator/batches', Other: null }
const ICON: Record<Kind, React.ElementType> = { Assignment: ClipboardList, Download: FileDown, Deadline: Clock, Failure: AlertTriangle, Escalation: ArrowUpRight, Other: Inbox }
const COLOR: Record<Kind, string> = {
  Assignment: 'text-[#FB923C] bg-[#FB923C]/10 border-[#FB923C]/20', Download: 'text-sky-400 bg-sky-500/10 border-sky-500/20', Deadline: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20',
  Failure: 'text-red-400 bg-red-500/10 border-red-500/20', Escalation: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  Other: 'text-ink-mute bg-surface-mute border-line',
}
const ORDER: Kind[] = ['Assignment', 'Download', 'Deadline', 'Failure', 'Escalation', 'Other']

function relativeTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 60) return mins <= 1 ? 'Just now' : `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return hrs === 1 ? '1 hr ago' : `${hrs} hrs ago`
  const days = Math.floor(hrs / 24)
  return days === 1 ? 'Yesterday' : `${days} days ago`
}

export function LiveNotificationCenter() {
  const navigate = useNavigate()
  const [items, setItems] = useState<UserNotification[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (pageNumber: number, replace: boolean) => {
    setLoading(true); setError(null)
    try {
      const result = await listNotifications(pageNumber)
      setItems(current => (replace ? result.results : [...current, ...result.results]))
      setTotal(result.count); setHasMore(Boolean(result.next)); setPage(pageNumber)
    } catch (caught) { setError(messageFor(caught)) } finally { setLoading(false) }
  }, [])
  useEffect(() => { void load(1, true) }, [load])

  const grouped = useMemo(() => {
    const groups: Record<Kind, UserNotification[]> = { Assignment: [], Download: [], Deadline: [], Failure: [], Escalation: [], Other: [] }
    for (const n of items) groups[KIND[n.event_type] ?? 'Other'].push(n)
    return groups
  }, [items])
  const unread = items.filter(n => !n.is_read).length

  const read = async (n: UserNotification) => {
    if (n.is_read) return
    try { await markNotificationRead(n.id) } catch { /* opening it still works */ }
    setItems(current => current.map(x => (x.id === n.id ? { ...x, is_read: true } : x)))
    announceNotificationsChanged()
  }
  const readAll = async () => {
    try { await markAllNotificationsRead(); setItems(current => current.map(x => ({ ...x, is_read: true }))); announceNotificationsChanged() }
    catch (caught) { setError(messageFor(caught)) }
  }
  const open = async (n: UserNotification) => { await read(n); const to = resolveNotificationPath(n.action_path) ?? LEADS_TO[KIND[n.event_type] ?? 'Other']; if (to) navigate(to) }

  return (
    <div className="space-y-6 page-enter">
      <PageHeader title="Notification Center" subtitle="Queue assignments, deadline alerts, escalations and failed batches"
        action={unread > 0 ? (
          <button type="button" onClick={readAll} className="fc-btn-secondary !py-2.5 !px-5 text-xs font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Mark all as read</button>
        ) : undefined} />

      {error && <p role="alert" className="p-3 rounded-2xl text-xs bg-[#EF4444]/10 border border-[#EF4444]/25 text-[#F87171]">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {ORDER.filter(kind => grouped[kind].length > 0).map(kind => {
            const Icon = ICON[kind]
            return (
              <ChartCard key={kind} title={kind === 'Other' ? 'Other notifications' : `${kind} alerts`} subtitle={kind === 'Failure' ? 'Batches that failed to process' : 'Newest first'}>
                <div className="divide-y divide-line">
                  {grouped[kind].map(n => (
                    <div key={n.id} className={`flex items-center gap-4 py-4 hover:bg-surface-mute transition-colors ${!n.is_read ? 'bg-surface-mute' : ''}`}>
                      <div className="w-1.5 h-1.5 shrink-0">{!n.is_read && <span className="block w-1.5 h-1.5 rounded-full bg-[#F97316]" />}</div>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${COLOR[kind]}`}><Icon className="w-4 h-4" /></div>
                      <button type="button" onClick={() => open(n)} className="flex-1 min-w-0 text-left cursor-pointer">
                        <p className={`text-xs leading-relaxed ${!n.is_read ? 'font-bold text-ink' : 'font-medium text-ink-soft'}`}>{n.title}</p>
                        {n.message && <p className="text-[11px] text-ink-mute mt-0.5">{n.message}</p>}
                        <p className="text-[10px] text-ink-faint font-mono mt-1">{relativeTime(n.created_at)}</p>
                      </button>
                      {!n.is_read && (
                        <button type="button" onClick={() => read(n)} title="Mark as read" className="p-1.5 rounded-lg border border-line bg-surface-mute text-ink-mute hover:text-ink shrink-0 cursor-pointer"><Check className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  ))}
                </div>
              </ChartCard>
            )
          })}

          {loading && items.length === 0 && <div className="text-center py-16 text-ink-faint"><Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin" /><p className="text-xs font-semibold">Loading notifications…</p></div>}
          {!loading && !error && items.length === 0 && (
            <ChartCard title="Notifications" subtitle="Queue messages">
              <div className="text-center py-16 text-ink-faint"><Inbox className="w-8 h-8 mx-auto mb-3 opacity-30" /><p className="text-xs font-semibold">Inbox is empty.</p>
                <p className="text-[10px] mt-1">You have no assignments or alerts.</p></div>
            </ChartCard>
          )}
          {hasMore && (
            <button type="button" disabled={loading} onClick={() => load(page + 1, false)} className="fc-btn-secondary !py-2 !px-4 text-xs font-bold disabled:opacity-50">{loading ? 'Loading…' : 'Load older'}</button>
          )}
        </div>

        <div className="lg:col-span-4">
          <ChartCard title="Overview" subtitle="What is loaded">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-4 rounded-2xl bg-surface-mute border border-line"><span className="block text-[8px] text-ink-mute font-bold uppercase tracking-wider">Unread</span><span className="block text-xl font-bold text-[#F97316] mt-1">{unread}</span></div>
                <div className="p-4 rounded-2xl bg-surface-mute border border-line"><span className="block text-[8px] text-ink-mute font-bold uppercase tracking-wider">Total</span><span className="block text-xl font-bold text-ink mt-1">{total}</span></div>
              </div>
              <div className="p-4 rounded-2xl bg-surface-mute border border-line space-y-3.5 text-xs text-ink-mute">
                {ORDER.filter(kind => kind !== 'Other' || grouped.Other.length > 0).map(kind => (
                  <div key={kind} className="flex justify-between"><span>{kind} alerts:</span><span className="font-bold text-ink">{grouped[kind].length}</span></div>
                ))}
              </div>
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  )
}
