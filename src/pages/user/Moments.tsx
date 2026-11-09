import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Clock, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ImageCard } from '../../components/features/ImageCard'
import { LibraryTabs } from '../../components/features/LibraryTabs'
import { UrlThumb } from '../../components/features/UrlThumb'
import { EmptyState } from '../../components/ui/EmptyState'
import { NeedsApi } from '../../components/ui/NeedsApi'
import { Pager } from '../../components/ui/Pager'
import { useApiResource } from '../../lib/useApiResource'
import { getEvent, getMemory, listEventPhotos, listEvents, listMemories, photosLinkFor, type EventPhoto, type Memory, type MemoryCard, type PhotoEvent } from '../../lib/api/discover'
import { rowsOf } from '../../lib/api/library'
import { formatDateTime } from '../../lib/utils'
import type { Page } from '../../lib/api/images'

const GAPS = [{ hours: 1, label: '1 hour' }, { hours: 3, label: '3 hours' }, { hours: 6, label: '6 hours' }, { hours: 12, label: '12 hours' }, { hours: 24, label: 'A day' }]

const dayRange = (start: string, end: string) => {
  const a = new Date(start), b = new Date(end)
  const day = (d: Date) => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  return a.toDateString() === b.toDateString() ? day(a) : `${day(a)} to ${day(b)}`
}

/** Memories (a few of the best photos of a moment, worked out when asked) and Events (photos grouped by the time between them). */
export default function Moments() {
  const [tab, setTab] = useState<'memories' | 'events'>('memories')
  const [gap, setGap] = useState(6)
  return (
    <NeedsApi title="Moments" icon={Clock}>
      <div className="page-enter">
        <PageHeader title="Moments" subtitle="Memories and events made from your own photos" />
        <LibraryTabs />
        <div role="tablist" className="inline-flex gap-1 p-1 rounded-2xl bg-surface-mute border border-line mb-6">
          {(['memories', 'events'] as const).map(name => (
            <button key={name} type="button" role="tab" aria-selected={tab === name} onClick={() => setTab(name)} className={`px-4 py-1.5 rounded-xl text-xs font-semibold capitalize cursor-pointer ${tab === name ? 'bg-accent/15 text-accent border border-accent/30' : 'text-ink-mute border border-transparent hover:text-ink'}`}>{name}</button>
          ))}
        </div>
        {tab === 'memories' ? <Memories /> : <Events gap={gap} onGap={setGap} />}
      </div>
    </NeedsApi>
  )
}

