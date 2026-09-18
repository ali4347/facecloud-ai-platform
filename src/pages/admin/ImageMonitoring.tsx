import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { ChartCard } from '../../components/ui/ChartCard'
import { mockImages } from '../../data/mock'
import { ArrowRight } from 'lucide-react'

export default function ImageMonitoring() {
  const [list] = useState(mockImages)

  return (
    <div className="space-y-6 page-enter">
      <PageHeader 
        title="Image Monitoring"
        subtitle="Global directory check of all user-uploaded and AI-processed face assets."
      />

      <ChartCard title="Global Upload Logs" subtitle="Continuous ingestion audit feed">
        <div className="overflow-x-auto">
          <table className="w-full fc-table">
            <thead>
              <tr>
                <th>Filename</th>
                <th>Asset Details</th>
                <th>Validation Status</th>
                <th>Quality Index</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map(img => (
                <tr key={img.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg border border-line flex-shrink-0" style={{ backgroundColor: img.thumbnail }} />
                      <div className="min-w-0">
                        <p className="font-bold text-ink truncate max-w-[200px]">{img.filename}</p>
                        <p className="text-[10px] text-ink-faint">ID: {img.id}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="text-xs text-ink-soft space-y-0.5">
                      <p>Size: {img.size}</p>
                      <p className="text-[10px] text-ink-faint font-mono">{img.dimensions}</p>
                    </div>
                  </td>
                  <td>
                    <span className={`badge text-[9px] ${
                      img.status === 'completed' ? 'badge-success' : 'badge-error'
                    }`}>
                      {img.status}
                    </span>
                  </td>
                  <td>
                    <div className="text-xs text-ink-soft">
                      <p>Blur Score: <strong className={img.blurScore >= 60 ? 'text-[#059669]' : 'text-[#DC2626]'}>{img.blurScore}</strong></p>
                      <p className="text-[10px] text-ink-faint">Brightness: {img.brightnessScore}</p>
                    </div>
                  </td>
                  <td>
                    <Link 
                      to={`/dashboard/images/${img.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6366F1] hover:underline"
                    >
                      Audit Details <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
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
