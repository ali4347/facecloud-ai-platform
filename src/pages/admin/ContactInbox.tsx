import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckCheck, Mail, MailOpen, Search, Send } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { AsyncGate } from '../../components/admin/AsyncGate'
import { USE_API } from '../../lib/api/config'
import {
  listContactMessages, listEarlyAccess, markContactMessageRead, markEarlyAccessRead, markInboxAllRead,
  type ContactMessageRow, type EarlyAccessRow,
} from '../../lib/api/adminInbox'
import { messageFor, useApiResource } from '../../lib/useApiResource'
import { announceNotificationsChanged } from '../../lib/api/notifications'
import { INBOX_CHANGED } from '../../lib/useInboxUnread'
import { formatDateTime } from '../../lib/utils'

type Kind = 'contact' | 'early_access'
const DELIVERY_WORDS: Record<string, string> = {
  queued: 'Waiting to be e-mailed', sent: 'E-mailed to the team', failed: 'E-mail failed (the message is still here)', skipped: 'Not e-mailed (no recipient set); only here',
}

/** What visitors wrote on the contact form, and the addresses left for early access. A new one also reaches the bell as a notification. */
export default function ContactInbox() {
  const [params, setParams] = useSearchParams()
  const kind: Kind = params.get('kind') === 'early_access' ? 'early_access' : 'contact'
  const openId = Number(params.get('id')) || null
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState<{ text: string; bad?: boolean } | null>(null)

  const messages = useApiResource(signal => listContactMessages({ unread: unreadOnly, q: search }, signal), () => ({ count: 0, results: [] as ContactMessageRow[] }), [unreadOnly, search])
  const signups = useApiResource(signal => listEarlyAccess({ unread: unreadOnly, q: search }, signal), () => ({ count: 0, results: [] as EarlyAccessRow[] }), [unreadOnly, search])

  const [selectedMessage, setSelectedMessage] = useState<ContactMessageRow | null>(null)
  const rows = useMemo(() => messages.data?.results ?? [], [messages.data])

  /* A link from the bell (?kind=contact&id=7) opens that message. */
  useEffect(() => {
    if (kind !== 'contact' || openId === null) return
    const found = rows.find(row => row.id === openId)
    if (found) void open(found)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, openId, rows.length])

  const changed = () => { announceNotificationsChanged(); window.dispatchEvent(new Event(INBOX_CHANGED)) }

  async function open(row: ContactMessageRow) {
    setSelectedMessage(row)
    if (row.is_read) return
    try {
      const updated = await markContactMessageRead(row.id, true)
      setSelectedMessage(updated); messages.reload(); changed()
    } catch (caught) { setNotice({ text: messageFor(caught), bad: true }) }
  }
  async function toggleMessage(row: ContactMessageRow) {
    try { const updated = await markContactMessageRead(row.id, !row.is_read); setSelectedMessage(updated); messages.reload(); changed() }
    catch (caught) { setNotice({ text: messageFor(caught), bad: true }) }
  }
  async function toggleSignup(row: EarlyAccessRow) {
    try { await markEarlyAccessRead(row.id, !row.is_read); signups.reload(); changed() }
    catch (caught) { setNotice({ text: messageFor(caught), bad: true }) }
  }
  async function markAll() {
    try {
      const done = await markInboxAllRead(kind)
      setNotice({ text: `Marked as read: ${Object.values(done.marked_read).reduce((a, b) => a + b, 0)}.` })
      messages.reload(); signups.reload(); changed()
    } catch (caught) { setNotice({ text: messageFor(caught), bad: true }) }
  }

  const setKind = (next: Kind) => { setParams(next === 'contact' ? {} : { kind: next }); setSelectedMessage(null) }
  const unreadCount = (kind === 'contact' ? messages.data?.results : signups.data?.results)?.filter(row => !row.is_read).length ?? 0

  return (
    <div className="space-y-6 page-enter">
      <PageHeader title="Inbox" subtitle="What visitors wrote on the contact form, and the e-mail addresses left for early access. Each new one also appears in your notifications." />

      {notice && (
        <div role={notice.bad ? 'alert' : 'status'} className={`p-3 rounded-2xl text-xs border ${notice.bad ? 'bg-[#EF4444]/10 border-[#EF4444]/25 text-[#F87171]' : 'bg-[#10B981]/10 border-[#10B981]/25 text-[#34D399]'}`}>{notice.text}</div>
      )}

      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Inbox">
        {([['contact', 'Contact messages'], ['early_access', 'Early-access e-mails']] as const).map(([value, label]) => (
          <button key={value} type="button" role="tab" aria-selected={kind === value} onClick={() => setKind(value)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${kind === value ? 'bg-accent/15 text-accent border-accent/30' : 'border-line text-ink-mute hover:text-ink'}`}>
            {label}
          </button>
        ))}
        <div className="flex-1" />
        <label className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
          <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, e-mail, message…" aria-label="Search the inbox" className="fc-input !pl-9 !py-2 text-xs w-64" />
        </label>
        <button type="button" onClick={() => setUnreadOnly(v => !v)} aria-pressed={unreadOnly}
          className={`px-3 py-2 rounded-xl text-xs font-semibold border cursor-pointer ${unreadOnly ? 'bg-accent/15 text-accent border-accent/30' : 'border-line text-ink-mute hover:text-ink'}`}>Unread only</button>
        <button type="button" onClick={() => void markAll()} disabled={!USE_API || unreadCount === 0}
          className="px-3 py-2 rounded-xl text-xs font-semibold border border-line text-ink-mute hover:text-ink inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
          <CheckCheck className="w-3.5 h-3.5" /> Mark all read
        </button>
      </div>

      {kind === 'contact' ? (
        <AsyncGate state={messages} what="the contact messages">
          {() => (
          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 space-y-2 max-h-[34rem] overflow-y-auto pr-1">
              {rows.length === 0 && <p className="text-xs text-ink-mute py-10 text-center">{search || unreadOnly ? 'No message matches.' : 'No one has written yet.'}</p>}
              {rows.map(row => (
                <button key={row.id} type="button" onClick={() => void open(row)} aria-current={selectedMessage?.id === row.id}
                  className={`w-full text-left p-3.5 rounded-2xl border cursor-pointer transition-colors ${selectedMessage?.id === row.id ? 'border-accent/40 bg-accent/[0.06]' : 'border-line bg-surface-mute hover:border-line-strong'}`}>
                  <div className="flex items-center gap-2">
                    {!row.is_read && <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" aria-label="Unread" />}
                    <span className={`text-xs truncate ${row.is_read ? 'font-semibold text-ink-soft' : 'font-bold text-ink'}`}>{row.name}</span>
                    <span className="text-[10px] text-ink-faint ml-auto flex-shrink-0">{formatDateTime(row.created_at)}</span>
                  </div>
                  <p className="text-[11px] text-ink-mute truncate mt-1">{row.reason} · {row.message}</p>
                </button>
              ))}
            </div>
            <div className="lg:col-span-3">
              <ChartCard title={selectedMessage ? `From ${selectedMessage.name}` : 'Message'} subtitle={selectedMessage ? formatDateTime(selectedMessage.created_at) : 'Choose a message on the left'}>
                {!selectedMessage ? (
                  <div className="h-48 flex flex-col items-center justify-center text-ink-mute gap-2"><Mail className="w-8 h-8 opacity-40" /><p className="text-xs font-semibold">Nothing selected</p></div>
                ) : (
                  <div className="space-y-4 text-xs">
                    <dl className="grid sm:grid-cols-2 gap-3">
                      <div><dt className="text-[10px] font-bold uppercase tracking-widest text-ink-faint">Name</dt><dd className="text-ink font-semibold mt-0.5">{selectedMessage.name}</dd></div>
                      <div><dt className="text-[10px] font-bold uppercase tracking-widest text-ink-faint">E-mail</dt><dd className="mt-0.5"><a href={`mailto:${selectedMessage.email}`} className="text-[#FB923C] font-semibold hover:underline break-all">{selectedMessage.email}</a></dd></div>
                      <div><dt className="text-[10px] font-bold uppercase tracking-widest text-ink-faint">Company</dt><dd className="text-ink mt-0.5">{selectedMessage.company || '—'}</dd></div>
                      <div><dt className="text-[10px] font-bold uppercase tracking-widest text-ink-faint">About</dt><dd className="text-ink mt-0.5">{selectedMessage.reason}</dd></div>
                    </dl>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-ink-faint mb-1.5">Message</p>
                      <p className="p-4 rounded-2xl bg-surface-mute border border-line text-ink whitespace-pre-wrap leading-relaxed">{selectedMessage.message}</p>
                    </div>
                    <p className="text-[11px] text-ink-mute">{DELIVERY_WORDS[selectedMessage.delivery_status] ?? selectedMessage.delivery_status}{selectedMessage.failure_reason ? `: ${selectedMessage.failure_reason}` : ''}</p>
                    <div className="flex flex-wrap gap-2">
                      <a href={`mailto:${selectedMessage.email}?subject=${encodeURIComponent(`Re: ${selectedMessage.reason}`)}`} className="fc-btn-primary !py-2 !px-4 text-xs gap-2 inline-flex items-center"><Send className="w-3.5 h-3.5" /> Reply by e-mail</a>
                      <button type="button" onClick={() => void toggleMessage(selectedMessage)} className="fc-btn-secondary !py-2 !px-4 text-xs gap-2 inline-flex items-center cursor-pointer">
                        {selectedMessage.is_read ? <><Mail className="w-3.5 h-3.5" /> Mark as unread</> : <><MailOpen className="w-3.5 h-3.5" /> Mark as read</>}
                      </button>
                    </div>
                  </div>
                )}
              </ChartCard>
            </div>
          </div>
          )}
        </AsyncGate>
      ) : (
        <AsyncGate state={signups} what="the early-access e-mails">
          {() => (
          <ChartCard title="Early-access e-mails" subtitle={`${signups.data?.count ?? 0} address${(signups.data?.count ?? 0) === 1 ? '' : 'es'} · newest first`}>
            <div className="space-y-2">
              {(signups.data?.results ?? []).length === 0 && <p className="text-xs text-ink-mute py-10 text-center">{search || unreadOnly ? 'No address matches.' : 'No one has left an address yet.'}</p>}
              {(signups.data?.results ?? []).map(row => (
                <div key={row.id} className="p-3.5 rounded-2xl bg-surface-mute border border-line flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    {!row.is_read && <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" aria-label="Unread" />}
                    <a href={`mailto:${row.email}`} className={`truncate hover:underline ${row.is_read ? 'text-ink-soft' : 'text-ink font-bold'}`}>{row.email}</a>
                    <span className="text-[10px] text-ink-faint flex-shrink-0">{formatDateTime(row.created_at)}</span>
                  </div>
                  <button type="button" onClick={() => void toggleSignup(row)} className="text-[11px] font-semibold text-ink-mute hover:text-ink cursor-pointer flex-shrink-0">{row.is_read ? 'Mark unread' : 'Mark read'}</button>
                </div>
              ))}
            </div>
          </ChartCard>
          )}
        </AsyncGate>
      )}
    </div>
  )
}
