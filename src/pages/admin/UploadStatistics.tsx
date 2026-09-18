import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { mockUploadStats } from '../../data/mock'
import { FileImage, Files, FolderArchive, ArrowUpRight } from 'lucide-react'

export default function UploadStatistics() {
  const stats = mockUploadStats

  return (
    <div className="space-y-6 page-enter">
      <PageHeader 
        title="Upload Statistics"
        subtitle="Audit raw ingestion counts, daily size charts, and pipeline throughput performance logs."
      />

      {/* Cards stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Ingested Images', value: stats.totalUploads.toLocaleString(), sub: '+12% vs last week' },
          { label: 'Uploads Today', value: stats.uploadsToday.toLocaleString(), sub: '+8% vs yesterday' },
          { label: 'Average File Size', value: stats.averageUploadSize, sub: 'Optimized via S3 buckets' },
          { label: 'ZIP Archive Uploads', value: stats.zipUploadsCount.toLocaleString(), sub: 'Calculated over 30 days' }
        ].map(item => (
          <div key={item.label} className="fc-card p-6 space-y-2">
            <span className="text-[10px] text-ink-mute font-bold uppercase tracking-wider block">{item.label}</span>
            <span className="text-xl font-bold text-ink block">{item.value}</span>
            <span className="text-[10px] text-[#059669] font-semibold flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> {item.sub}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Upload Ingestion Types breakdown */}
        <div className="lg:col-span-5 space-y-6">
          <ChartCard title="Upload Ingestion Pipeline Breakdown" subtitle="Relative distribution of file upload methods">
            <div className="space-y-4">
              {[
                { label: 'Single Uploads', count: stats.singleUploadsCount, icon: FileImage, color: '#6366F1' },
                { label: 'Batch Multiple Uploads', count: stats.multipleUploadsCount, icon: Files, color: '#059669' },
                { label: 'ZIP File Archives', count: stats.zipUploadsCount, icon: FolderArchive, color: '#6D28D9' }
              ].map(item => {
                const total = stats.singleUploadsCount + stats.multipleUploadsCount + stats.zipUploadsCount
                const percent = Math.round((item.count / total) * 100)
                return (
                  <div key={item.label} className="p-4 rounded-3xl bg-surface-mute border border-line space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <item.icon className="w-4 h-4" style={{ color: item.color }} />
                        <span className="font-bold text-ink">{item.label}</span>
                      </div>
                      <span className="font-bold text-ink">{item.count.toLocaleString()} files ({percent}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-mute rounded-full overflow-hidden">
                      <div 
                        className="h-full" 
                        style={{
                          width: `${percent}%`,
                          background: item.color
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </ChartCard>
        </div>

        {/* Right Column: Daily ingestion loads */}
        <div className="lg:col-span-7 space-y-6">
          <ChartCard title="Daily Ingestion Load (Past 7 Days)" subtitle="Total files unpacked by worker nodes">
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-[10px] font-bold text-ink-faint pb-2 border-b border-line">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#4F46E5] rounded" /> Single</div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#059669] rounded" /> Multiple</div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-[#4338CA] rounded" /> ZIP</div>
              </div>

              <div className="space-y-3.5 pt-2">
                {stats.uploadsPerDay.map(day => {
                  const dayTotal = day.single + day.multiple + day.zip
                  return (
                    <div key={day.date} className="grid grid-cols-12 items-center gap-3 text-xs">
                      <span className="col-span-2 font-bold text-ink-soft">{day.date}</span>
                      <div className="col-span-8 flex h-4 rounded overflow-hidden bg-surface-mute">
                        <div className="bg-[#4F46E5]" style={{ width: `${(day.single / dayTotal) * 100}%` }} />
                        <div className="bg-[#059669]" style={{ width: `${(day.multiple / dayTotal) * 100}%` }} />
                        <div className="bg-[#4338CA]" style={{ width: `${(day.zip / dayTotal) * 100}%` }} />
                      </div>
                      <span className="col-span-2 text-right font-bold text-ink">{dayTotal} files</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </ChartCard>
        </div>

      </div>
    </div>
  )
}
