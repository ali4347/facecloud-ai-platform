import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertTriangle, Camera, FolderHeart, Loader2, ScanFace, Search as SearchIcon, Sparkles, Upload, UserRound } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ImageCard } from '../../components/features/ImageCard'
import { UrlThumb } from '../../components/features/UrlThumb'
import { EmptyState } from '../../components/ui/EmptyState'
import { NeedsApi } from '../../components/ui/NeedsApi'
import { useApiResource } from '../../lib/useApiResource'
import { faceSearch, isConsentRequired, semanticSearch, type FaceSearchResult } from '../../lib/api/discover'
import { SEARCH_MIN_LENGTH, searchEverything } from '../../lib/api/search'

const Section = ({ icon: Icon, title, count, children }: { icon: typeof SearchIcon; title: string; count?: number; children: React.ReactNode }) => (
  <section className="mb-8">
    <h2 className="text-[11px] font-bold uppercase tracking-wider text-ink-faint flex items-center gap-1.5 mb-3"><Icon className="w-3.5 h-3.5" />{title}{count !== undefined && <span className="text-ink-faint font-normal">· {count}</span>}</h2>
    {children}
  </section>
)

/** Everything that matches a word: photos by name and by what is in them, people, albums, places, folders and uploads; and a search by a face. */
export default function Search() {
  const [params, setParams] = useSearchParams()
  const urlQuery = params.get('q') ?? ''
  const [text, setText] = useState(urlQuery)
  const query = urlQuery.trim()
  useEffect(() => setText(urlQuery), [urlQuery])
  useEffect(() => {
    const timer = setTimeout(() => { const next = text.trim(); if (next !== urlQuery.trim()) setParams(next ? { q: next } : {}, { replace: true }) }, 350)
    return () => clearTimeout(timer)
  }, [text, urlQuery, setParams])

  const ready = query.length >= SEARCH_MIN_LENGTH
  const everything = useApiResource(signal => searchEverything(query, 10, signal), () => null, [query], { skip: !ready })
  const semantic = useApiResource(signal => semanticSearch(query, 24, signal), () => null, [query], { skip: !ready })
  const r = everything.data

  return (
    <NeedsApi title="Search" icon={SearchIcon}>
      <div className="page-enter">
        <PageHeader title="Search" subtitle="Photos, people, albums and places" />
        <form onSubmit={event => event.preventDefault()} className="relative mb-6 max-w-xl">
          <SearchIcon className="w-4 h-4 text-ink-faint absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input autoFocus value={text} onChange={event => setText(event.target.value)} placeholder="Search by name, or by what is in the photo (beach, red car…)" aria-label="Search" className="fc-input !pl-10" />
        </form>

        <FaceSearchPanel />

        {!ready && <p className="text-xs text-ink-mute">Type at least {SEARCH_MIN_LENGTH} letters.</p>}
        {ready && everything.loading && <p className="text-xs text-ink-faint flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Searching…</p>}
        {ready && everything.error && <p role="alert" className="text-xs text-red-500 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{everything.error}</p>}

        {ready && !everything.loading && r && (
          <>
            {r.images.length > 0 && (
              <Section icon={SearchIcon} title="Photos with that name" count={r.images.length}>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {r.images.map(item => <Link key={item.id} to={`/dashboard/images/${item.id}`} title={item.name} className="fc-card overflow-hidden aspect-square block"><UrlThumb url={item.thumbnail_url} alt={item.name} /></Link>)}
                </div>
              </Section>
            )}
            {semantic.data && semantic.data.enabled && !('unavailable' in semantic.data && semantic.data.unavailable) && semantic.data.results.length > 0 && (
              <Section icon={Sparkles} title="Photos that look like this" count={semantic.data.results.length}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">{semantic.data.results.map(hit => <ImageCard key={hit.photo.id} image={hit.photo} />)}</div>
              </Section>
            )}
            {semantic.data && 'unavailable' in semantic.data && semantic.data.unavailable && <p className="text-[11px] text-ink-faint mb-6">Searching by what is in a photo is not available right now.</p>}
            {(r.people?.length ?? 0) > 0 && (
              <Section icon={UserRound} title="People" count={r.people!.length}>
                <div className="flex flex-wrap gap-3">
                  {r.people!.map(person => (
                    <Link key={person.id} to={`/dashboard/images?person=${person.id}`} className="flex items-center gap-2.5 pr-4 rounded-full border border-line bg-surface-mute hover:border-accent/40">
                      <span className="w-10 h-10 rounded-full overflow-hidden bg-surface flex-shrink-0"><UrlThumb url={person.avatar_url} alt={person.display_name} /></span>
                      <span><span className="block text-xs font-semibold text-ink">{person.display_name}</span><span className="block text-[10px] text-ink-faint">{person.photo_count} photo{person.photo_count === 1 ? '' : 's'}</span></span>
                    </Link>
                  ))}
                </div>
              </Section>
            )}
            {(r.albums?.length ?? 0) > 0 && (
              <Section icon={FolderHeart} title="Albums" count={r.albums!.length}>
                <div className="flex flex-wrap gap-2">{r.albums!.map(album => <Link key={album.id} to={`/dashboard/albums/${album.id}`} className="px-3.5 py-2 rounded-xl border border-line bg-surface-mute text-xs font-semibold text-ink hover:border-accent/40">{album.title} <span className="text-ink-faint font-normal">· {album.photo_count}</span></Link>)}</div>
              </Section>
            )}
            {r.groups.length > 0 && (
              <Section icon={UserRound} title="Person folders" count={r.groups.length}>
                <div className="flex flex-wrap gap-2">{r.groups.map(group => <Link key={group.id} to={`/dashboard/groups/${group.id}`} className="px-3.5 py-2 rounded-xl border border-line bg-surface-mute text-xs font-semibold text-ink hover:border-accent/40">{group.display_name} <span className="text-ink-faint font-normal">· {group.member_count}</span></Link>)}</div>
              </Section>
            )}
            {r.jobs.length > 0 && (
              <Section icon={Upload} title="Uploads" count={r.jobs.length}>
                <div className="flex flex-wrap gap-2">{r.jobs.map(job => <Link key={job.id} to={`/dashboard/processing/${job.id}`} className="px-3.5 py-2 rounded-xl border border-line bg-surface-mute text-xs font-semibold text-ink hover:border-accent/40">{job.display_name} <span className="text-ink-faint font-normal">· {job.total_files} file{job.total_files === 1 ? '' : 's'}</span></Link>)}</div>
              </Section>
            )}
            {r.images.length + r.groups.length + r.jobs.length + (r.people?.length ?? 0) + (r.albums?.length ?? 0) === 0 && !(semantic.data?.results.length) && (
              <EmptyState icon={SearchIcon} title="Nothing found" description={`Nothing of yours matches “${query}”. Try another word, or search by a face above.`} />
            )}
          </>
        )}
      </div>
    </NeedsApi>
  )
}

/** Choose a photo of someone and find the photos of them in the library. The photo is not kept. */
function FaceSearchPanel() {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [needsConsent, setNeedsConsent] = useState(false)
  const [result, setResult] = useState<FaceSearchResult | null>(null)
  const [fileName, setFileName] = useState('')

  const run = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBusy(true); setError(''); setNeedsConsent(false); setResult(null); setFileName(file.name)
    try { setResult(await faceSearch(file)) }
    catch (caught) { if (isConsentRequired(caught)) setNeedsConsent(true); else setError(caught instanceof Error ? caught.message : 'The search did not work.') }
    finally { setBusy(false) }
  }

  return (
    <div className="fc-card p-4 mb-8 max-w-xl">
      <div className="flex items-center gap-3">
        <ScanFace className="w-5 h-5 text-accent flex-shrink-0" />
        <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-ink">Search by a face</p><p className="text-[11px] text-ink-mute">Pick a photo of someone and see which of your photos they are in. The photo is not stored.</p></div>
        <button type="button" onClick={() => input.current?.click()} disabled={busy} className="fc-btn-secondary !py-2 !px-3 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60">{busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}Choose a photo</button>
        <input ref={input} type="file" accept="image/*" onChange={run} className="hidden" aria-label="Photo of the face to search for" />
      </div>
      {needsConsent && <p role="alert" className="mt-3 text-xs text-[#F59E0B]">Searching by a face needs your permission to process faces. You can allow it in <Link to="/dashboard/settings" className="underline font-semibold">Settings</Link>.</p>}
      {error && <p role="alert" className="mt-3 text-xs text-red-500">{error}</p>}
      {result && !result.faces_detected && <p className="mt-3 text-xs text-ink-mute">No face was found in {fileName || 'that photo'}. Try a clearer photo of the face.</p>}
      {result && result.faces_detected && result.matches.length === 0 && <p className="mt-3 text-xs text-ink-mute">A face was found, but nobody in your library looks like it yet.</p>}
      {result && result.matches.length > 0 && (
        <ul className="mt-4 space-y-4">
          {result.matches.map(match => (
            <li key={match.group_id}>
              <div className="flex items-center justify-between gap-2 mb-2"><Link to={`/dashboard/groups/${match.group_id}`} className="text-sm font-semibold text-ink hover:text-accent">{match.display_name}</Link><span className="text-[11px] text-ink-faint">{Math.round(match.similarity * 100)}% alike · {match.photo_count} photo{match.photo_count === 1 ? '' : 's'}</span></div>
              <div className="flex gap-2 overflow-x-auto pb-1">{match.photos.map(photo => <Link key={photo.id} to={`/dashboard/images/${photo.id}`} title={photo.original_name} className="w-20 h-20 rounded-xl overflow-hidden border border-line flex-shrink-0"><UrlThumb url={photo.thumbnail_url} alt={photo.original_name} /></Link>)}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
