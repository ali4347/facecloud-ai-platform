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
                      <div className="w-8 h-8 rounded-lg border border-white/[0.08] flex-shrink-0" style={{ backgroundColor: img.thumbnail }} />
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate max-w-[200px]">{img.filename}</p>
                        <p className="text-[10px] text-white/40">ID: {img.id}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="text-xs text-white/80 space-y-0.5">
                      <p>Size: {img.size}</p>
                      <p className="text-[10px] text-white/40 font-mono">{img.dimensions}</p>
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
                    <div className="text-xs text-white/80">
                      <p>Blur Score: <strong className={img.blurScore >= 60 ? 'text-[#4FFFB0]' : 'text-[#F87171]'}>{img.blurScore}</strong></p>
                      <p className="text-[10px] text-white/40">Brightness: {img.brightnessScore}</p>
                    </div>
                  </td>
                  <td>
                    <Link 
                      to={`/dashboard/images/${img.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#60B1FF] hover:underline"
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
