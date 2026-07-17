import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { mockReviewItems } from '../../data/mock'
import { formatDateTime } from '../../lib/utils'
import { Search, ArrowRight, Eye } from 'lucide-react'

export default function ReviewQueue() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'rejected' | 'duplicate'>('all')
  const [filterReason, setFilterReason] = useState('all')
  const [filterRisk, setFilterRisk] = useState('all')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')

  // Apply filters
  const filtered = mockReviewItems.filter(item => {
    const matchesSearch = item.filename.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Type filter
    let matchesType = true
    if (filterType === 'rejected') {
      matchesType = !item.isDuplicate
    } else if (filterType === 'duplicate') {
      matchesType = !!item.isDuplicate
    }

    // Reason filter
    let matchesReason = true
    if (filterReason !== 'all') {
      if (filterReason === 'duplicate') {
        matchesReason = !!item.isDuplicate
      } else {
        matchesReason = !item.isDuplicate && item.rejectionReason.toLowerCase().includes(filterReason.toLowerCase())
      }
    }

    // Risk level filter
    const matchesRisk = filterRisk === 'all' || item.riskLevel === filterRisk

    return matchesSearch && matchesType && matchesReason && matchesRisk
  }).sort((a, b) => {
    if (sortOrder === 'newest') return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
  })

  const pendingCount = filtered.filter(r => r.status === 'pending').length

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="Review & Duplicate Queue"
        subtitle={`${pendingCount} assets awaiting manual moderator verification`}
      />

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 rounded-3xl bg-white/[0.03] border border-white/[0.08] text-xs text-white/80">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-white/40" />
          <input 
            type="text" 
            placeholder="Search filename or user..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="fc-input !pl-10 !py-2"
          />
        </div>

        {/* Filter Type */}
        <select 
          value={filterType}
          onChange={e => setFilterType(e.target.value as any)}
          className="fc-input text-white"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <option value="all" className="bg-[#05070A]">All Queue Types</option>
          <option value="rejected" className="bg-[#05070A]">Rejections Only</option>
          <option value="duplicate" className="bg-[#05070A]">Duplicates Only</option>
        </select>

        {/* Filter Reason */}
        <select 
          value={filterReason}
          onChange={e => setFilterReason(e.target.value)}
          className="fc-input text-white"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <option value="all" className="bg-[#05070A]">All Flags/Reasons</option>
          <option value="blurry" className="bg-[#05070A]">Too Blurry</option>
          <option value="dark" className="bg-[#05070A]">Too Dark</option>
          <option value="multiple" className="bg-[#05070A]">Multiple Faces</option>
          <option value="not detected" className="bg-[#05070A]">Face Not Detected</option>
          <option value="duplicate" className="bg-[#05070A]">Duplicate Upload</option>
        </select>

        {/* Filter Risk */}
        <select 
          value={filterRisk}
          onChange={e => setFilterRisk(e.target.value)}
          className="fc-input text-white"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <option value="all" className="bg-[#05070A]">All Risk Levels</option>
          <option value="low" className="bg-[#05070A]">Low Risk</option>
          <option value="medium" className="bg-[#05070A]">Medium Risk</option>
          <option value="high" className="bg-[#05070A]">High Risk</option>
          <option value="critical" className="bg-[#05070A]">Critical Risk</option>
        </select>

        {/* Sort */}
        <select 
          value={sortOrder}
          onChange={e => setSortOrder(e.target.value as any)}
          className="fc-input text-white"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          <option value="newest" className="bg-[#05070A]">Sort: Newest First</option>
          <option value="oldest" className="bg-[#05070A]">Sort: Oldest First</option>
        </select>
      </div>

      {/* Queue Table */}
      <ChartCard title="Verification Backlog Queue" subtitle="Inspect and confirm pipeline quality exceptions and duplicates">
        <div className="overflow-x-auto">
          <table className="w-full fc-table text-left">
            <thead>
              <tr>
                <th>Image</th>
                <th>Filename</th>
                <th>AI Exception Category</th>
                <th>Risk Level</th>
                <th>Uploaded By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <tr key={row.id} className="hover:bg-white/[0.01] transition-colors">
                  <td>
                    <div className="w-10 h-10 rounded-xl border border-white/[0.08]" style={{ backgroundColor: row.thumbnail }} />
                  </td>
                  <td>
                    <div className="text-xs text-white/80 min-w-0 pr-2">
                      <p className="font-bold truncate max-w-[200px] text-white">{row.filename}</p>
                      <p className="text-[10px] text-white/40 mt-0.5">Uploaded: {formatDateTime(row.uploadedAt)}</p>
                    </div>
                  </td>
                  <td>
                    {row.isDuplicate ? (
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          Duplicate
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-white/[0.05] text-white/60">
                          {row.similarityScore}% match
                        </span>
                      </div>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-[#EF4444]/10 text-red-400 border border-[#EF4444]/20">
                        {row.rejectionReason}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      row.riskLevel === 'critical' ? 'bg-[#EF4444]/10 text-[#EF4444]' :
                      row.riskLevel === 'high' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' :
                      'bg-[#0084FF]/10 text-[#60B1FF]'
                    }`}>
                      {row.riskLevel} risk
                    </span>
                  </td>
                  <td>
                    <span className="text-xs text-white/70">{row.uploadedBy}</span>
                  </td>
                  <td>
                    {row.status === 'pending' ? (
                      <Link 
                        to={`/moderator/images/${row.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#60B1FF] hover:underline"
                      >
                        Open Review <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        row.status === 'approved' ? 'text-[#4FFFB0]' : 'text-[#EF4444]'
                      }`}>
                        {row.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-white/40">
            <Eye className="w-8 h-8 mx-auto mb-3 opacity-30 animate-pulse" />
            <p className="text-xs font-semibold">Review queue is empty.</p>
            <p className="text-[10px] text-white/20 mt-1">All quality pipeline alerts have been cleared.</p>
          </div>
        )}
      </ChartCard>
    </div>
  )
}
