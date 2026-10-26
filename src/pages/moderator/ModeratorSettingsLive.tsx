import { useEffect, useState } from 'react'
import { AlertTriangle, Loader2, Mail, RefreshCw, ShieldCheck, Monitor } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { AccountSettings } from '../../components/auth/AccountSettings'
import { listSessions, revokeSession, type UserSession } from '../../lib/api/account'
import { getNotificationPreferences, updateNotificationPreferences, type NotificationPreferences } from '../../lib/api/notifications'
import { getQueueAutoRefresh, setQueueAutoRefresh } from '../../lib/moderatorPrefs'
import { getSession } from '../../lib/session'
import { messageFor, useApiResource } from '../../lib/useApiResource'
import { formatDateTime } from '../../lib/utils'

export function LiveModeratorSettings() {
  const session = getSession()
  const [autoRefresh, setAutoRefresh] = useState(getQueueAutoRefresh())
  const prefs = useApiResource<NotificationPreferences | null>(signal => getNotificationPreferences(signal), () => null, [])
  const sessions = useApiResource<UserSession[]>(signal => listSessions(signal), () => [], [])
  const [values, setValues] = useState<NotificationPreferences | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { if (prefs.data) setValues(prefs.data) }, [prefs.data])

  const toggle = async (key: 'moderator_review_updates' | 'email_notifications') => {
    if (!values) return
    const next = !values[key]
    setValues({ ...values, [key]: next }); setSaving(key); setError(null)
    try { setValues(await updateNotificationPreferences({ [key]: next })) }
    catch (caught) { setValues({ ...values, [key]: !next }); setError(messageFor(caught)) } finally { setSaving(null) }
  }

  const signOutDevice = async (id: string) => {
    setError(null)
    try { await revokeSession(id); sessions.reload() } catch (caught) { setError(messageFor(caught)) }
  }

  const switchClass = 'flex items-start gap-3 p-4 rounded-3xl bg-surface-mute border border-line cursor-pointer'
  return (
    <div className="space-y-6">
      <PageHeader title="Moderator Settings" subtitle="Your account, how the queue and your notifications behave, and where you are signed in." />
      {error && <p role="alert" className="p-3 rounded-2xl text-xs bg-[#EF4444]/10 border border-[#EF4444]/25 text-[#F87171]">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <ChartCard title="Review preferences" subtitle="Saved as soon as you change them">
            <div className="space-y-4">
              <label className={switchClass}>
                <input type="checkbox" checked={autoRefresh} onChange={e => { setAutoRefresh(e.target.checked); setQueueAutoRefresh(e.target.checked) }} className="rounded mt-1 cursor-pointer" />
                <div className="text-xs">
                  <h4 className="font-bold text-ink flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> Refresh the review queue by itself</h4>
                  <p className="text-ink-mute mt-0.5 leading-relaxed">The queue asks for new reviews every 30 seconds while it is open. This is kept in this browser only.</p>
                </div>
              </label>

              {prefs.loading && !values && <div className="py-4 text-center"><Loader2 className="w-5 h-5 mx-auto animate-spin text-ink-faint" /></div>}
              {prefs.error && <p role="alert" className="text-xs text-[#F87171]">{prefs.error}</p>}
              {values && (
                <>
                  <label className={switchClass}>
                    <input type="checkbox" checked={values.moderator_review_updates ?? true} disabled={saving === 'moderator_review_updates' || values.moderator_review_updates === undefined}
                      onChange={() => toggle('moderator_review_updates')} className="rounded mt-1 cursor-pointer" />
                    <div className="text-xs">
                      <h4 className="font-bold text-ink flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Tell me about reviews</h4>
                      <p className="text-ink-mute mt-0.5 leading-relaxed">Notifications when a review is assigned to you, becomes overdue or is escalated.{values.moderator_review_updates === undefined && ' (This backend does not have this switch yet.)'}</p>
                    </div>
                  </label>
                  <label className={switchClass}>
                    <input type="checkbox" checked={values.email_notifications} disabled={saving === 'email_notifications'} onChange={() => toggle('email_notifications')} className="rounded mt-1 cursor-pointer" />
                    <div className="text-xs">
                      <h4 className="font-bold text-ink flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Also email me</h4>
                      <p className="text-ink-mute mt-0.5 leading-relaxed">Send a copy of your notifications to {session?.email ?? 'your email address'}.</p>
                    </div>
                  </label>
                </>
              )}
            </div>
          </ChartCard>
        </div>

        <div className="lg:col-span-5">
          <ChartCard title="Where you are signed in" subtitle={session ? `${session.name} · ${session.email}` : 'Your devices'}>
            {sessions.loading && sessions.data === null && <div className="py-4 text-center"><Loader2 className="w-5 h-5 mx-auto animate-spin text-ink-faint" /></div>}
            {sessions.error && <p role="alert" className="text-xs text-[#F87171] flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" />{sessions.error}</p>}
            <ul className="space-y-3">
              {(sessions.data ?? []).map(s => (
                <li key={s.id} className="p-3 rounded-2xl bg-surface-mute border border-line text-xs flex items-start gap-3">
                  <Monitor className="w-4 h-4 text-ink-faint mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink truncate">{s.device || 'Unknown device'}{s.is_current && <span className="ml-2 text-[10px] text-[#10B981]">this device</span>}</p>
                    <p className="text-[10px] text-ink-faint">{s.ip_address ?? 'Address unknown'} · last active {formatDateTime(s.last_seen_at)}</p>
                  </div>
                  {!s.is_current && <button type="button" onClick={() => signOutDevice(s.id)} className="text-[10px] font-bold text-[#F87171] hover:underline cursor-pointer">Sign out</button>}
                </li>
              ))}
            </ul>
            {sessions.data && sessions.data.length === 0 && <p className="text-xs text-ink-faint">No other sessions.</p>}
          </ChartCard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AccountSettings role="moderator" />
      </div>
    </div>
  )
}
