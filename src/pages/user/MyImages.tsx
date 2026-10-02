import { useMemo, useState } from 'react'
import { AlertTriangle, Images, Loader2, RefreshCw } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ImageCard } from '../../components/features/ImageCard'
import { SearchInput } from '../../components/ui/SearchInput'
import { EmptyState } from '../../components/ui/EmptyState'
import { useMyImages } from '../../lib/imageData'

/** Mirrors the pipeline's own verdicts, which is what the API filters on. */
const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'needs_review', label: 'In review' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'processing', label: 'Processing' },
] as const

export default function MyImages() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const { data, loading, error, isDemo, reload } = useMyImages(page, status || undefined)
  const images = useMemo(() => data?.results ?? [], [data])
  const total = data?.count ?? 0

  /* Filtering by status is the server's job (it knows every page); searching by
     name is done here, over the page in hand, because the API has no name
     search. The subtitle says which number is which so the two cannot be
     misread as disagreeing. */
  const visible = search
    ? images.filter(image => image.original_name.toLowerCase().includes(search.toLowerCase()))
    : images

  const changeStatus = (next: string) => {
    setStatus(next)
    setPage(1)
  }

  return (
    <div className="page-enter">
      <PageHeader
        title="My Images"
        subtitle={
          loading ? 'Loading…'
          : search ? `${visible.length} of ${images.length} on this page match “${search}”`
          : `${total} image${total === 1 ? '' : 's'}${status ? ` marked ${status.replace('_', ' ')}` : ''}`
        }
      />

      {isDemo && (
        <div className="p-3 mb-6 rounded-2xl text-xs flex items-center gap-2 bg-surface-mute border border-line text-ink-soft">
          <AlertTriangle className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
          Showing demo data. Set <code className="fc-kbd">VITE_USE_API=true</code> to see your real uploads.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <SearchInput
          placeholder="Search this page by filename…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64"
        />
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map(filter => {
            const isActive = status === filter.value
            return (
              <button
                key={filter.value || 'all'}
                onClick={() => changeStatus(filter.value)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                style={{
                  background: isActive ? 'rgba(249,115,22, 0.14)' : 'rgb(var(--a-surface-mute))',
                  border: isActive ? '1px solid rgba(249,115,22, 0.24)' : '1px solid rgb(var(--a-line))',
                  color: isActive ? '#FB923C' : 'rgb(var(--a-ink-mute))',
                  boxShadow: isActive ? '0 0 15px rgba(249,115,22, 0.1)' : 'none',
                }}
              >
                {filter.label}
              </button>
            )
          })}
        </div>
      </div>

      {loading && (
        <div className="text-center py-20 text-ink-faint">
          <Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin" />
          <p className="text-xs font-semibold">Loading your images…</p>
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-20">
          <AlertTriangle className="w-7 h-7 mx-auto mb-3 text-[#EF4444]" />
          <p className="text-xs font-semibold text-ink">{error}</p>
          <button
            type="button"
            onClick={reload}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#FB923C] hover:underline cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />Try again
          </button>
        </div>
      )}

      {!loading && !error && visible.length === 0 && (
        <EmptyState
          icon={Images}
          title={images.length === 0 ? 'No images yet' : 'Nothing matches that search'}
          description={
            images.length === 0
              ? 'Upload a photo and it will appear here once the pipeline has looked at it.'
              : 'Try a different filename, or clear the filters.'
          }
          action={{
            label: images.length === 0 ? 'Upload images' : 'Clear filters',
            onClick: () => {
              if (images.length === 0) window.location.assign('/dashboard/upload')
              else { setSearch(''); changeStatus('') }
            },
          }}
        />
      )}

      {!loading && !error && visible.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
            {visible.map(image => <ImageCard key={image.id} image={image} />)}
          </div>

          {(data?.next || data?.previous) && (
            <div className="flex items-center justify-center gap-3 mt-8 text-xs">
              <button
                type="button"
                disabled={!data?.previous}
                onClick={() => setPage(current => Math.max(1, current - 1))}
                className="px-4 py-2 rounded-xl font-semibold border border-line text-ink-soft hover:text-ink transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default"
              >
                Previous
              </button>
              <span className="text-ink-mute">Page {page}</span>
              <button
                type="button"
                disabled={!data?.next}
                onClick={() => setPage(current => current + 1)}
                className="px-4 py-2 rounded-xl font-semibold border border-line text-ink-soft hover:text-ink transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
