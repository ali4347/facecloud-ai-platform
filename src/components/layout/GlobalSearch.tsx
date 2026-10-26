import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FolderArchive, Loader2, Search, Users } from 'lucide-react'
import { AuthedImage } from '../ui/AuthedImage'
import { getImageThumbnail } from '../../lib/api/images'
import { SEARCH_MIN_LENGTH, searchEverything, type SearchResults } from '../../lib/api/search'
import { USE_API } from '../../lib/api/config'
import { statusLabel } from '../../lib/imageData'
import type { Role } from '../../data/mock'

interface Option { key: string; to: string }

const fieldClass =
  'fc-field w-full h-10 pl-10 pr-16 !rounded-full text-[13px] text-ink ' +
  'placeholder:text-ink-faint outline-none transition-colors'

/**
 * The top-bar search.
 *
 * In the user portal it searches the person's own photos, Person Folders and uploads as they type (after a short
 * pause, from two characters) and opens what they pick. The admin and moderator portals share the bar but have
 * nothing of this kind to search yet, so there it stays the plain field it was.
 */
export function GlobalSearch({ role, inputRef }: { role: Role; inputRef: React.RefObject<HTMLInputElement | null> }) {
  const live = role === 'user' && USE_API
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [active, setActive] = useState(-1)
  const boxRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const navigate = useNavigate()
  const location = useLocation()
  const text = query.trim()
  const ready = text.length >= SEARCH_MIN_LENGTH

  useEffect(() => {
    if (!live) return
    if (!ready) { setResults(null); setLoading(false); setError(null); return }
    const controller = new AbortController()
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const found = await searchEverything(text, 5, controller.signal)
        if (controller.signal.aborted) return
        setResults(found); setError(null); setActive(-1)
      } catch (caught) {
        if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : 'Search failed.')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 250)
    return () => { controller.abort(); clearTimeout(timer) }
  }, [text, ready, live])

  // Close on a click elsewhere and whenever the page changes.
  useEffect(() => {
    if (!open) return
    const onDown = (event: PointerEvent) => { if (!boxRef.current?.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])
  useEffect(() => { setOpen(false) }, [location.pathname])

  const options: Option[] = useMemo(() => !results ? [] : [
    ...results.images.map(item => ({ key: `i${item.id}`, to: `/dashboard/images/${item.id}` })),
    ...results.groups.map(item => ({ key: `g${item.id}`, to: `/dashboard/groups/${item.id}` })),
    ...results.jobs.map(item => ({ key: `j${item.id}`, to: `/dashboard/processing/${item.id}` })),
  ], [results])

  const go = (to: string) => { setOpen(false); setQuery(''); setResults(null); navigate(to) }
  const empty = ready && !loading && !error && results !== null && options.length === 0

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!live) return
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
        placeholder="Search project..."
        aria-label="Search images, groups and jobs"
        role={live ? 'combobox' : undefined}
        aria-expanded={live ? open && ready : undefined}
        aria-controls={live ? listId : undefined}
        autoComplete="off"
        className={fieldClass}
      />
      <span className="fc-kbd absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center">⌘ K</span>

      {live && open && text.length > 0 && (
        <div id={listId} role="listbox"
          className="absolute left-0 right-0 top-[52px] z-50 rounded-2xl fc-popover border overflow-hidden max-h-[70vh] overflow-y-auto p-2">
          {!ready && <p className="px-3 py-4 text-[12px] text-ink-faint">Type at least {SEARCH_MIN_LENGTH} characters to search.</p>}
          {ready && loading && !results && (
            <p className="px-3 py-4 text-[12px] text-ink-faint flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" />Searching…</p>
          )}
          {error && <p role="alert" className="px-3 py-3 text-[12px] text-[#F87171]">{error}</p>}
          {empty && <p className="px-3 py-4 text-[12px] text-ink-faint">Nothing matches “{text}”.</p>}

          {results && results.images.length > 0 && (
            <div className="mb-1">
              <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-ink-faint">Photos</p>
              {results.images.map(item => (
                <button key={item.id} type="button" role="option" aria-selected={options[active]?.key === `i${item.id}`}
                  className={rowClass(`i${item.id}`)} onClick={() => go(`/dashboard/images/${item.id}`)}>
                  <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-surface-mute">
                    <AuthedImage load={item.thumbnail_url ? signal => getImageThumbnail(item.id, 256, signal) : null}
                      cacheKey={`search-${item.id}`} alt="" className="w-full h-full !border-0" rounded="rounded-none" />
                  </div>
                  <span className="flex-1 min-w-0 text-[13px] text-ink truncate">{item.name}</span>
                  <span className="text-[10px] text-ink-faint flex-shrink-0">{statusLabel(item.status)}</span>
                </button>
              ))}
            </div>
          )}

          {results && results.groups.length > 0 && (
            <div className="mb-1">
              <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-ink-faint">Person Folders</p>
              {results.groups.map(item => (
                <button key={item.id} type="button" role="option" aria-selected={options[active]?.key === `g${item.id}`}
                  className={rowClass(`g${item.id}`)} onClick={() => go(`/dashboard/groups/${item.id}`)}>
                  <div className="w-8 h-8 rounded-lg bg-soft-blue flex items-center justify-center flex-shrink-0"><Users className="w-4 h-4 text-accent" /></div>
                  <span className="flex-1 min-w-0 text-[13px] text-ink truncate">{item.display_name}</span>
                  <span className="text-[10px] text-ink-faint flex-shrink-0">{item.member_count} photo{item.member_count === 1 ? '' : 's'}</span>
                </button>
              ))}
            </div>
          )}

          {results && results.jobs.length > 0 && (
            <div>
              <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-ink-faint">Uploads</p>
              {results.jobs.map(item => (
                <button key={item.id} type="button" role="option" aria-selected={options[active]?.key === `j${item.id}`}
                  className={rowClass(`j${item.id}`)} onClick={() => go(`/dashboard/processing/${item.id}`)}>
                  <div className="w-8 h-8 rounded-lg bg-surface-mute flex items-center justify-center flex-shrink-0"><FolderArchive className="w-4 h-4 text-ink-mute" /></div>
                  <span className="flex-1 min-w-0 text-[13px] text-ink truncate">{item.display_name}</span>
                  <span className="text-[10px] text-ink-faint flex-shrink-0">{item.total_files} file{item.total_files === 1 ? '' : 's'}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
