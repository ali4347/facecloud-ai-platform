import { useState } from 'react'
import { Images } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { ImageCard } from '../../components/features/ImageCard'
import { SearchInput } from '../../components/ui/SearchInput'
import { EmptyState } from '../../components/ui/EmptyState'
import { mockImages } from '../../data/mock'

const STATUS_FILTERS = ['All', 'completed', 'rejected', 'enhancing', 'validating']

export default function MyImages() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const filtered = mockImages.filter(img => {
    const matchSearch = img.filename.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'All' || img.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="page-enter">
      <PageHeader
        title="My Images"
        subtitle={`${mockImages.length} total images · ${mockImages.filter(i => i.enhanced).length} enhanced`}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <SearchInput
          placeholder="Search by filename…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64"
        />
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map(s => {
            const isActive = statusFilter === s
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all capitalize cursor-pointer"
                style={{
                  background: isActive ? 'rgba(249,115,22, 0.14)' : '#16181C',
                  border: isActive ? '1px solid rgba(249,115,22, 0.24)' : '1px solid rgba(255,255,255,0.10)',
                  color: isActive ? '#FB923C' : 'rgba(255,255,255,0.52)',
                  boxShadow: isActive ? '0 0 15px rgba(249,115,22, 0.1)' : 'none',
                }}
              >
                {s === 'All' ? 'All' : s}
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Images}
          title="No images found"
          description="Try adjusting your search or filter to find images."
          action={{ label: 'Clear filters', onClick: () => { setSearch(''); setStatusFilter('All') } }}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
          {filtered.map(img => (
            <ImageCard key={img.id} image={img} />
          ))}
        </div>
      )}
    </div>
  )
}
