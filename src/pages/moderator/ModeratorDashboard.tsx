import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { mockReviewItems, mockModeratorAudit } from '../../data/mock'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function ModeratorDashboard() {
  const pendingCount = mockReviewItems.filter(r => r.status === 'pending').length
  const approvedCount = mockReviewItems.filter(r => r.status === 'approved').length
  const rejectedCount = mockReviewItems.filter(r => r.status === 'rejected').length

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Moderator Dashboard"
        subtitle="Manage pending reviews queues, correct classification clusters, and audit overrides."
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Pending Reviews', value: pendingCount.toLocaleString(), color: 'text-accent' },
          { label: 'Approved manually', value: approvedCount.toLocaleString(), color: 'text-emerald-600' },
          { label: 'Rejected manually', value: rejectedCount.toLocaleString(), color: 'text-accent-soft' },
          { label: 'Audit Entries', value: mockModeratorAudit.length.toLocaleString(), color: 'text-ink' }
        ].map(item => (
          <div key={item.label} className="fc-card p-6 space-y-2">
            <span className="text-[10px] text-ink-mute font-bold uppercase tracking-wider block">{item.label}</span>
            <span className={`text-lg font-bold block ${item.color}`}>{item.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Queue preview */}
        <div className="lg:col-span-8 space-y-6">
          <ChartCard title="Active Review Queue Summary" subtitle="Next items in manual override pipeline">
            <div className="space-y-4">
              {mockReviewItems.filter(r => r.status === 'pending').slice(0, 3).map(item => (
                <div key={item.id} className="p-4 rounded-3xl bg-surface-mute border border-line flex items-center justify-between text-xs">
                  <div className="flex gap-3 items-center min-w-0">
                    <div className="w-10 h-10 rounded-xl border border-line flex-shrink-0" style={{ backgroundColor: item.thumbnail }} />
                    <div className="min-w-0">
                      <p className="font-bold text-ink truncate max-w-[200px]">{item.filename}</p>
                      <p className="text-[10px] text-ink-mute mt-0.5">Uploaded by: {item.uploadedBy}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="badge-error text-[8px]">{item.rejectionReason}</span>
                    <Link to={`/moderator/images/${item.id}`} className="fc-btn-primary !py-1.5 !px-3 text-[10px] font-bold">
                      Review <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        {/* Right Column: Decisions statistics */}
        <div className="lg:col-span-4 space-y-6">
          <ChartCard title="Quality Overrides Distribution" subtitle="Approval rate analytics">
            <div className="space-y-4">
              <div className="p-4 rounded-3xl bg-surface-mute border border-line space-y-3.5 text-xs text-ink-mute">
                <div className="flex justify-between">
                  <span>Approval decisions:</span>
                  <span className="font-bold text-emerald-600">{approvedCount} overrides</span>
                </div>
                <div className="flex justify-between">
                  <span>Rejection confirmations:</span>
                  <span className="font-bold text-accent-soft">{rejectedCount} files</span>
                </div>
                <div className="flex justify-between">
                  <span>Manual Override Rate:</span>
                  <span className="font-bold text-ink">
                    {approvedCount + rejectedCount > 0 ? `${Math.round((approvedCount / (approvedCount + rejectedCount)) * 100)}%` : '0%'}
                  </span>
                </div>
              </div>
            </div>
          </ChartCard>
        </div>

      </div>
    </div>
  )
}
