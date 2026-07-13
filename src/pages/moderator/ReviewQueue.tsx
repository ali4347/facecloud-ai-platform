import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { mockReviewItems } from '../../data/mock'
import { formatDateTime } from '../../lib/utils'
import { Search, ArrowRight } from 'lucide-react'

export default function ReviewQueue() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterReason, setFilterReason] = useState('all')
  const [filterRisk, setFilterRisk] = useState('all')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')

  // Apply filters
  const filtered = mockReviewItems.filter(item => {
    const matchesSearch = item.filename.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesReason = filterReason === 'all' || item.rejectionReason.toLowerCase().includes(filterReason.toLowerCase())
    const matchesRisk = filterRisk === 'all' || item.riskLevel === filterRisk
    return matchesSearch && matchesReason && matchesRisk
  }).sort((a, b) => {
    if (sortOrder === 'newest') return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
  })

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="Moderator Review Queue"
        subtitle={`${filtered.filter(r => r.status === 'pending').length} images awaiting review`}
      />

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-3xl bg-white/[0.03] border border-white/[0.08] text-xs text-white/80">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-white/40" />
          <input 
            type="text" 
            placeholder="Search filename or user..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="fc-input !pl-10 !py-2.5"
          />
        </div>

        {/* Filter Reason */}
        <select 
          value={filterReason}
          onChange={e => setFilterReason(e.target.value)}
          className="fc-input !py-2.5 text-white"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <option value="all" className="bg-[#05070A] text-white">All Rejection Reasons</option>
          <option value="blurry" className="bg-[#05070A] text-white">Too Blurry</option>
          <option value="dark" className="bg-[#05070A] text-white">Too Dark</option>
          <option value="multiple" className="bg-[#05070A] text-white">Multiple Faces</option>
          <option value="not detected" className="bg-[#05070A] text-white">Face Not Detected</option>
        </select>

        {/* Filter Risk */}
        <select 
          value={filterRisk}
          onChange={e => setFilterRisk(e.target.value)}
          className="fc-input !py-2.5 text-white"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <option value="all" className="bg-[#05070A] text-white">All Risk Levels</option>
          <option value="low" className="bg-[#05070A] text-white">Low Risk</option>
          <option value="medium" className="bg-[#05070A] text-white">Medium Risk</option>
          <option value="high" className="bg-[#05070A] text-white">High Risk</option>
          <option value="critical" className="bg-[#05070A] text-white">Critical Risk</option>
        </select>

        {/* Sort */}
        <select 
          value={sortOrder}
          onChange={e => setSortOrder(e.target.value as any)}
          className="fc-input !py-2.5 text-white"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <option value="newest" className="bg-[#05070A] text-white">Sort: Newest First</option>
          <option value="oldest" className="bg-[#05070A] text-white">Sort: Oldest First</option>
        </select>
      </div>

      {/* Queue Table */}
      <ChartCard title="Review Items Queue" subtitle="Audited assets pending manual review override">
        <div className="overflow-x-auto">
          <table className="w-full fc-table">
            <thead>
              <tr>
                <th>Image Preview</th>
                <th>Filename</th>
                <th>AI Decision / Risk</th>
                <th>Uploaded By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <tr key={row.id}>
                  <td>
                    <div className="w-12 h-12 rounded-xl border border-white/[0.08] flex-shrink-0" style={{ backgroundColor: row.thumbnail }} />
                  </td>
                  <td>
                    <div className="text-xs text-white/80 min-w-0 pr-2">
                      <p className="font-bold truncate max-w-[180px]">{row.filename}</p>
                      <p className="text-[10px] text-white/40">Uploaded: {formatDateTime(row.uploadedAt)}</p>
                    </div>
                  </td>
                  <td>
                    <div className="space-y-1">
                      <span className="badge-error block w-fit text-[9px]">{row.rejectionReason}</span>
                      <span className={`badge text-[9px] ${
                        row.riskLevel === 'critical' ? 'badge-error' :
                        row.riskLevel === 'high' ? 'badge-warning' : 'badge-info'
                      }`}>
                        {row.riskLevel} risk
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="text-xs text-white/80">{row.uploadedBy}</span>
                  </td>
                  <td>
                    {row.status === 'pending' ? (
                      <Link 
                        to={`/moderator/images/${row.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#60B1FF] hover:underline"
                      >
                        Open Review <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <span className="text-xs text-white/40 capitalize font-semibold">{row.status}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  )
}
