import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Loader2, LayoutDashboard, Search, Users } from 'lucide-react'
import { listAdminUsersPage, type AdminUser } from '../../lib/api/adminUsers'
import { USE_API } from '../../lib/api/config'

const MIN_USER_QUERY = 2

const PAGES = [
  { label: 'Overview', to: '/admin' },
  { label: 'Manage Users', to: '/admin/users' },
  { label: 'Organizations', to: '/admin/organizations' },
  { label: 'Moderators', to: '/admin/moderators' },
  { label: 'Audit Logs', to: '/admin/audit-logs' },
  { label: 'Security Monitoring', to: '/admin/security' },
  { label: 'System Monitoring', to: '/admin/system' },
  { label: 'Statistics', to: '/admin/statistics' },
  { label: 'Upload Statistics', to: '/admin/upload-statistics' },
  { label: 'Rejection Summary', to: '/admin/rejection-summary' },
  { label: 'Image Monitoring', to: '/admin/images' },
]

interface Option { key: string; to: string }

const fieldClass =
  'w-full h-11 pl-10 pr-16 rounded-[14px] bg-surface border border-line text-[13px] text-ink ' +
  'placeholder:text-ink-faint shadow-[0_1px_2px_rgb(var(--a-shadow-rgb) / 0.45)] outline-none ' +
  'transition-colors focus:border-accent-soft'

/**
 * The administrator's top-bar search: it jumps to an admin screen by name, and (against the live API) finds an account
 * by username, email or name. Choosing an account opens Manage Users already searched for it.
 */
export function AdminSearch({ inputRef }: { inputRef: React.RefObject<HTMLInputElement | null> }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [users, setUsers] = useState<AdminUser[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [active, setActive] = useState(-1)
  const boxRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const navigate = useNavigate()
  const location = useLocation()
  const text = query.trim()
  const lookUsers = USE_API && text.length >= MIN_USER_QUERY

  useEffect(() => {
    if (!lookUsers) { setUsers(null); setLoading(false); setError(null); return }
    const controller = new AbortController()
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const page = await listAdminUsersPage({ q: text, page: 1, pageSize: 5 }, controller.signal)
        if (controller.signal.aborted) return
        setUsers(page.results); setError(null); setActive(-1)
      } catch (caught) {
        if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : 'Search failed.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 250)
    return () => { controller.abort(); clearTimeout(timer) }
  }, [text, lookUsers])

  useEffect(() => {
    if (!open) return
    const onDown = (event: PointerEvent) => { if (!boxRef.current?.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])
  useEffect(() => { setOpen(false) }, [location.pathname, location.search])

  const pages = useMemo(() => {
    const needle = text.toLowerCase()
    return needle ? PAGES.filter(p => p.label.toLowerCase().includes(needle)) : []
  }, [text])

  const options: Option[] = useMemo(() => [
    ...pages.map(p => ({ key: `p${p.to}`, to: p.to })),
    ...(users ?? []).map(u => ({ key: `u${u.id}`, to: `/admin/users?q=${encodeURIComponent(u.username)}` })),
  ], [pages, users])

  const go = (to: string) => { setOpen(false); setQuery(''); setUsers(null); navigate(to) }
  const empty = text.length > 0 && !loading && !error && options.length === 0 && (!lookUsers || users !== null)

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') { setOpen(false); event.currentTarget.blur() }
    else if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); setActive(i => Math.min(i + 1, options.length - 1)) }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActive(i => Math.max(i - 1, 0)) }
    else if (event.key === 'Enter' && options.length > 0) { event.preventDefault(); go(options[active >= 0 ? active : 0].to) }
  }

  const rowClass = (key: string) =>
    `w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
      options[active]?.key === key ? 'bg-surface-mute' : 'hover:bg-surface-mute'
    }`

  return (
    <div className="relative" ref={boxRef}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search screens and users..."
        aria-label="Search admin screens and users"
        role="combobox"
        aria-expanded={open && text.length > 0}
        aria-controls={listId}
        autoComplete="off"
        className={fieldClass}
      />
      <span className="fc-kbd absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center">⌘ K</span>

      {open && text.length > 0 && (
        <div id={listId} role="listbox"
          className="absolute left-0 right-0 top-[52px] z-50 rounded-2xl bg-surface border border-line shadow-soft-lg overflow-hidden max-h-[70vh] overflow-y-auto p-2">
          {pages.length > 0 && (
            <div className="mb-1">
              <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-ink-faint">Screens</p>
              {pages.map(p => (
                <button key={p.to} type="button" role="option" aria-selected={options[active]?.key === `p${p.to}`}
                  className={rowClass(`p${p.to}`)} onClick={() => go(p.to)}>
                  <div className="w-8 h-8 rounded-lg bg-surface-mute flex items-center justify-center flex-shrink-0"><LayoutDashboard className="w-4 h-4 text-ink-mute" /></div>
                  <span className="flex-1 min-w-0 text-[13px] text-ink truncate">{p.label}</span>
                </button>
              ))}
            </div>
          )}
          {USE_API && text.length < MIN_USER_QUERY && <p className="px-3 py-3 text-[12px] text-ink-faint">Type at least {MIN_USER_QUERY} characters to search accounts.</p>}
          {lookUsers && loading && !users && (
            <p className="px-3 py-3 text-[12px] text-ink-faint flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" />Searching accounts…</p>
          )}
          {error && <p role="alert" className="px-3 py-3 text-[12px] text-[#F87171]">{error}</p>}
          {users && users.length > 0 && (
            <div>
              <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-ink-faint">Accounts</p>
              {users.map(u => (
                <button key={u.id} type="button" role="option" aria-selected={options[active]?.key === `u${u.id}`}
                  className={rowClass(`u${u.id}`)} onClick={() => go(`/admin/users?q=${encodeURIComponent(u.username)}`)}>
                  <div className="w-8 h-8 rounded-lg bg-soft-blue flex items-center justify-center flex-shrink-0"><Users className="w-4 h-4 text-accent" /></div>
                  <span className="flex-1 min-w-0 text-[13px] text-ink truncate">{u.username}<span className="text-ink-faint"> · {u.email}</span></span>
                  <span className="text-[10px] text-ink-faint flex-shrink-0 capitalize">{u.role}</span>
                </button>
              ))}
            </div>
          )}
          {empty && <p className="px-3 py-4 text-[12px] text-ink-faint">Nothing matches “{text}”.</p>}
        </div>
      )}
    </div>
  )
}
