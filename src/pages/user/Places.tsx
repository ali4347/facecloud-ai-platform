import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Loader2, MapPin, RefreshCw } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { LibraryTabs } from '../../components/features/LibraryTabs'
import { UrlThumb } from '../../components/features/UrlThumb'
import { EmptyState } from '../../components/ui/EmptyState'
import { NeedsApi } from '../../components/ui/NeedsApi'
import { SearchInput } from '../../components/ui/SearchInput'
import { useApiResource } from '../../lib/useApiResource'
import { listPlaces, type PlacesResponse } from '../../lib/api/discover'

/** The places the person's photos were taken in, most photos first. Choosing one opens My Images narrowed to it. */
export default function Places() {
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  useEffect(() => { const timer = setTimeout(() => setQuery(search.trim()), 300); return () => clearTimeout(timer) }, [search])
  const places = useApiResource(signal => listPlaces({ q: query || undefined }, signal), () => ({ attribution: '', names_available: true, places: [] }) as PlacesResponse, [query])
  const data = places.data
  const rows = data?.places ?? []

  return (
    <NeedsApi title="Places" icon={MapPin}>
      <div className="page-enter">
        <PageHeader title="Places" subtitle={places.loading ? 'Loading…' : data?.names_available === false ? 'Where your photos were taken' : `${rows.length} place${rows.length === 1 ? '' : 's'}`} />
        <LibraryTabs />
        <div className="mb-6"><SearchInput placeholder="Search places…" value={search} onChange={event => setSearch(event.target.value)} className="w-64" /></div>

        {places.loading && <div className="text-center py-20 text-ink-faint"><Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin" /><p className="text-xs font-semibold">Loading your places…</p></div>}
        {!places.loading && places.error && (
          <div className="text-center py-20"><AlertTriangle className="w-7 h-7 mx-auto mb-3 text-[#EF4444]" /><p className="text-xs font-semibold text-ink">{places.error}</p>
            <button type="button" onClick={places.reload} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#FB923C] hover:underline cursor-pointer"><RefreshCw className="w-3.5 h-3.5" />Try again</button></div>
        )}
        {!places.loading && !places.error && data?.names_available === false && (
          <EmptyState icon={MapPin} title="Place names are not set up on this server yet" description="Photos that carry a position keep it, but they get no place name until the server has installed the names." />
        )}
        {!places.loading && !places.error && data?.names_available !== false && rows.length === 0 && (
          <EmptyState icon={MapPin} title={query ? 'No place has that name' : 'No places yet'} description={query ? 'Try another word.' : 'Photos taken with location on are grouped by where they were taken. None of yours has a position yet.'} />
        )}
        {!places.loading && !places.error && rows.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {rows.map(place => (
                <Link key={place.id} to={`/dashboard/images?place=${place.id}`} className="fc-card overflow-hidden group hover:shadow-card-md transition-all">
                  <div className="h-36 bg-surface-mute flex items-center justify-center">{place.cover_thumbnail_url ? <UrlThumb url={place.cover_thumbnail_url} alt={place.name} /> : <MapPin className="w-7 h-7 text-ink-faint" />}</div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-ink truncate" title={place.name}>{place.name}</p>
                    <p className="text-xs text-ink-mute truncate">{[place.region, place.country].filter(Boolean).join(', ')}</p>
                    <p className="text-[11px] text-ink-faint mt-1">{place.photo_count} photo{place.photo_count === 1 ? '' : 's'}</p>
                  </div>
                </Link>
              ))}
            </div>
            {data?.attribution && <p className="mt-6 text-[11px] text-ink-faint">{data.attribution}</p>}
          </>
        )}
      </div>
    </NeedsApi>
  )
}