function Memories() {
  const memories = useApiResource(signal => listMemories(12, signal), () => [] as MemoryCard[], [])
  const rows = memories.data ?? []
  if (memories.loading) return <Loading text="Looking for your memories…" />
  if (memories.error) return <Failed message={memories.error} onRetry={memories.reload} />
  if (rows.length === 0) return <EmptyState icon={Sparkles} title="No memories yet" description="A memory needs a few photos of the same moment: three taken on today's date in an earlier year, five in one outing, or ten of a person you have named." />
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {rows.map(card => (
        <Link key={card.id} to={`/dashboard/moments/memories/${encodeURIComponent(card.id)}`} className="fc-card overflow-hidden hover:shadow-card-md transition-all">
          <div className="grid grid-cols-4 gap-0.5 h-32 bg-surface-mute">
            {(card.preview_thumbnail_urls.length ? card.preview_thumbnail_urls : [card.cover_thumbnail_url]).slice(0, 4).map((url, index) => <div key={index} className="overflow-hidden"><UrlThumb url={url} alt="" /></div>)}
          </div>
          <div className="p-4">
            <p className="text-sm font-semibold text-ink">{card.title}</p>
            <p className="text-xs text-ink-mute mt-0.5">{card.subtitle}</p>
            <p className="text-[11px] text-ink-faint mt-1">{card.photo_count} photo{card.photo_count === 1 ? '' : 's'}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}

function Events({ gap, onGap }: { gap: number; onGap: (hours: number) => void }) {
  const events = useApiResource(signal => listEvents(gap, signal), () => [] as PhotoEvent[], [gap])
  const rows = useMemo(() => rowsOf<PhotoEvent>(events.data), [events.data])
  return (
    <>
      <label className="flex items-center gap-2 mb-5 text-xs text-ink-mute">A new event starts after a silence of
        <select value={gap} onChange={event => onGap(Number(event.target.value))} className="fc-input !w-auto !py-1.5">{GAPS.map(option => <option key={option.hours} value={option.hours}>{option.label}</option>)}</select>
      </label>
      {events.loading && <Loading text="Grouping your photos into events…" />}
      {!events.loading && events.error && <Failed message={events.error} onRetry={events.reload} />}
      {!events.loading && !events.error && rows.length === 0 && <EmptyState icon={Clock} title="No events yet" description="Photos are grouped into events by the time between them. Upload some photos and they will appear here." />}
      {!events.loading && rows.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {rows.map(event => (
            <Link key={event.id} to={`/dashboard/moments/events/${event.id}?gap=${gap}`} className="fc-card overflow-hidden hover:shadow-card-md transition-all">
              <div className="h-36 bg-surface-mute"><UrlThumb url={event.cover_thumbnail_url} alt="" /></div>
              <div className="p-3"><p className="text-sm font-semibold text-ink">{dayRange(event.start, event.end)}</p><p className="text-xs text-ink-mute">{event.photo_count} photo{event.photo_count === 1 ? '' : 's'}</p></div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}

const Loading = ({ text }: { text: string }) => <div className="text-center py-20 text-ink-faint"><Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin" /><p className="text-xs font-semibold">{text}</p></div>
const Failed = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="text-center py-20"><AlertTriangle className="w-7 h-7 mx-auto mb-3 text-[#EF4444]" /><p className="text-xs font-semibold text-ink">{message}</p>
    <button type="button" onClick={onRetry} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#FB923C] hover:underline cursor-pointer"><RefreshCw className="w-3.5 h-3.5" />Try again</button></div>
)

/** One memory: the card and its best photographs (up to 24), and a way into every photo of the moment. */
export function MemoryDetail() {
  const { id } = useParams()
  const memory = useApiResource(signal => getMemory(id ?? '', signal), () => null as unknown as Memory, [id])
  const data = memory.data
  return (
    <NeedsApi title="Memory" icon={Sparkles}>
      <div className="page-enter">
        <Link to="/dashboard/moments" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-mute hover:text-ink mb-3"><ArrowLeft className="w-3.5 h-3.5" />Moments</Link>
        <PageHeader title={data?.title ?? 'Memory'} subtitle={data ? `${data.subtitle} · ${data.photo_count} photo${data.photo_count === 1 ? '' : 's'}` : undefined} action={data ? <Link to={photosLinkFor(data.filter)} className="fc-btn-secondary !py-2 !px-4 text-xs font-bold">See all {data.photo_count} photos</Link> : undefined} />
        {memory.loading && <Loading text="Loading the memory…" />}
        {!memory.loading && memory.error && <EmptyState icon={Sparkles} title="This memory is gone" description="Memories are worked out from your photos when asked, so one can disappear when its photos change. Go back to Moments for the current ones." />}
        {data && <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">{(data.images ?? []).map(photo => <ImageCard key={photo.id} image={photo} />)}</div>}
      </div>
    </NeedsApi>
  )
}

/** One event: its photos, oldest first. */
export function EventDetail() {
  const { id } = useParams()
  const eventId = id && /^\d+$/.test(id) ? Number(id) : null
  const gapParam = Number(new URLSearchParams(window.location.search).get('gap'))
  const gap = gapParam >= 0.25 && gapParam <= 168 ? gapParam : undefined
  const [page, setPage] = useState(1)
  const event = useApiResource(signal => (eventId === null ? Promise.reject(new Error('That event does not exist.')) : getEvent(eventId, gap, signal)), () => null as unknown as PhotoEvent, [eventId, gap])
  const photos = useApiResource(signal => (eventId === null ? Promise.reject(new Error('That event does not exist.')) : listEventPhotos(eventId, page, gap, signal)), () => ({ count: 0, next: null, previous: null, results: [] as EventPhoto[] }) as Page<EventPhoto>, [eventId, gap, page])
  const data = event.data
  return (
    <NeedsApi title="Event" icon={Clock}>
      <div className="page-enter">
        <Link to="/dashboard/moments" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-mute hover:text-ink mb-3"><ArrowLeft className="w-3.5 h-3.5" />Moments</Link>
        <PageHeader title={data ? dayRange(data.start, data.end) : 'Event'} subtitle={data ? `${data.photo_count} photo${data.photo_count === 1 ? '' : 's'} · ${formatDateTime(data.start)}` : undefined} />
        {(event.loading || photos.loading) && <Loading text="Loading the event…" />}
        {!event.loading && event.error && <EmptyState icon={Clock} title="This event is gone" description="Event ids change when photos are added. Go back to Moments for the current events." />}
        {!photos.loading && !photos.error && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
              {(photos.data?.results ?? []).map(photo => (
                <Link key={photo.id} to={`/dashboard/images/${photo.id}`} className="fc-card overflow-hidden aspect-square block"><UrlThumb url={photo.thumbnail_url} alt={photo.original_name} /></Link>
              ))}
            </div>
            <Pager page={page} hasNext={Boolean(photos.data?.next)} hasPrevious={Boolean(photos.data?.previous)} onPage={setPage} />
          </>
        )}
      </div>
    </NeedsApi>
  )
}
