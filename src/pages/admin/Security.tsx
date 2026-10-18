import { useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { AsyncGate } from '../../components/admin/AsyncGate'
import { mockSecurityAlerts } from '../../data/mock'
import { USE_API } from '../../lib/api/config'
import { acknowledgeAlert, getSecurityRules, listAlerts, type SecurityAlertRow, type SecurityRules } from '../../lib/api/adminSystem'
import { messageFor, useApiResource } from '../../lib/useApiResource'
import { formatDateTime } from '../../lib/utils'
import { ShieldAlert, Lock, CheckCircle, Gauge, Clock } from 'lucide-react'

interface SecurityData { alerts: SecurityAlertRow[]; rules: SecurityRules | null }

const TYPE_LABEL: Record<string, string> = {
  failed_login: 'Failed sign-ins',
  authorization_failure: 'Access refused',
  rate_limit: 'Rate limit hit',
}

function demoData(): SecurityData {
  return {
    rules: { window_minutes: 15, failed_login_threshold: 10, authorization_failure_threshold: 20, rate_limit_threshold: 10, event_retention_days: 90 },
    alerts: mockSecurityAlerts.filter(a => a.type !== 'suspicious').map((a, i) => ({
      id: i + 1, rule: a.type, type: a.type, risk: a.risk === 'high' ? 'high' : 'medium', status: 'open', message: a.message,
      ip_address: a.ip, event_count: 0, threshold: 0, window_minutes: 15, first_seen_at: a.timestamp, last_seen_at: a.timestamp,
      acknowledged_at: null, acknowledgement_note: '',
    })),
  }
}

async function load(signal: AbortSignal): Promise<SecurityData> {
  const [alerts, rules] = await Promise.all([listAlerts(signal), getSecurityRules(signal).catch(() => null)])
  return { alerts, rules }
}

export default function Security() {
  const state = useApiResource(load, demoData, [])
  const [target, setTarget] = useState<SecurityAlertRow | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // The demo build has no server to record an acknowledgement, so it is remembered here.
  const [demoAcked, setDemoAcked] = useState<Record<number, string>>({})

  const close = () => { setTarget(null); setNote(''); setError(null) }

  const submit = async () => {
    if (!target) return
    setBusy(true)
    setError(null)
    try {
      if (USE_API) {
        await acknowledgeAlert(target.id, note.trim())
        state.reload()
      } else {
        setDemoAcked(prev => ({ ...prev, [target.id]: note.trim() }))
      }
      close()
    } catch (caught) {
      setError(messageFor(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="Security & Suspicious Activity"
        subtitle="Alerts raised when failed sign-ins, refused requests or rate limits pile up from one address."
      />

      <AsyncGate state={state} what="the security alerts">
        {({ alerts: raw, rules }) => {
          const alerts = raw.map(a => (demoAcked[a.id] !== undefined
            ? { ...a, status: 'acknowledged', acknowledgement_note: demoAcked[a.id] }
            : a))
          const open = alerts.filter(a => a.status === 'open')
          const count = (type: string) => open.filter(a => a.type === type).length
          return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-6">
                <ChartCard title="Security Alerts" subtitle={`${open.length} open, ${alerts.length - open.length} acknowledged`}>
                  {alerts.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-center text-ink-mute gap-2">
                      <CheckCircle className="w-8 h-8 text-[#10B981]" />
                      <p className="text-xs font-semibold">No security alerts have been raised.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {alerts.map(a => {
                        const high = a.risk === 'high'
                        const acked = a.status === 'acknowledged'
                        return (
                          <div key={a.id} className="p-4 rounded-3xl border flex items-start justify-between gap-4"
                            style={{
                              background: acked ? 'rgb(var(--a-surface-mute))' : high ? 'rgba(239,68,68,0.06)' : 'rgba(245,158,11,0.06)',
                              borderColor: acked ? 'rgb(var(--a-line))' : high ? 'rgba(239,68,68,0.20)' : 'rgba(245,158,11,0.20)',
                              opacity: acked ? 0.8 : 1,
                            }}>
                            <div className="flex gap-3 text-xs min-w-0">
                              <div className="p-2.5 rounded-2xl flex items-center justify-center flex-shrink-0 h-fit"
                                style={{ background: 'rgb(var(--a-surface-mute))', border: '1px solid rgb(var(--a-line))', color: high && !acked ? '#EF4444' : 'rgb(var(--a-ink-mute))' }}>
                                {a.type === 'failed_login' ? <Lock className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                              </div>
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-bold text-ink">{a.message}</h4>
                                  <StatusBadge status={high ? 'error' : 'warning'} label={`${a.risk} risk`} dot={false} />
                                  <StatusBadge status={acked ? 'muted' : 'info'} label={acked ? 'Acknowledged' : 'Open'} dot={false} />
                                </div>
                                <p className="text-[10px] text-ink-faint">
                                  {TYPE_LABEL[a.type] ?? a.type}
                                  {a.ip_address && <> &bull; Address {a.ip_address}</>}
                                  {a.event_count > 0 && <> &bull; {a.event_count} events (limit {a.threshold} in {a.window_minutes} min)</>}
                                  {' '}&bull; Last seen {formatDateTime(a.last_seen_at)}
                                </p>
                                {acked && (
                                  <p className="text-[10px] text-ink-faint">
                                    {a.acknowledged_at && <>Acknowledged {formatDateTime(a.acknowledged_at)}. </>}
                                    {a.acknowledgement_note && <>Note: {a.acknowledgement_note}</>}
                                  </p>
                                )}
                              </div>
                            </div>
                            {!acked && (
                              <button type="button" onClick={() => setTarget(a)} className="fc-btn-secondary !py-1.5 !px-3 !text-[10px] font-bold flex-shrink-0">
                                Acknowledge
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </ChartCard>
              </div>

              <div className="lg:col-span-4 space-y-6">
                <ChartCard title="Open alerts" subtitle="By kind">
                  <div className="p-4 rounded-3xl bg-surface-mute border border-line text-xs text-ink-mute space-y-3.5">
                    {Object.entries(TYPE_LABEL).map(([type, label]) => (
                      <div key={type} className="flex justify-between">
                        <span>{label}:</span>
                        <span className="font-bold text-ink">{count(type)}</span>
                      </div>
                    ))}
                  </div>
                </ChartCard>

                {rules && (
                  <ChartCard title="When an alert is raised" subtitle="The rules the backend applies">
                    <div className="space-y-3 text-xs text-ink-mute">
                      <div className="flex gap-3"><Gauge className="w-4 h-4 text-[#FB923C] flex-shrink-0 mt-0.5" />
                        <p className="leading-relaxed">
                          One address makes {rules.failed_login_threshold} failed sign-ins, {rules.rate_limit_threshold} rate-limited requests or {rules.authorization_failure_threshold} refused requests within {rules.window_minutes} minutes.
                        </p></div>
                      <div className="flex gap-3"><Clock className="w-4 h-4 text-[#FB923C] flex-shrink-0 mt-0.5" />
                        <p className="leading-relaxed">Events are kept for {rules.event_retention_days} days. Alerts only inform; they do not block anyone.</p></div>
                    </div>
                  </ChartCard>
                )}
              </div>

              {target && (
                <ConfirmDialog title="Acknowledge this alert" confirmLabel="Acknowledge" busyLabel="Saving…" busy={busy} error={error}
                  confirmDisabled={note.trim().length === 0} onConfirm={submit} onCancel={close}>
                  <p>{target.message}</p>
                  <label className="block text-xs font-semibold text-ink pt-1" htmlFor="ack-note">What did you check? (required)</label>
                  <textarea id="ack-note" value={note} onChange={e => setNote(e.target.value)} rows={3} maxLength={500}
                    className="w-full rounded-xl border border-line bg-surface-mute p-2 text-sm text-ink" />
                </ConfirmDialog>
              )}
            </div>
          )
        }}
      </AsyncGate>
    </div>
  )
}
