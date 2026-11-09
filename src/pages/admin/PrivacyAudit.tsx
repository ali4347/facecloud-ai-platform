import { AlertOctagon, AlertTriangle, CheckCircle2, Info, LockKeyhole, RefreshCw } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { NeedsApi } from '../../components/ui/NeedsApi'
import { AsyncGate } from '../../components/admin/AsyncGate'
import { getPrivacyAudit, type PrivacyAudit as Audit, type PrivacyFacts } from '../../lib/api/adminSystem'
import { useApiResource } from '../../lib/useApiResource'

/* The words. Numbers and sentences are the server's; what is added here is only what a yes or a no means, said plainly. */

const stamp = (iso: string) => new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'medium' })
const count = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`
const prettify = (key: string) => key.split('.').map(part => part.replace(/_/g, ' ')).join(' › ')

/** What the server's request kinds are called (its own labels); one this app does not know is shown as the server wrote it. */
const KIND_WORDS: Record<string, string> = {
  export: 'Data export', facial_erasure: 'Facial-data erasure', retention_purge: 'Retention purge',
  key_rotation: 'Embedding key rotation', temp_cleanup: 'Temporary file cleanup',
}

const RECORD_WORDS: Record<string, string> = {
  current_key: 'Under the current key', older_key: 'Under an older key', legacy_v1: 'In the legacy format (FCID1)',
  unrecognized: 'Not recognised', rotation_needed: 'Re-encryption needed',
}
const PURGE_WORDS: Record<string, string> = {
  created_at: 'Ran at', verified: 'Verified as complete', 'summary.enabled': 'Retention switched on', 'summary.retention_days': 'Retention (days)',
  'summary.cutoff': 'Data older than', 'summary.users_affected': 'People affected', 'summary.unverified_users': 'People not verified as erased',
}

/** A fact from the server shown as a person would say it: yes / no, a date, a number with separators. Anything else as it is. */
function show(value: unknown): string {
  if (value === null || value === undefined) return 'None'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') return value.toLocaleString('en-US')
  if (typeof value === 'string') return /^\d{4}-\d{2}-\d{2}T/.test(value) && !Number.isNaN(Date.parse(value)) ? stamp(value) : value
  if (Array.isArray(value)) return value.length === 0 ? 'None' : value.map(show).join(', ')
  if (typeof value === 'object') return Object.keys(value as object).length === 0 ? 'None' : JSON.stringify(value)
  return String(value)
}

/** Nested objects become one row each, named by their path ("summary.deleted.faces"), so a key the server adds later still has its row. */
function flatten(facts: PrivacyFacts, prefix = ''): [string, unknown][] {
  return Object.entries(facts).flatMap(([key, value]): [string, unknown][] =>
    value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0
      ? flatten(value as PrivacyFacts, `${prefix}${key}.`)
      : [[`${prefix}${key}`, value]])
}

type Tone = 'ok' | 'warn' | 'bad' | 'plain'
const TONES: Record<Tone, { color: string; icon: LucideIcon; panel: string }> = {
  ok: { color: 'var(--a-success)', icon: CheckCircle2, panel: '' },
  warn: { color: 'var(--a-warning)', icon: AlertTriangle, panel: 'rgba(245,158,11,0.10)' },
  bad: { color: 'var(--a-danger)', icon: AlertOctagon, panel: 'rgba(239,68,68,0.10)' },
  plain: { color: 'rgb(var(--a-ink-mute))', icon: Info, panel: '' },
}

/** One statement about the platform, with a mark for how it stands. A warning or a failure gets a tinted panel, so it cannot be skimmed past. */
function Finding({ tone, children }: { tone: Tone; children: ReactNode }) {
  const { color, icon: Icon, panel } = TONES[tone]
  return (
    <div className={`flex items-start gap-2.5 text-sm ${panel ? 'p-3 rounded-2xl border' : ''}`} style={panel ? { background: panel, borderColor: `color-mix(in srgb, ${color} 35%, transparent)` } : undefined}>
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color }} aria-hidden="true" />
      <p className={`min-w-0 break-words ${tone === 'bad' ? 'font-semibold' : 'text-ink'}`} style={tone === 'bad' ? { color } : undefined}>
        <span className="sr-only">{tone === 'bad' ? 'Problem: ' : tone === 'warn' ? 'Warning: ' : ''}</span>{children}
      </p>
    </div>
  )
}

function Row({ label, children, tone = 'plain' }: { label: string; children: ReactNode; tone?: Tone }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2 border-b border-line last:border-0">
      <dt className="text-xs text-ink-mute">{label}</dt>
      <dd className="text-sm font-semibold text-ink text-right break-words" style={tone === 'bad' || tone === 'warn' ? { color: TONES[tone].color } : undefined}>{children}</dd>
    </div>
  )
}

/** A small table of whatever the server sent: a plain-words name where this app knows the key, the key itself always, and the value. */
function FactsTable({ facts, words, flag }: { facts: PrivacyFacts; words: Record<string, string>; flag: (key: string, value: unknown) => boolean }) {
  const rows = flatten(facts)
  if (rows.length === 0) return <p className="text-xs text-ink-mute">Nothing recorded.</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <tbody className="divide-y divide-line">
          {rows.map(([key, value]) => {
            const flagged = flag(key, value)
            return (
              <tr key={key}>
                <th scope="row" className="py-2 pr-4 text-left font-normal align-top">
                  <span className="text-ink block">{words[key] ?? prettify(key)}</span>
                  <code className="text-[10px] text-ink-faint break-all">{key}</code>
                </th>
                <td className={`py-2 text-right align-top font-semibold break-words ${flagged ? '' : 'text-ink'}`} style={flagged ? { color: 'var(--a-warning)' } : undefined}>{show(value)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function RequestsTable({ requests }: { requests: Audit['requests_last_30_days'] }) {
  const kinds = Object.entries(requests)
  if (kinds.length === 0) return <p className="text-xs text-ink-mute">No privacy requests were made in the last 30 days.</p>
  const known = ['completed', 'failed']
  const outcomes = [...new Set(kinds.flatMap(([, byOutcome]) => Object.keys(byOutcome)))].sort((a, b) => {
    const rank = (outcome: string) => (known.includes(outcome) ? known.indexOf(outcome) : known.length)
    return rank(a) - rank(b) || a.localeCompare(b)
  })
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wider text-ink-faint border-b border-line">
            <th className="py-2 pr-4 font-bold">Kind</th>
            {outcomes.map(outcome => <th key={outcome} className="py-2 pr-3 font-bold text-right">{outcome.replace(/_/g, ' ')}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {kinds.map(([kind, byOutcome]) => (
            <tr key={kind}>
              <th scope="row" className="py-2 pr-4 text-left font-semibold text-ink">{KIND_WORDS[kind] ?? kind.replace(/_/g, ' ')}</th>
              {outcomes.map(outcome => {
                const n = byOutcome[outcome] ?? 0
                const bad = outcome === 'failed' && n > 0
                return <td key={outcome} className={`py-2 pr-3 text-right ${bad ? 'font-bold' : 'text-ink'}`} style={bad ? { color: 'var(--a-danger)' } : undefined}>{n.toLocaleString('en-US')}</td>
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** The privacy posture of the whole platform, for administrators: totals only, never a person. */
export default function PrivacyAudit() {
  const state = useApiResource<Audit | null>(signal => getPrivacyAudit(signal), () => null, [])

  return (
    <NeedsApi title="Privacy Audit" icon={LockKeyhole}>
      <div className="space-y-6 page-enter">
        <PageHeader title="Privacy Audit" subtitle="How the platform handles consent, retention and encryption. Totals only: no personal data is shown here." />

        <AsyncGate state={state} what="the privacy audit">
          {audit => {
            if (!audit) return null // only the demo build has no data, and it never gets this far (NeedsApi)
            const { consent, temporary_files: temp, retention, encryption } = audit
            const failed = Object.values(audit.requests_last_30_days).reduce((sum, byOutcome) => sum + (byOutcome.failed ?? 0), 0)
            const attention = [
              audit.unverified_erasures_total > 0 && `${count(audit.unverified_erasures_total, 'erasure or retention purge', 'erasures or retention purges')} could not be verified as complete`,
              !encryption.uploaded_images_encrypted_at_rest && 'Uploaded photos are not encrypted at rest',
              failed > 0 && `${count(failed, 'privacy request')} failed in the last 30 days`,
            ].filter((item): item is string => Boolean(item))

            return (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-ink-mute">Generated <time dateTime={audit.generated_at} className="font-semibold text-ink">{stamp(audit.generated_at)}</time></p>
                  <button type="button" onClick={state.reload} disabled={state.loading}
                    className="fc-btn-secondary !py-2 !px-4 text-xs font-bold inline-flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-default">
                    <RefreshCw className={`w-3.5 h-3.5 ${state.loading ? 'animate-spin' : ''}`} />{state.loading ? 'Refreshing…' : 'Refresh'}
                  </button>
                </div>

                {attention.length > 0 && (
                  <section aria-label="Needs attention" className="p-4 rounded-2xl border" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.30)' }}>
                    <h2 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--a-danger)' }}><AlertOctagon className="w-4 h-4" aria-hidden="true" />Needs attention</h2>
                    <ul className="space-y-1 text-sm text-ink list-disc pl-5">{attention.map(item => <li key={item}>{item}</li>)}</ul>
                  </section>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                  <ChartCard title="Consent" subtitle="Agreement to face processing, by policy version">
                    <div className="space-y-4">
                      {consent.required
                        ? <Finding tone="ok">Consent is required: face data is created only for people who have agreed.</Finding>
                        : <Finding tone="warn">Consent is not required: face data is created without recorded consent.</Finding>}
                      <dl>
                        <Row label="Current policy version">{consent.current_policy_version}</Row>
                        <Row label="People with active consent">{show(consent.users_with_active_consent)}</Row>
                        <Row label="People who withdrew consent">{show(consent.users_with_withdrawn_consent)}</Row>
                        <Row label="People who agreed to an older policy version">{show(consent.users_needing_reconsent)}</Row>
                      </dl>
                    </div>
                  </ChartCard>

                  <ChartCard title="Requests in the last 30 days" subtitle="Privacy requests and their outcome, by kind">
                    <div className="space-y-4">
                      <RequestsTable requests={audit.requests_last_30_days} />
                      {audit.unverified_erasures_total > 0
                        ? <Finding tone="bad">{count(audit.unverified_erasures_total, 'erasure or retention purge', 'erasures or retention purges')} could not be verified as complete. This needs attention.</Finding>
                        : <Finding tone="ok">Every recorded erasure and retention purge was verified as complete.</Finding>}
                    </div>
                  </ChartCard>

                  <ChartCard title="Retention and temporary files" subtitle="How long data is kept, and what is left lying around">
                    <div className="space-y-4">
                      {retention.enabled
                        ? <Finding tone="ok">Facial data is purged automatically after {count(retention.days, 'day')}.</Finding>
                        : <Finding tone="warn">There is no retention limit: biometric data is kept until the person deletes it.</Finding>}
                      <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-ink-faint mb-1.5">Last retention purge</h3>
                        {retention.last_purge
                          ? <FactsTable facts={retention.last_purge} words={PURGE_WORDS}
                              flag={(key, value) => (key === 'verified' && value === false) || (key === 'summary.unverified_users' && typeof value === 'number' && value > 0)} />
                          : <p className="text-xs text-ink-mute">No purge has run.</p>}
                      </div>
                      <dl>
                        <Row label={`Temporary archives older than ${count(temp.max_age_hours, 'hour')}`} tone={temp.stale_temp_archives > 0 ? 'warn' : 'plain'}>
                          {show(temp.stale_temp_archives)}{temp.stale_temp_archives > 0 ? ' not yet removed' : ''}
                        </Row>
                      </dl>
                      {temp.orphan_media_deletion_enabled
                        ? <Finding tone="ok">Media files that belong to no record are deleted automatically.</Finding>
                        : <Finding tone="warn">Media files that belong to no record are not deleted automatically.</Finding>}
                    </div>
                  </ChartCard>

                  <ChartCard title="Encryption" subtitle="How photos and identity data are protected">
                    <div className="space-y-4">
                      {encryption.uploaded_images_encrypted_at_rest
                        ? <Finding tone="ok">Uploaded photos are encrypted at rest.</Finding>
                        : <Finding tone="bad">Uploaded photos are not encrypted at rest.</Finding>}
                      <Finding tone="plain">Identity data: {encryption.identity_embeddings}</Finding>
                      {encryption.dedicated_embedding_key_configured
                        ? <Finding tone="ok">A dedicated key protects identity data.</Finding>
                        : <Finding tone="warn">No dedicated key is set: identity data is protected with the server's general secret key.</Finding>}
                      <dl>
                        <Row label="Current key id">{show(encryption.current_key_id)}</Row>
                        <Row label="Previous keys still configured">{show(encryption.previous_keys_configured)}</Row>
                      </dl>
                      <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-ink-faint mb-1.5">Stored identity records</h3>
                        <FactsTable facts={encryption.stored_records} words={RECORD_WORDS}
                          flag={(key, value) => (key === 'rotation_needed' && value === true) || (key === 'unrecognized' && typeof value === 'number' && value > 0)} />
                      </div>
                    </div>
                  </ChartCard>
                </div>
              </>
            )
          }}
        </AsyncGate>
      </div>
    </NeedsApi>
  )
}
